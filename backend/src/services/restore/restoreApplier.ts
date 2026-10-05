import type { RepositoryBundle } from "../../repositories";
import type { Ctx } from "../../repositories/ports/RepoContext";
import { RESTORABLE_STATUSES } from "../../constants/TicketStatus";
import type { TicketStatus } from "../../constants/TicketStatus";
import type { RestoreConfirmation } from "../../models/RestoreConfirmation";
import type { RestoreOutcome } from "../../types/RestoreOutcome";
import type { RestoreSnapshot } from "../../types/RestoreSnapshot";
import { recomputeAssetAndFaults } from "./recomputeOutcome";
import { notFound, conflict as conflictError } from "../../utils/errors";
import { renderConflictReason, renderLog } from "../../utils/logRenderer";
import { toOutcomeAuditDetail } from "../../utils/auditDetail";

export type ConflictSnapshot = Extract<RestoreSnapshot, { kind: "CONFLICT" }>;

/** 单事务应用结果：要么正常生效，要么发现自己是后到者 */
export type ApplyResult =
  | { outcome: "RESTORED"; outcomeData: RestoreOutcome; attempts: number }
  | { outcome: "CONFLICT"; winnerRequestId: string | null; winnerDispatcherId: number; confirmedAt: string; currentStatus: TicketStatus | string; attempts: number };

/**
 * 在单个数据库事务内把一次复电确认应用到四类处置对象：
 * 工单（乐观锁）、资产（按当前关联工单重算）、故障报修、班组（仅当前在途工单释放）。
 * 任一步失败整体回滚，由外层从最近确认状态重试。
 */
export const applyConfirmationInTx = async (
  repos: RepositoryBundle,
  ctx: Ctx,
  confirmation: RestoreConfirmation,
  attempts: number
): Promise<ApplyResult> => {
  const ticket = await repos.repairTicket.findByIdForUpdate(ctx, confirmation.ticket_id);
  if (!ticket) {
    throw notFound("TICKET_NOT_FOUND", { ticketId: confirmation.ticket_id });
  }

  // 工单已被先到的调度员复电 -> 当前请求竞争失败
  if (ticket.status === "RESTORED" || ticket.status === "CLOSED") {
    return {
      outcome: "CONFLICT",
      winnerRequestId: ticket.restore_request_id,
      winnerDispatcherId: ticket.restored_by ?? 0,
      confirmedAt: ticket.restored_at ?? "",
      currentStatus: ticket.status,
      attempts
    };
  }

  if (!RESTORABLE_STATUSES.has(ticket.status as TicketStatus)) {
    throw conflictError("TICKET_NOT_RESTORABLE", {
      ticketId: ticket.id,
      status: ticket.status
    });
  }

  const expectedVersion = ticket.version;
  const { changed, ticket: updatedTicket } = await repos.repairTicket.applyRestore(ctx, ticket.id, expectedVersion, {
    status: "RESTORED",
    restored_at: confirmation.restored_at,
    restored_by: confirmation.dispatcher_id,
    restore_request_id: confirmation.request_id,
    version: expectedVersion
  });

  // 并发下乐观锁失败：另一事务已先提交，自己是后到者
  if (!changed || !updatedTicket) {
    const latest = await repos.repairTicket.findByIdForUpdate(ctx, ticket.id);
    return {
      outcome: "CONFLICT",
      winnerRequestId: latest?.restore_request_id ?? null,
      winnerDispatcherId: latest?.restored_by ?? 0,
      confirmedAt: latest?.restored_at ?? "",
      currentStatus: latest?.status ?? "RESTORED",
      attempts
    };
  }

  const faultReport = await repos.faultReport.findById(ctx, updatedTicket.fault_report_id, true);
  if (!faultReport) {
    throw notFound("FAULT_REPORT_NOT_FOUND", { faultReportId: updatedTicket.fault_report_id });
  }

  // 资产：先取到关联报修，再锁定该资产当前关联的全部工单
  const asset = await repos.gridAsset.findById(ctx, faultReport.asset_id, true);
  if (!asset) {
    throw notFound("ASSET_NOT_FOUND", { assetId: faultReport.asset_id });
  }
  const relatedFaults = (await repos.faultReport.findAll(ctx)).filter(
    (f) => f.asset_id === asset.id
  );
  const relatedTickets = await repos.repairTicket.findByFaultReportIdsForUpdate(
    ctx,
    relatedFaults.map((f) => f.id)
  );

  // 每张单复电都按“当前关联工单”重新计算
  const recompute = recomputeAssetAndFaults({
    relatedTickets,
    faultReports: relatedFaults,
    asset
  });

  const updatedAsset = await repos.gridAsset.updateHealth(
    ctx,
    asset.id,
    recompute.targetAssetHealth
  );

  for (const relatedFault of relatedFaults) {
    const target = recompute.faultStatusByReport.get(relatedFault.id);
    if (target && relatedFault.status !== target) {
      await repos.faultReport.updateStatus(ctx, relatedFault.id, target);
    }
  }
  const updatedFaultReport = await repos.faultReport.findById(ctx, faultReport.id);

  // 班组：仅当当前在途工单仍是这张复电工单时释放，防止提前释放另一张在途工单的班组
  let crew = await repos.crew.findById(ctx, updatedTicket.team_id);
  let crewReleased = false;
  if (crew) {
    const release = await repos.crew.releaseIfCurrentTicket(
      ctx,
      crew.id,
      updatedTicket.id,
      "AVAILABLE"
    );
    crew = release.crew;
    crewReleased = release.released;
  } else {
    throw notFound("CREW_NOT_FOUND", { crewId: updatedTicket.team_id });
  }

  const outcomeData: RestoreOutcome = {
    ticket: updatedTicket,
    asset: updatedAsset ?? asset,
    faultReport: updatedFaultReport ?? faultReport,
    crew,
    activeTicketIds: recompute.activeTicketIds,
    crewReleased
  };

  await repos.auditLog.append(ctx, {
    actor: `dispatcher:${confirmation.dispatcher_id}`,
    action: renderLog("RepairTicket", 3, {
      ticketId: updatedTicket.id,
      requestId: confirmation.request_id,
      dispatcherId: confirmation.dispatcher_id,
      restoredAt: confirmation.restored_at
    }),
    target_type: "RepairTicket",
    target_id: String(updatedTicket.id),
    detail: toOutcomeAuditDetail(outcomeData),
    created_at: confirmation.restored_at
  });

  if (crewReleased) {
    await repos.auditLog.append(ctx, {
      actor: `dispatcher:${confirmation.dispatcher_id}`,
      action: renderLog("Crew", 3, {
        ticketId: updatedTicket.id,
        crewId: crew?.id
      }),
      target_type: "Crew",
      target_id: String(crew?.id),
      detail: renderLog("GridAsset", 2, {
        assetCode: outcomeData.asset.asset_code,
        from: asset.health_status,
        to: outcomeData.asset.health_status,
        ticketIds: recompute.activeTicketIds.join(",") || "none"
      }),
      created_at: confirmation.restored_at
    });
  }

  return { outcome: "RESTORED", outcomeData, attempts };
};

/** 竞争失败时构建冲突快照（先到者结果以当前数据为准） */
export const buildConflictSnapshot = async (
  repos: RepositoryBundle,
  ctx: Ctx,
  confirmation: RestoreConfirmation,
  result: Extract<ApplyResult, { outcome: "CONFLICT" }>
): Promise<ConflictSnapshot> => {
  const winnerTicket = await repos.repairTicket.findById(ctx, confirmation.ticket_id);
  const winnerFault = winnerTicket
    ? await repos.faultReport.findById(ctx, winnerTicket.fault_report_id)
    : null;
  const winnerAsset = winnerFault
    ? await repos.gridAsset.findById(ctx, winnerFault.asset_id)
    : null;
  const winnerCrew = winnerTicket ? await repos.crew.findById(ctx, winnerTicket.team_id) : null;
  const relatedFaults = winnerAsset
    ? (await repos.faultReport.findAll(ctx)).filter((f) => f.asset_id === winnerAsset.id)
    : [];
  const relatedTickets = winnerAsset
    ? await repos.repairTicket.findByFaultReportIdsForUpdate(
        ctx,
        relatedFaults.map((f) => f.id)
      )
    : [];
  const recompute = winnerAsset && winnerFault
    ? recomputeAssetAndFaults({
        relatedTickets,
        faultReports: relatedFaults,
        asset: winnerAsset
      })
    : null;

  const reason = renderConflictReason({
    ticketId: confirmation.ticket_id,
    winnerDispatcher: result.winnerDispatcherId,
    loserDispatcher: confirmation.dispatcher_id,
    confirmedAt: result.confirmedAt,
    currentStatus: result.currentStatus
  });

  return {
    kind: "CONFLICT",
    winnerOutcome: {
      ticket: winnerTicket ?? ({} as never),
      asset: winnerAsset ?? ({} as never),
      faultReport: winnerFault ?? ({} as never),
      crew: winnerCrew,
      activeTicketIds: recompute?.activeTicketIds ?? [],
      crewReleased: winnerCrew?.current_ticket_id !== confirmation.ticket_id
    },
    conflict: {
      winnerDispatcherId: result.winnerDispatcherId,
      loserDispatcherId: confirmation.dispatcher_id,
      reason
    }
  };
};

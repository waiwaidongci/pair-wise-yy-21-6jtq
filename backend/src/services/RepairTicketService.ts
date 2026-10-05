import { repositories, type RepositoryBundle } from "../repositories";
import { createRestoreConfirmationService } from "./restore/RestoreConfirmationService";
import type { RestorePayload } from "../types/RestorePayload";
import type { RestoreResponse } from "../types/RestoreOutcome";
import { notFound } from "../utils/errors";

/**
 * 抢修工单应用服务：复电确认不直接改资产/班组，
 * 统一交给 RestoreConfirmationService 产出同一份处置依据。
 */
export const createRepairTicketService = (repos: RepositoryBundle) => {
  const restoreService = createRestoreConfirmationService(repos);

  return {
    list: () => repos.db.read((tx) => repos.repairTicket.findAll(tx)),

    detail: async (id: number) => {
      const ticket = await repos.db.read((tx) => repos.repairTicket.findById(tx, id));
      if (!ticket) throw notFound("TICKET_NOT_FOUND", { ticketId: id });
      return ticket;
    },

    create: (row: unknown) =>
      repos.db.transaction((tx) => repos.repairTicket.save(tx, row as never)),

    /** 复电确认：幂等 + 并发先到者生效 + 四件套联动 */
    restore: async (
      ticketId: number,
      dispatcherId: number,
      payload: RestorePayload
    ): Promise<RestoreResponse> => {
      // 工单必须存在（不存在直接 404，不产生确认记录）
      const ticket = await repos.db.read((tx) => repos.repairTicket.findById(tx, ticketId));
      if (!ticket) throw notFound("TICKET_NOT_FOUND", { ticketId });
      return restoreService.confirm({
        ticketId,
        dispatcherId,
        requestId: payload.requestId,
        restoredAt: payload.restoredAt
      });
    },

    /** 服务启动续作：把重启前停在 CONFIRMED 的复电结果补完成 */
    recoverPendingRestores: () => restoreService.recoverPending()
  };
};

export const repairTicketService = createRepairTicketService(repositories);
export type RepairTicketService = ReturnType<typeof createRepairTicketService>;

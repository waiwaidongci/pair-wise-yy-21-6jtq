import type { RepositoryBundle } from "./repositories";
import type { MemoryTables } from "./repositories/memory/MemoryStore";

/**
 * 本地种子：asset-10kV-F01 这条线路同时挂着两张在途抢修单（T-1001/T-1002），
 * 用来验证“一张复电不提前恢复资产、两张都复电才恢复正常”。
 */
export const buildSeedTables = (): Omit<MemoryTables, "restoreConfirmation" | "auditLog"> => {
  const assignedAt = "2026-10-05T01:30:00.000Z";
  return {
    gridAsset: [
      {
        id: 1,
        asset_code: "ASSET-10KV-F01",
        asset_type: "OUTAGE",
        feeder_line: "10kV-F01 馈线",
        voltage_level: "10kV",
        location_desc: "朝阳路 3 号环网柜",
        health_status: "DEGRADED",
        baseline_health_status: "NORMAL",
        owner_team_id: 1
      },
      {
        id: 2,
        asset_code: "ASSET-10KV-F07",
        asset_type: "TRIP",
        feeder_line: "10kV-F07 馈线",
        voltage_level: "10kV",
        location_desc: "河西路分支箱",
        health_status: "DEGRADED",
        baseline_health_status: "WATCH",
        owner_team_id: 2
      }
    ],
    faultReport: [
      {
        id: 1,
        reporter_name: "张师傅",
        phone: "13800000001",
        asset_id: 1,
        fault_type: "OUTAGE",
        address_desc: "朝阳路 3 号",
        severity: "HIGH",
        report_channel: "PHONE",
        status: "IN_REPAIR"
      },
      {
        id: 2,
        reporter_name: "李阿姨",
        phone: "13800000002",
        asset_id: 1,
        fault_type: "OUTAGE",
        address_desc: "朝阳路 5 号",
        severity: "HIGH",
        report_channel: "APP",
        status: "IN_REPAIR"
      },
      {
        id: 3,
        reporter_name: "王工",
        phone: "13800000003",
        asset_id: 2,
        fault_type: "TRIP",
        address_desc: "河西路 12 号",
        severity: "MEDIUM",
        report_channel: "PHONE",
        status: "IN_REPAIR"
      }
    ],
    repairTicket: [
      {
        id: 1,
        fault_report_id: 1,
        team_id: 1,
        dispatcher_id: 101,
        priority: "HIGH",
        status: "REPAIRING",
        assigned_at: assignedAt,
        restored_at: null,
        restored_by: null,
        restore_request_id: null,
        version: 0
      },
      {
        id: 2,
        fault_report_id: 2,
        team_id: 2,
        dispatcher_id: 101,
        priority: "HIGH",
        status: "ARRIVED",
        assigned_at: assignedAt,
        restored_at: null,
        restored_by: null,
        restore_request_id: null,
        version: 0
      },
      {
        id: 3,
        fault_report_id: 3,
        team_id: 3,
        dispatcher_id: 102,
        priority: "MEDIUM",
        status: "ASSIGNED",
        assigned_at: assignedAt,
        restored_at: null,
        restored_by: null,
        restore_request_id: null,
        version: 0
      }
    ],
    crew: [
      {
        id: 1,
        name: "抢修一班",
        leader_id: 11,
        skill_tags: "10kV,环网柜",
        duty_status: "ON_TASK",
        current_ticket_id: 1,
        contact_phone: "13900000001"
      },
      {
        id: 2,
        name: "抢修二班",
        leader_id: 22,
        skill_tags: "10kV,架空线",
        duty_status: "ON_TASK",
        current_ticket_id: 2,
        contact_phone: "13900000002"
      },
      {
        id: 3,
        name: "抢修三班",
        leader_id: 33,
        skill_tags: "10kV,分支箱",
        duty_status: "ON_TASK",
        current_ticket_id: 3,
        contact_phone: "13900000003"
      }
    ],
    sparePartUsage: []
  };
};

/** 空库时灌入种子（事务内完成），并直接支持内存数据源 */
export const ensureSeedData = async (repos: RepositoryBundle): Promise<boolean> => {
  const seed = buildSeedTables();
  return repos.db.transaction(async (tx) => {
    const existing = await repos.repairTicket.findAll(tx);
    if (existing.length > 0) return false;
    for (const asset of seed.gridAsset) await repos.gridAsset.save(tx, asset);
    for (const fault of seed.faultReport) await repos.faultReport.save(tx, fault);
    for (const ticket of seed.repairTicket) await repos.repairTicket.save(tx, ticket);
    for (const crew of seed.crew) await repos.crew.save(tx, crew);
    for (const usage of seed.sparePartUsage) await repos.sparePartUsage.save(tx, usage);
    return true;
  });
};

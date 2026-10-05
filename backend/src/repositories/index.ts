import { config } from "../config/env";
import type { Database } from "./ports/Database";
import type { IGridAssetRepository } from "./ports/IGridAssetRepository";
import type { IFaultReportRepository } from "./ports/IFaultReportRepository";
import type { IRepairTicketRepository } from "./ports/IRepairTicketRepository";
import type { ICrewRepository } from "./ports/ICrewRepository";
import type { ISparePartUsageRepository } from "./ports/ISparePartUsageRepository";
import type { IRestoreConfirmationRepository } from "./ports/IRestoreConfirmationRepository";
import type { IAuditLogRepository } from "./ports/IAuditLogRepository";
import { MysqlDatabase } from "./MysqlDatabase";
import { SqlGridAssetRepository } from "./sql/SqlGridAssetRepository";
import { SqlFaultReportRepository } from "./sql/SqlFaultReportRepository";
import { SqlRepairTicketRepository } from "./sql/SqlRepairTicketRepository";
import { SqlCrewRepository } from "./sql/SqlCrewRepository";
import { SqlSparePartUsageRepository } from "./sql/SqlSparePartUsageRepository";
import { SqlRestoreConfirmationRepository } from "./sql/SqlRestoreConfirmationRepository";
import { SqlAuditLogRepository } from "./sql/SqlAuditLogRepository";
import { MemoryStore } from "./memory/MemoryStore";
import { MemoryGridAssetRepository } from "./memory/MemoryGridAssetRepository";
import { MemoryFaultReportRepository } from "./memory/MemoryFaultReportRepository";
import { MemoryRepairTicketRepository } from "./memory/MemoryRepairTicketRepository";
import { MemoryCrewRepository } from "./memory/MemoryCrewRepository";
import { MemorySparePartUsageRepository } from "./memory/MemorySparePartUsageRepository";
import { MemoryRestoreConfirmationRepository } from "./memory/MemoryRestoreConfirmationRepository";
import { MemoryAuditLogRepository } from "./memory/MemoryAuditLogRepository";

/** 一张工单复电要联动的全部仓储（同一份依据） */
export interface RepositoryBundle {
  db: Database;
  gridAsset: IGridAssetRepository;
  faultReport: IFaultReportRepository;
  repairTicket: IRepairTicketRepository;
  crew: ICrewRepository;
  sparePartUsage: ISparePartUsageRepository;
  restoreConfirmation: IRestoreConfirmationRepository;
  auditLog: IAuditLogRepository;
}

export const createRepositories = (database: Database): RepositoryBundle => {
  if (database instanceof MemoryStore) {
    return {
      db: database,
      gridAsset: new MemoryGridAssetRepository(),
      faultReport: new MemoryFaultReportRepository(),
      repairTicket: new MemoryRepairTicketRepository(),
      crew: new MemoryCrewRepository(),
      sparePartUsage: new MemorySparePartUsageRepository(),
      restoreConfirmation: new MemoryRestoreConfirmationRepository(),
      auditLog: new MemoryAuditLogRepository()
    };
  }
  return {
    db: database,
    gridAsset: new SqlGridAssetRepository(),
    faultReport: new SqlFaultReportRepository(),
    repairTicket: new SqlRepairTicketRepository(),
    crew: new SqlCrewRepository(),
    sparePartUsage: new SqlSparePartUsageRepository(),
    restoreConfirmation: new SqlRestoreConfirmationRepository(),
    auditLog: new SqlAuditLogRepository()
  };
};

/** 进程级单例：main 启动、控制器与测试之间共享同一数据源 */
export const repositories: RepositoryBundle = createRepositories(
  config.db.driver === "memory" ? new MemoryStore() : new MysqlDatabase()
);

export { MemoryStore };

export const LOG_TEMPLATES = {
  GridAsset: [
    "GridAsset.create",
    "GridAsset.update",
    "GridAsset.status",
    "GridAsset.export",
    "GridAsset.healthRecompute",
  ],
  FaultReport: [
    "FaultReport.create",
    "FaultReport.update",
    "FaultReport.status",
    "FaultReport.export",
  ],
  RepairTicket: [
    "RepairTicket.create",
    "RepairTicket.update",
    "RepairTicket.status",
    "RepairTicket.restore",
    "RepairTicket.export",
  ],
  Crew: [
    "Crew.create",
    "Crew.update",
    "Crew.status",
    "Crew.release",
    "Crew.export",
  ],
  SparePartUsage: [
    "SparePartUsage.create",
    "SparePartUsage.update",
    "SparePartUsage.status",
    "SparePartUsage.export",
  ],
  Restore: [
    "Restore.request",
    "Restore.idempotent",
    "Restore.conflict",
    "Restore.committed",
    "Restore.retry",
    "Restore.rollback",
    "Restore.failed",
  ],
} as const;

export type LogEntity = keyof typeof LOG_TEMPLATES;

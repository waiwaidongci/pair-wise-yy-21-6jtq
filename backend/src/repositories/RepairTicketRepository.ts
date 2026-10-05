import { store } from "../store";
import type { EntityRow } from "../store/JsonStore";

export const repairTicketRepository = {
  findAll: (): EntityRow[] => store.all("repairTicket"),

  findById: (id: number | string): EntityRow | undefined => store.findById("repairTicket", id),

  /** All tickets linked to an asset through their fault reports. */
  findByAsset: (assetId: number | string): EntityRow[] => {
    const reports = store
      .all("faultReport")
      .filter((report) => String(report.asset_id) === String(assetId));
    const reportIds = new Set(reports.map((report) => report.id));
    return store
      .all("repairTicket")
      .filter((ticket) => reportIds.has(ticket.fault_report_id));
  },

  insert: (row: EntityRow): EntityRow => store.insert("repairTicket", row),

  update: (
    id: number | string,
    patch: EntityRow,
    expectedVersion?: number
  ): EntityRow => store.update("repairTicket", id, patch, { expectedVersion }),
};

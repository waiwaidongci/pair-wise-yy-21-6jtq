import { store } from "../store";
import type { EntityRow } from "../store/JsonStore";

export const sparePartUsageRepository = {
  findAll: (): EntityRow[] => store.all("sparePartUsage"),

  findById: (id: number | string): EntityRow | undefined =>
    store.findById("sparePartUsage", id),

  findByTicket: (ticketId: number | string): EntityRow[] =>
    store
      .all("sparePartUsage")
      .filter((usage) => String(usage.ticket_id) === String(ticketId)),

  insert: (row: EntityRow): EntityRow => store.insert("sparePartUsage", row),

  update: (
    id: number | string,
    patch: EntityRow,
    expectedVersion?: number
  ): EntityRow => store.update("sparePartUsage", id, patch, { expectedVersion }),
};

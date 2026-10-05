import { store } from "../store";
import type { EntityRow } from "../store/JsonStore";

export const crewRepository = {
  findAll: (): EntityRow[] => store.all("crew"),

  findById: (id: number | string): EntityRow | undefined => store.findById("crew", id),

  /** The crew currently dispatched to the given in-transit ticket. */
  findByCurrentTicket: (ticketId: number | string): EntityRow | undefined =>
    store
      .all("crew")
      .find((crew) => String(crew.current_ticket_id) === String(ticketId)),

  insert: (row: EntityRow): EntityRow => store.insert("crew", row),

  update: (
    id: number | string,
    patch: EntityRow,
    expectedVersion?: number
  ): EntityRow => store.update("crew", id, patch, { expectedVersion }),
};

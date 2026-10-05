import { repositories } from "../repositories";

export const sparePartUsageService = {
  list: () => repositories.db.read((tx) => repositories.sparePartUsage.findAll(tx)),
  listByTicket: (ticketId: number) =>
    repositories.db.read((tx) => repositories.sparePartUsage.findByTicketId(tx, ticketId))
};

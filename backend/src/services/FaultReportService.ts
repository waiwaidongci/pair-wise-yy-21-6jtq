import { repositories } from "../repositories";

export const faultReportService = {
  list: () => repositories.db.read((tx) => repositories.faultReport.findAll(tx)),
  detail: (id: number) =>
    repositories.db.read((tx) => repositories.faultReport.findById(tx, id))
};

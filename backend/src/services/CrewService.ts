import { repositories } from "../repositories";

export const crewService = {
  list: () => repositories.db.read((tx) => repositories.crew.findAll(tx)),
  detail: (id: number) =>
    repositories.db.read((tx) => repositories.crew.findById(tx, id))
};

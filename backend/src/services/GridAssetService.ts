import { repositories } from "../repositories";

export const gridAssetService = {
  list: () => repositories.db.read((tx) => repositories.gridAsset.findAll(tx)),
  detail: (id: number) =>
    repositories.db.read((tx) => repositories.gridAsset.findById(tx, id))
};

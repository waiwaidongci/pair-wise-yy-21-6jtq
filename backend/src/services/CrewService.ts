import { crewRepository } from "../repositories/CrewRepository";
import type { EntityRow } from "../store/JsonStore";

export const crewService = {
  list: (): EntityRow[] => crewRepository.findAll(),
  get: (id: number | string): EntityRow | undefined => crewRepository.findById(id),
  create: (row: unknown): EntityRow => crewRepository.insert(row as EntityRow),
};

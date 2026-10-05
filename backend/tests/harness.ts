import { createRepositories, MemoryStore } from "../src/repositories";
import type { RepositoryBundle } from "../src/repositories";
import { buildSeedTables } from "../src/seed";
import { createRepairTicketService } from "../src/services/RepairTicketService";

export interface Harness {
  db: MemoryStore;
  repos: RepositoryBundle;
  ticketService: ReturnType<typeof createRepairTicketService>;
  /** 直接在表里构造工单/班组/资产状态 */
  mutate: (fn: (tables: ReturnType<MemoryStore["getTables"]>) => void) => Promise<void>;
}

/** 每个用例独立的内存库 + 种子 */
export const createHarness = async (): Promise<Harness> => {
  const db = new MemoryStore();
  const seed = buildSeedTables();
  db.seedTables(seed);
  const repos = createRepositories(db);
  return {
    db,
    repos,
    ticketService: createRepairTicketService(repos),
    mutate: async (fn) => {
      const tables = db.getTables();
      fn(tables);
      db.replaceTables(tables);
    }
  };
};

export const tick = () => new Promise((resolve) => setImmediate(resolve));

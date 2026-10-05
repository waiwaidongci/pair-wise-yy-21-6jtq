import { config } from "./config/env";
import { SCHEMA_SQL } from "./config/schema";
import { repositories } from "./repositories";
import { ensureSeedData } from "./seed";
import { createRestoreConfirmationService } from "./services/restore/RestoreConfirmationService";

/**
 * 启动顺序：
 * 1. 建表（幂等）-> 2. 空库灌种子 -> 3. 续作重启前未完成的复电确认；
 *    CONFIRMED 已落盘但未 APPLIED 的记录在这里补完，服务重启不丢待复电结果。
 */
export const bootstrap = async (): Promise<void> => {
  await repositories.db.ping();
  await repositories.db.executeScript(SCHEMA_SQL);
  await ensureSeedData(repositories);
  const recovered = await createRestoreConfirmationService(repositories).recoverPending();
  if (recovered > 0) {
    console.info(`[restore-recovery] 续作完成 ${recovered} 张待复电工单`);
  }
  console.info(`[bootstrap] datasource=${config.db.driver} ready`);
};

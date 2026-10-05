import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHarness, type Harness } from "./harness";
import { createRestoreConfirmationService } from "../src/services/restore/RestoreConfirmationService";

/**
 * 模拟“写入失败后从最近确认状态重试”：
 * 让处置事务前两次因锁冲突（errno 1213）回滚，CONFIRMED 记录保留，第三次成功。
 */
describe("复电写入失败重试与服务重启续作", () => {
  let h: Harness;
  beforeEach(async () => {
    h = await createHarness();
  });

  test("CONFIRMED 已落盘后处置事务两次锁冲突：内部从最近确认状态重试，最终成功且不重复", async () => {
    let txCount = 0;
    const originalTransaction = h.repos.db.transaction.bind(h.repos.db);
    // 事务 #1 = 确认落盘；事务 #2/#3 = 处置应用（注入死锁）；事务 #4 = 重试成功
    (h.repos.db as { transaction: typeof h.repos.db.transaction }).transaction = ((work: never) => {
      txCount += 1;
      if (txCount === 2 || txCount === 3) {
        const err = new Error("Deadlock found when trying to get lock") as Error & { errno: number };
        err.errno = 1213;
        return Promise.reject(err);
      }
      return originalTransaction(work);
    }) as typeof h.repos.db.transaction;

    const result = await h.ticketService.restore(1, 101, { requestId: "crash-req" });

    assert.equal(result.kind, "RESTORED");
    assert.equal(result.outcome.ticket.status, "RESTORED");
    assert.ok(txCount >= 4, `应经历 确认 + 两次失败 + 成功，实际事务数=${txCount}`);

    const tables = h.db.getTables();
    const records = tables.restoreConfirmation.filter((c) => c.request_id === "crash-req");
    assert.equal(records.length, 1, "从最近确认状态续作，不产生第二条记录");
    assert.equal(records[0].stage, "APPLIED");
    assert.ok(records[0].attempts >= 3, `attempts 应反映重试次数，实际=${records[0].attempts}`);

    // 同一 requestId 再发一次：先做一次唯一判重事务，随后命中快照，不重新处置
    const beforeReplay = txCount;
    const replay = await h.ticketService.restore(1, 101, { requestId: "crash-req" });
    assert.equal(replay.kind, "RESTORED");
    assert.deepEqual(replay.outcome.ticket, result.outcome.ticket);
    assert.equal(txCount, beforeReplay + 1, "回放仅做唯一判重，不重新处置四件套");
  });

  test("超过最大重试次数仍失败时向上抛错，CONFIRMED 记录保留，重启/下次请求可续作", async () => {
    process.env.RESTORE_TX_MAX_RETRIES = "1";
    let txCount = 0;
    const originalTransaction = h.repos.db.transaction.bind(h.repos.db);
    (h.repos.db as { transaction: typeof h.repos.db.transaction }).transaction = ((work: never) => {
      txCount += 1;
      if (txCount >= 2) {
        const err = new Error("Lock wait timeout exceeded") as Error & { errno: number };
        err.errno = 1205;
        return Promise.reject(err);
      }
      return originalTransaction(work);
    }) as typeof h.repos.db.transaction;

    await assert.rejects(
      h.ticketService.restore(1, 101, { requestId: "give-up-req" }),
      /Lock wait timeout/
    );

    // 确认已落盘、未应用
    const pending = h.db
      .getTables()
      .restoreConfirmation.filter((c) => c.request_id === "give-up-req");
    assert.equal(pending.length, 1);
    assert.equal(pending[0].stage, "CONFIRMED");

    // 模拟故障恢复后用同一 requestId 继续（全新服务实例）
    (h.repos.db as { transaction: typeof h.repos.db.transaction }).transaction = originalTransaction;
    delete process.env.RESTORE_TX_MAX_RETRIES;
    const retried = await h.ticketService.restore(1, 101, { requestId: "give-up-req" });
    assert.equal(retried.kind, "RESTORED");
    assert.equal(retried.outcome.ticket.status, "RESTORED");
  });

  test("服务重启：CONFIRMED 未完成的记录在启动恢复时续作完成，不丢待复电结果", async () => {
    // 直接插入一条“崩溃前已确认但未应用”的记录
    await h.mutate((tables) => {
      tables.restoreConfirmation.push({
        id: 1,
        request_id: "pending-after-restart",
        ticket_id: 3,
        dispatcher_id: 102,
        restored_at: "2026-10-05T03:00:00.000Z",
        stage: "CONFIRMED",
        result_snapshot: null,
        attempts: 2,
        created_at: "2026-10-05T02:59:00.000Z",
        updated_at: "2026-10-05T02:59:30.000Z"
      });
    });

    // 模拟全新进程：用同一数据源重新装配服务并执行启动恢复
    const recoveredService = createRestoreConfirmationService(h.repos);
    const count = await recoveredService.recoverPending();
    assert.equal(count, 1);

    const ticket3 = await h.repos.db.read((tx) => h.repos.repairTicket.findById(tx, 3));
    assert.equal(ticket3?.status, "RESTORED");
    assert.equal(ticket3?.restored_by, 102);
    assert.equal(ticket3?.restore_request_id, "pending-after-restart");

    const record = h.db
      .getTables()
      .restoreConfirmation.find((c) => c.request_id === "pending-after-restart");
    assert.equal(record?.stage, "APPLIED");
    assert.ok(record?.result_snapshot);

    const crew3 = await h.repos.db.read((tx) => h.repos.crew.findById(tx, 3));
    assert.equal(crew3?.current_ticket_id, null, "班组随续作一并释放");
  });

  test("重启恢复时工单已被先到者复电：待处理确认落为 CONFLICTED", async () => {
    await h.ticketService.restore(1, 101, { requestId: "winner-req" });
    await h.mutate((tables) => {
      tables.restoreConfirmation.push({
        id: 99,
        request_id: "late-after-restart",
        ticket_id: 1,
        dispatcher_id: 202,
        restored_at: "2026-10-05T03:05:00.000Z",
        stage: "CONFIRMED",
        result_snapshot: null,
        attempts: 1,
        created_at: "2026-10-05T03:04:00.000Z",
        updated_at: "2026-10-05T03:04:00.000Z"
      });
    });

    const recoveredService = createRestoreConfirmationService(h.repos);
    await recoveredService.recoverPending();

    const late = h.db
      .getTables()
      .restoreConfirmation.find((c) => c.request_id === "late-after-restart");
    assert.equal(late?.stage, "CONFLICTED");
    const snapshot = JSON.parse(late?.result_snapshot ?? "{}");
    assert.equal(snapshot.kind, "CONFLICT");
    assert.equal(snapshot.conflict.winnerDispatcherId, 101);
    assert.equal(snapshot.conflict.loserDispatcherId, 202);
  });
});

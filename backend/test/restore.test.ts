/**
 * End-to-end verification of the restoration confirmation flow.
 *
 * Run with: `npx tsx test/restore.test.ts`
 *
 * Uses a throwaway data directory so the real seed store is untouched.
 */
import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";

// Point the store at a temp dir BEFORE importing anything that touches it.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "grid-repair-test-"));
process.env.DATA_DIR = tmpDir;

let store: Awaited<ReturnType<typeof import("../src/store")>>["store"];
let repairTicketService: typeof import("../src/services/RepairTicketService")["repairTicketService"];
let RestoreConflictError: typeof import("../src/services/RepairTicketService")["RestoreConflictError"];
let gridAssetRepository: typeof import("../src/repositories/GridAssetRepository")["gridAssetRepository"];
let crewRepository: typeof import("../src/repositories/CrewRepository")["crewRepository"];

let passed = 0;
let failed = 0;
async function check(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

async function main() {
  const storeMod = await import("../src/store");
  store = storeMod.store;
  const svcMod = await import("../src/services/RepairTicketService");
  repairTicketService = svcMod.repairTicketService;
  RestoreConflictError = svcMod.RestoreConflictError;
  gridAssetRepository = (await import("../src/repositories/GridAssetRepository")).gridAssetRepository;
  crewRepository = (await import("../src/repositories/CrewRepository")).crewRepository;
  console.log("\n[1] 复电联动：资产只在关联工单全部复电后恢复；班组只由当前在途工单释放");

  await check("restore ticket #1 → asset #1 stays DANGEROUS (ticket #2 still open)", async () => {
    const result = await repairTicketService.restore(1, { dispatcher_id: 10 });
    assert.strictEqual(result.idempotent, false);
    assert.strictEqual(result.ticket.status, "RESTORED");
    assert.strictEqual(result.asset.health_status, "DANGEROUS", "asset must NOT recover yet");
    assert.strictEqual(result.crew.duty_status, "AVAILABLE");
    assert.strictEqual(result.crew.current_ticket_id, null);
    const crew2 = crewRepository.findById(2);
    assert.strictEqual(crew2.duty_status, "BUSY");
    assert.strictEqual(crew2.current_ticket_id, 2);
  });

  await check("restore ticket #2 → asset #1 recovers to NORMAL (all restored)", async () => {
    const result = await repairTicketService.restore(2, { dispatcher_id: 10 });
    assert.strictEqual(result.asset.health_status, "NORMAL");
    assert.strictEqual(result.crew.duty_status, "AVAILABLE");
    const asset = gridAssetRepository.findById(1);
    assert.strictEqual(asset.health_status, "NORMAL");
  });

  await check("restore ticket #3 → asset #2 recovers to NORMAL (single ticket)", async () => {
    const result = await repairTicketService.restore(3, { dispatcher_id: 11 });
    assert.strictEqual(result.asset.health_status, "NORMAL");
    assert.strictEqual(result.crew.duty_status, "AVAILABLE");
  });

  console.log("\n[2] 重复请求沿用首次结果（幂等）");

  await check("retry restore with same key → idempotent, same restore record", async () => {
    const fresh = store.insert("repairTicket", {
      fault_report_id: 1,
      team_id: 1,
      dispatcher_id: 1,
      priority: "HIGH",
      status: "REPAIRING",
      assigned_at: "2026-10-05T09:00:00Z",
      restored_at: null,
      version: 1,
    });
    const first = await repairTicketService.restore(fresh.id, { dispatcher_id: 10, idempotency_key: "k1" });
    const second = await repairTicketService.restore(fresh.id, { dispatcher_id: 99, idempotency_key: "k1" });
    assert.strictEqual(second.idempotent, true);
    assert.strictEqual(second.restore.id, first.restore.id);
    assert.strictEqual(second.restore.restored_at, first.restore.restored_at);
    assert.strictEqual(second.restore.dispatcher_id, 10, "first dispatcher wins");
  });

  console.log("\n[3] 两名调度员并发处理同一工单：先到者生效，后到者看到当前状态和冲突原因");

  await check("different key on already-restored ticket → 409 with current status + reason", async () => {
    try {
      await repairTicketService.restore(1, { dispatcher_id: 77, idempotency_key: "different-key" });
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(err instanceof RestoreConflictError);
      assert.strictEqual(err.code, "TICKET_CONFLICT");
      assert.strictEqual(err.currentStatus, "RESTORED");
      assert.ok(err.conflictReason.includes("复电"));
      assert.ok(typeof err.currentVersion === "number");
    }
  });

  await check("concurrent first-writer-wins: one succeeds, one gets 409", async () => {
    const fresh = store.insert("repairTicket", {
      fault_report_id: 1,
      team_id: 1,
      dispatcher_id: 1,
      priority: "HIGH",
      status: "REPAIRING",
      assigned_at: "2026-10-05T09:00:00Z",
      restored_at: null,
      version: 1,
    });
    const results = await Promise.allSettled([
      repairTicketService.restore(fresh.id, { dispatcher_id: 1, idempotency_key: "race-a" }),
      repairTicketService.restore(fresh.id, { dispatcher_id: 2, idempotency_key: "race-b" }),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    assert.strictEqual(fulfilled.length, 1, "exactly one winner");
    assert.strictEqual(rejected.length, 1, "exactly one loser");
    const loser = (rejected[0] as PromiseRejectedResult).reason;
    assert.ok(loser instanceof RestoreConflictError);
    assert.strictEqual(loser.currentStatus, "RESTORED");
    assert.ok(loser.conflictReason.length > 0);
  });

  console.log("\n[4] 写入失败后从最近确认状态重试");

  await check("persist failure is retried and eventually succeeds", async () => {
    const fresh = store.insert("repairTicket", {
      fault_report_id: 3,
      team_id: 3,
      dispatcher_id: 1,
      priority: "HIGH",
      status: "REPAIRING",
      assigned_at: "2026-10-05T09:00:00Z",
      restored_at: null,
      version: 1,
    });
    store.__armPersistFailures(2);
    const result = await repairTicketService.restore(fresh.id, { dispatcher_id: 1 });
    assert.strictEqual(result.idempotent, false);
    assert.strictEqual(result.ticket.status, "RESTORED");
    const onDisk = JSON.parse(fs.readFileSync(path.join(tmpDir, "grid-repair.json"), "utf-8"));
    const persisted = onDisk.repairTicket.find((t: unknown) => {
      const row = t as { id: number };
      return String(row.id) === String(fresh.id);
    });
    assert.strictEqual(persisted.status, "RESTORED");
  });

  console.log("\n[5] 服务重启也不能丢掉待复电结果（持久化）");

  await check("restored ticket survives a store restart", async () => {
    const { JsonStore } = await import("../src/store/JsonStore");
    const { storeSeed } = await import("../src/store/seed");
    const restarted = new JsonStore(path.join(tmpDir, "grid-repair.json"), storeSeed);
    const ticket = restarted.findById("repairTicket", 1);
    assert.strictEqual(ticket.status, "RESTORED");
    assert.strictEqual(ticket.restored_at !== null, true);
    const asset = restarted.findById("gridAsset", 1);
    assert.strictEqual(asset.health_status, "NORMAL");
    const restoreRecord = restarted.all("ticketRestore").find((r) => r.ticket_id === 1);
    assert.ok(restoreRecord, "restore record persisted");
    assert.strictEqual(restoreRecord.status, "CONFIRMED");
  });

  console.log(`\n${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

main();

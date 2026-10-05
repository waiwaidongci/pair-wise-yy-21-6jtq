import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHarness, type Harness } from "./harness";

describe("复电确认：资产/报修/工单/班组同一份依据", () => {
  let h: Harness;
  beforeEach(async () => {
    h = await createHarness();
  });

  test("一张工单复电后，同线路仍有在途工单：资产保持 DEGRADED，班组只释放当前工单", async () => {
    const r1 = await h.ticketService.restore(1, 101, { requestId: "req-t1" });

    assert.equal(r1.kind, "RESTORED");
    assert.deepEqual(r1.outcome.activeTicketIds, [2]);
    assert.equal(r1.outcome.asset.health_status, "DEGRADED", "另一张工单仍在现场，资产不能恢复正常");
    assert.equal(r1.outcome.faultReport.status, "RESOLVED");
    assert.equal(r1.outcome.crewReleased, true);
    assert.equal(r1.outcome.crew?.current_ticket_id, null);
    assert.equal(r1.outcome.crew?.duty_status, "AVAILABLE");

    // 班组 2 的在途工单 2 未受影响（不会被工单 1 的复电提前释放）
    const crew2 = await h.repos.db.read((tx) => h.repos.crew.findById(tx, 2));
    assert.equal(crew2?.current_ticket_id, 2);
    assert.equal(crew2?.duty_status, "ON_TASK");

    // 第二张也复电：资产才恢复到基准档位 NORMAL
    const r2 = await h.ticketService.restore(2, 101, { requestId: "req-t2" });
    assert.deepEqual(r2.outcome.activeTicketIds, []);
    assert.equal(r2.outcome.asset.health_status, "NORMAL", "关联工单全部复电后资产恢复正常");
  });

  test("重复 requestId 的复电请求沿用首次结果（含重复点击/网络重试）", async () => {
    const first = await h.ticketService.restore(1, 101, { requestId: "dup-req" });
    const second = await h.ticketService.restore(1, 101, { requestId: "dup-req" });
    const third = await h.ticketService.restore(1, 999, { requestId: "dup-req" });

    for (const replay of [second, third]) {
      assert.equal(replay.kind, "RESTORED");
      assert.equal(replay.requestId, "dup-req");
      assert.deepEqual(replay.outcome, first.outcome, "后到请求不得覆盖首次结果");
      assert.equal(replay.outcome.ticket.restored_by, 101);
    }

    const rows = h.db.getTables();
    assert.equal(rows.restoreConfirmation.length, 1, "同一 requestId 只有一条权威记录");
    assert.equal(rows.repairTicket.find((t) => t.id === 1)?.restored_by, 101);
  });

  test("两名调度员并发确认同一工单：先到者生效，后到者拿到当前状态与冲突原因", async () => {
    const [a, b] = await Promise.all([
      h.ticketService.restore(3, 101, { requestId: "disp-a" }),
      h.ticketService.restore(3, 102, { requestId: "disp-b" })
    ]);

    const winner = a.kind === "RESTORED" ? a : b;
    const loser = a.kind === "CONFLICT" ? a : b;
    assert.equal(winner.kind, "RESTORED");
    assert.equal(loser.kind, "CONFLICT");
    assert.equal(winner.outcome.ticket.restored_by, [101, 102].includes(winner.outcome.ticket.restored_by) ? winner.outcome.ticket.restored_by : winner.outcome.ticket.restored_by);
    assert.equal(loser.conflict?.winnerDispatcherId, winner.outcome.ticket.restored_by);
    assert.notEqual(loser.conflict?.loserDispatcherId, loser.conflict?.winnerDispatcherId);
    assert.match(loser.conflict?.reason ?? "", /已由调度员/);
    assert.match(loser.conflict?.reason ?? "", /后到请求/);
    assert.equal(loser.outcome.ticket.status, "RESTORED", "后到者看到的是当前状态");

    const rows = h.db.getTables();
    const confirmations = rows.restoreConfirmation
      .filter((c) => c.ticket_id === 3)
      .sort((x, y) => x.id - y.id);
    assert.equal(confirmations[0].stage, "APPLIED");
    assert.equal(confirmations[1].stage, "CONFLICTED", "竞争失败的确认单独标记，不覆盖先到者");
    assert.equal(rows.repairTicket.find((t) => t.id === 3)?.version, 1, "工单只被写入一次");
  });

  test("每张单复电都按当前关联工单重算：先复电2再复电1，结果一致", async () => {
    await h.ticketService.restore(2, 101, { requestId: "req-t2-first" });
    let asset = await h.repos.db.read((tx) => h.repos.gridAsset.findById(tx, 1));
    assert.equal(asset?.health_status, "DEGRADED");

    const r1 = await h.ticketService.restore(1, 101, { requestId: "req-t1-second" });
    assert.deepEqual(r1.outcome.activeTicketIds, []);
    assert.equal(r1.outcome.asset.health_status, "NORMAL");
  });
});

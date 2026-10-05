import type { Crew } from "../../models/Crew";
import type { Ctx } from "../ports/RepoContext";
import type { ICrewRepository } from "../ports/ICrewRepository";
import { num, nullableNum, str } from "./rowMappers";

const mapRow = (row: Record<string, unknown>): Crew => ({
  id: num(row.id),
  name: str(row.name),
  leader_id: nullableNum(row.leader_id),
  skill_tags: str(row.skill_tags),
  duty_status: str(row.duty_status, "AVAILABLE"),
  current_ticket_id: nullableNum(row.current_ticket_id),
  contact_phone: str(row.contact_phone)
});

const COLUMNS =
  "id, name, leader_id, skill_tags, duty_status, current_ticket_id, contact_phone";

export class SqlCrewRepository implements ICrewRepository {
  async findById(ctx: Ctx, id: number, forUpdate = false): Promise<Crew | null> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM crew WHERE id = ?${forUpdate ? " FOR UPDATE" : ""}`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findAll(ctx: Ctx): Promise<Crew[]> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM crew ORDER BY id`
    );
    return rows.map(mapRow);
  }

  async save(ctx: Ctx, row: Omit<Crew, "id"> & { id?: number }): Promise<Crew> {
    const result = await ctx.client.query<{ insertId: number }>(
      `INSERT INTO crew (id, name, leader_id, skill_tags, duty_status, current_ticket_id, contact_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id ?? null,
        row.name,
        row.leader_id,
        row.skill_tags,
        row.duty_status,
        row.current_ticket_id,
        row.contact_phone
      ]
    );
    return { ...row, id: row.id ?? result[0]?.insertId } as Crew;
  }

  async releaseIfCurrentTicket(
    ctx: Ctx,
    crewId: number,
    ticketId: number,
    dutyStatus: Crew["duty_status"]
  ): Promise<{ crew: Crew | null; released: boolean }> {
    // 行锁内比对：只有班组当前在途工单仍是这张，才允许释放，避免提前释放后到工单
    const locked = await this.findById(ctx, crewId, true);
    if (!locked) return { crew: null, released: false };
    if (locked.current_ticket_id !== ticketId) {
      return { crew: locked, released: false };
    }
    await ctx.client.query(
      `UPDATE crew
         SET current_ticket_id = NULL, duty_status = ?
       WHERE id = ? AND current_ticket_id = ?`,
      [dutyStatus, crewId, ticketId]
    );
    const crew = await this.findById(ctx, crewId);
    return { crew, released: crew?.current_ticket_id === null };
  }
}

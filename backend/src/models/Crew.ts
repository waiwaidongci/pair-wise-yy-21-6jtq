import type { CrewDutyStatus } from "../constants/CrewDutyStatus";

export interface Crew {
  id: number;
  name: string;
  leader_id: number | null;
  skill_tags: string;
  duty_status: CrewDutyStatus | string;
  current_ticket_id: number | null;
  contact_phone: string;
}

import type { Crew } from "../types/Crew";

export const createDefaultCrew = (overrides: Partial<Crew> = {}): Crew => ({
  id: 0,
  name: "",
  leader_id: null,
  skill_tags: "",
  duty_status: "AVAILABLE",
  current_ticket_id: null,
  contact_phone: "",
  ...overrides
});

export const createCrewForm = createDefaultCrew;
export const createCrewResponse = createDefaultCrew;

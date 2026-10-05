export const createCrewDto = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: "抢修一班",
  leader_id: 101,
  skill_tags: "配电,电缆",
  duty_status: "AVAILABLE",
  current_ticket_id: null,
  contact_phone: "13900000001",
  version: 1,
  ...overrides,
});

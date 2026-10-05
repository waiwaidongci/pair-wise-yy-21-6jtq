export interface Crew {
  id: number;
  name: string;
  leader_id: number;
  skill_tags: string;
  duty_status: string;
  /** The in-transit ticket currently occupying the crew; null when available. */
  current_ticket_id: number | null;
  contact_phone: string;
  /** Optimistic-lock version; incremented on every committed update. */
  version: number;
}

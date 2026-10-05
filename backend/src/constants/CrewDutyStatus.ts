export const CrewDutyStatus = ["OFF_DUTY", "AVAILABLE", "ON_TASK"] as const;
export type CrewDutyStatus = (typeof CrewDutyStatus)[number];

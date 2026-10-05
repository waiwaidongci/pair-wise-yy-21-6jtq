export const CrewDutyStatus = ["OFF_DUTY", "AVAILABLE", "ON_TASK"] as const;
export type CrewDutyStatus = (typeof CrewDutyStatus)[number];
export const CrewDutyStatusText: Record<CrewDutyStatus, string> = {
  OFF_DUTY: "休息",
  AVAILABLE: "可派工",
  ON_TASK: "作业中"
};

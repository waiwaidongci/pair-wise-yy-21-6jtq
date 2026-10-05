import { renderErrorMessage } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";

type Params = Record<string, string | number | undefined>;

const render = (template: string, params: Params) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] === undefined ? `{${key}}` : String(params[key])
  );

/** 集中渲染审计/操作日志模板，禁止在 service 里散写日志文案 */
export const renderLog = (
  entity: keyof typeof LOG_TEMPLATES,
  index: number,
  params: Params = {}
): string => render(LOG_TEMPLATES[entity][index], params);

/** 复电冲突原因：后到调度员看到先到者与当前状态 */
export const renderConflictReason = (params: {
  ticketId: number;
  winnerDispatcher: number | string;
  loserDispatcher: number | string;
  confirmedAt: string;
  currentStatus: string;
}): string =>
  renderErrorMessage("RESTORE_CONFLICT", params);

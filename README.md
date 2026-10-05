# 电力配网抢修工单系统

面向供电所的配网故障报修、抢修派工、备件领用和停电恢复跟踪平台。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20104>

后端健康检查：<http://localhost:21104/health>


## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`
- 后端：进入 `backend` 后按技术栈运行开发命令，接口统一挂在 `/api`。


## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus + Pinia |
| 后端 | Node.js + Express + TypeScript + Prisma |
| 数据库 | MySQL 8.0 |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/api, stores, types, constants, constructors, components/common, hooks, pages, router, utils, mocks
backend/src/routes, controllers, services, models, repositories, middlewares, constants, constructors, utils, types, config
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `grid-repair`
- `FRONTEND_PORT`: 前端端口，默认 `20104`
- `BACKEND_PORT`: 后端端口，默认 `21104`
- `DB_PORT`: 数据库宿主机端口
- `DB_USER/DB_PASSWORD/DB_NAME`: 本地数据库凭据
- `DB_DRIVER`: `mysql`（默认）或 `memory`（无数据库时运行，复电语义与并发测试共用同一套仓储端口）
- `JWT_SECRET`: JWT 签名密钥
- `RESTORE_TX_MAX_RETRIES/RESTORE_LOCK_WAIT_MS`: 复电处置事务的锁冲突重试上限与锁等待

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: grid-repair`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-grid-repair}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- FaultType: constants/FaultType、types/FaultType、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- TicketStatus: constants/TicketStatus、types/TicketStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- AssetHealthStatus: constants/AssetHealthStatus、types/AssetHealthStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- 复电联动新增常量：
  - `TicketStatus.RESTORABLE_STATUSES / ACTIVE_TICKET_STATUSES`（后端 `constants/TicketStatus.ts`，前端同名常量）
  - `AssetHealthStatus.ACTIVE_HEALTH_STATUS` + `constants/healthDefaults.NORMAL_HEALTH`
  - `FaultReportStatus`（后端 `constants/FaultReportStatus.ts`、前端 `constants/FaultReportStatus.ts`）
  - `CrewDutyStatus`（后端 `constants/CrewDutyStatus.ts`、前端 `constants/CrewDutyStatus.ts`）
  - `ConfirmationStage`：`CONFIRMED/APPLIED/CONFLICTED`（后端 `constants/ConfirmationStage.ts`、`models/RestoreConfirmation.ts`）

## 复电确认的一致性设计（资产 / 报修 / 工单 / 班组同一份依据）

一条线路同时挂多张抢修单时，四类处置对象由一次复电确认在**同一个数据库事务**内联动，规则：

1. **资产状态只在关联工单全部复电后恢复**：每次确认都按“当前关联工单”重算
   （故障报修 -> 同资产的报修单 -> 其全部工单，`SELECT ... FOR UPDATE` 加锁）。
   仍有在途工单时资产保持 `DEGRADED`，全部复电才恢复到资产的 `baseline_health_status`（默认 `NORMAL`）。
2. **班组只由当前在途工单释放**：行锁内比对 `crew.current_ticket_id === 本工单` 才清空并置 `AVAILABLE`；
   班组已转去执行另一张工单时不会被提前释放。
3. **重复请求沿用首次结果**：`restore_confirmation.request_id` 唯一。
   首次确认先落 `CONFIRMED`，处置完成推进为 `APPLIED` 并固化结果快照；
   同 `requestId` 的重复请求（双击/网络重试）直接回放快照。
4. **写入失败从最近确认状态重试**：处置事务遇死锁/锁等待（MySQL 1213/1205）整体回滚，
   `CONFIRMED` 记录保留并递增 `attempts`，在 `RESTORE_TX_MAX_RETRIES` 内自动重试；
   超过上限向上抛错，下次同 `requestId` 请求或重启恢复继续续作。
5. **服务重启不丢待复电结果**：启动时 `bootstrap` 扫描所有 `CONFIRMED` 记录执行 `recoverPending`。
6. **两名调度员并发同一工单，先到者生效**：工单行上乐观锁 `WHERE id=? AND version=?`，
   后到者写入 0 行，其确认记录落为 `CONFLICTED`；接口返回 `409 { kind:"CONFLICT", outcome, conflict }`，
   `outcome` 为当前状态，`conflict.reason` 说明先到调度员、确认时间与后到不覆盖。

接口：`POST /api/repair-ticket/:id/restore`，body `{ "requestId": "幂等键", "restoredAt"?: ISO }`，
需要 `DISPATCHER/LEADER/ADMIN` 角色（本地可用 `x-user-id`、`x-role` 头模拟）。
无本地 MySQL 时可用 `DB_DRIVER=memory npm run dev` 启动等价语义的内存数据源（同套并发/恢复测试也跑在它上面：`npm test`）。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

## License

MIT

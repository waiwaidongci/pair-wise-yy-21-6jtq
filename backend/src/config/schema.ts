/**
 * 权威建表语句（与 database/init.sql 保持一致）：
 * 应用启动时以 CREATE TABLE IF NOT EXISTS 幂等执行，
 * Docker 首次启动则由 /docker-entrypoint-initdb.d/init.sql 落库。
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS grid_asset (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_code VARCHAR(64) NOT NULL,
  asset_type VARCHAR(32) NOT NULL,
  feeder_line VARCHAR(128) NOT NULL,
  voltage_level VARCHAR(16) NOT NULL,
  location_desc VARCHAR(255) NOT NULL DEFAULT '',
  health_status VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
  baseline_health_status VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
  owner_team_id INT NULL,
  KEY idx_asset_line (feeder_line)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fault_report (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reporter_name VARCHAR(64) NOT NULL,
  phone VARCHAR(32) NOT NULL DEFAULT '',
  asset_id INT NOT NULL,
  fault_type VARCHAR(32) NOT NULL,
  address_desc VARCHAR(255) NOT NULL DEFAULT '',
  severity VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
  report_channel VARCHAR(32) NOT NULL DEFAULT 'PHONE',
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  KEY idx_fault_asset (asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS repair_ticket (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fault_report_id INT NOT NULL,
  team_id INT NOT NULL,
  dispatcher_id INT NOT NULL,
  priority VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
  status VARCHAR(32) NOT NULL DEFAULT 'WAIT_DISPATCH',
  assigned_at DATETIME(3) NULL,
  restored_at DATETIME(3) NULL,
  restored_by INT NULL,
  restore_request_id VARCHAR(64) NULL,
  version INT NOT NULL DEFAULT 0,
  KEY idx_ticket_fault (fault_report_id),
  KEY idx_ticket_team (team_id),
  UNIQUE KEY uk_ticket_restore_request (restore_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crew (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  leader_id INT NULL,
  skill_tags VARCHAR(255) NOT NULL DEFAULT '',
  duty_status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
  current_ticket_id INT NULL,
  contact_phone VARCHAR(32) NOT NULL DEFAULT '',
  KEY idx_crew_current_ticket (current_ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS spare_part_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  part_code VARCHAR(64) NOT NULL,
  part_name VARCHAR(128) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  warehouse_name VARCHAR(128) NOT NULL DEFAULT '',
  approved_by VARCHAR(64) NOT NULL DEFAULT '',
  usage_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  KEY idx_usage_ticket (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS restore_confirmation (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id VARCHAR(64) NOT NULL,
  ticket_id INT NOT NULL,
  dispatcher_id INT NOT NULL,
  restored_at DATETIME(3) NOT NULL,
  stage VARCHAR(16) NOT NULL DEFAULT 'CONFIRMED',
  result_snapshot LONGTEXT NULL,
  attempts INT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_restore_request (request_id),
  KEY idx_restore_ticket (ticket_id),
  KEY idx_restore_stage (stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  actor VARCHAR(64) NOT NULL DEFAULT '',
  action VARCHAR(128) NOT NULL,
  target_type VARCHAR(32) NOT NULL DEFAULT '',
  target_id VARCHAR(64) NOT NULL DEFAULT '',
  detail VARCHAR(1024) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

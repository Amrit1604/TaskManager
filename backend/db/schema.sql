-- ============================================================
-- Team Task Manager — MySQL Schema
-- Run this file once to initialize the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS tasky CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tasky;

-- ----------------------------------------------------------------
-- Users
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role        ENUM('admin', 'member') NOT NULL DEFAULT 'member',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at  DATETIME      NULL DEFAULT NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_deleted (deleted_at)
);

-- ----------------------------------------------------------------
-- Projects (soft-delete only)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  description TEXT          NULL,
  created_by  INT UNSIGNED  NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME      NULL DEFAULT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_projects_deleted (deleted_at)
);

-- ----------------------------------------------------------------
-- Project Members (join table)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_members (
  project_id  INT UNSIGNED  NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  joined_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- Tasks (soft-delete only)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  description TEXT          NULL,
  project_id  INT UNSIGNED  NOT NULL,
  assignee_id INT UNSIGNED  NULL,
  created_by  INT UNSIGNED  NOT NULL,
  priority    ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status      ENUM('todo', 'in_progress', 'done') NOT NULL DEFAULT 'todo',
  due_date    DATE          NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME      NULL DEFAULT NULL,
  FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id)    ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id)    ON DELETE RESTRICT,
  INDEX idx_tasks_project  (project_id),
  INDEX idx_tasks_assignee (assignee_id),
  INDEX idx_tasks_status   (status),
  INDEX idx_tasks_deleted  (deleted_at)
);

-- ----------------------------------------------------------------
-- Audit Log — records every task status change
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id     INT UNSIGNED  NOT NULL,
  changed_by  INT UNSIGNED  NOT NULL,
  old_status  ENUM('todo', 'in_progress', 'done') NOT NULL,
  new_status  ENUM('todo', 'in_progress', 'done') NOT NULL,
  changed_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id)    REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_audit_task    (task_id),
  INDEX idx_audit_changed_at (changed_at)
);

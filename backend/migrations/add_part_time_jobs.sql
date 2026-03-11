-- 添加兼职信息表
-- 执行命令：wrangler d1 execute shanxin-db --file migrations/add_part_time_jobs.sql

CREATE TABLE IF NOT EXISTS part_time_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gender TEXT DEFAULT '不限',
  type TEXT NOT NULL,
  description TEXT,
  priceList TEXT,
  contact TEXT NOT NULL,
  expireAt DATETIME,
  isActive INTEGER DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_part_time_jobs_active ON part_time_jobs(isActive, expireAt);

-- 登录失败限流表
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  email TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip);
CREATE INDEX IF NOT EXISTS idx_failed_login_created ON failed_login_attempts(createdAt);

-- 山信黑红榜 D1 数据库 Schema
-- 执行命令：wrangler d1 execute shanxin-db --file sql/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  passwordHash TEXT,
  nickname TEXT,
  avatar TEXT,
  deviceId TEXT,
  isVip INTEGER DEFAULT 0,
  isSvip INTEGER DEFAULT 0,
  vipExpire DATETIME,
  svipExpire DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  amount REAL NOT NULL,
  message TEXT,
  wechat TEXT,
  sponsorName TEXT,
  status TEXT DEFAULT 'pending',
  approvedBy TEXT,
  approvedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS email_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  isUsed INTEGER DEFAULT 0,
  expireAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS captcha_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sessionId TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  isUsed INTEGER DEFAULT 0,
  expireAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  isUsed INTEGER DEFAULT 0,
  expireAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  name TEXT NOT NULL,
  campus TEXT,
  className TEXT,
  isPublic INTEGER DEFAULT 1,
  type TEXT DEFAULT 'red',
  remark TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS profile_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reviewerId INTEGER NOT NULL,
  profileId INTEGER NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  isAnonymous INTEGER DEFAULT 1,
  totalCount INTEGER DEFAULT 0,
  bigVotes INTEGER DEFAULT 0,
  smallVotes INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewerId) REFERENCES users(id),
  FOREIGN KEY (profileId) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reviewId INTEGER,
  reviewType TEXT NOT NULL,
  reporterId INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  handlerId INTEGER,
  handledAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporterId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS merchants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  phone TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchant_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reviewerId INTEGER NOT NULL,
  merchantId INTEGER NOT NULL,
  rating INTEGER,
  type TEXT NOT NULL,
  content TEXT,
  isAnonymous INTEGER DEFAULT 1,
  totalCount INTEGER DEFAULT 0,
  bigVotes INTEGER DEFAULT 0,
  smallVotes INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewerId) REFERENCES users(id),
  FOREIGN KEY (merchantId) REFERENCES merchants(id)
);

CREATE TABLE IF NOT EXISTS blocked_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'insult',
  isActive INTEGER DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  createdBy INTEGER NOT NULL,
  usedBy INTEGER,
  isActive INTEGER DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  usedAt DATETIME,
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_support_user ON support_records(userId, createdAt);
CREATE INDEX IF NOT EXISTS idx_support_status ON support_records(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_codes(email, createdAt);
CREATE INDEX IF NOT EXISTS idx_captcha_codes_session ON captcha_codes(sessionId, expireAt);
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone, createdAt);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(userId, createdAt);
CREATE INDEX IF NOT EXISTS idx_profile_reviews_profile ON profile_reviews(profileId, createdAt);
CREATE INDEX IF NOT EXISTS idx_profile_reviews_reviewer ON profile_reviews(reviewerId, profileId, createdAt);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_merchants_name ON merchants(name, createdAt);
CREATE INDEX IF NOT EXISTS idx_merchant_reviews_merchant ON merchant_reviews(merchantId, createdAt);
CREATE INDEX IF NOT EXISTS idx_blocked_words_category ON blocked_words(category, isActive);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code, isActive);

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

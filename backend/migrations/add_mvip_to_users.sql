-- 添加 MVIP 字段到 users 表
ALTER TABLE users ADD COLUMN isMvip INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN mvipExpire TEXT DEFAULT NULL;

-- 说明：
-- isMvip: 是否为 MVIP 用户
-- mvipExpire: MVIP 过期时间

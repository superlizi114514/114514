-- 添加称号字段到 users 表
ALTER TABLE users ADD COLUMN title TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN showTitle INTEGER DEFAULT 1;

-- 说明：
-- title: 用户称号，可为空，由管理员设置
-- showTitle: 是否显示称号，1 为显示，0 为隐藏，默认为 1

-- 添加赞助人名称字段到赞助记录表
-- 执行命令：wrangler d1 execute shanxin-db --file migrations/add_sponsor_name_to_support_records.sql

ALTER TABLE support_records ADD COLUMN sponsorName TEXT;

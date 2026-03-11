-- 删除孤立的人员点评记录（profileId 在 profiles 表中不存在）
DELETE FROM profile_reviews 
WHERE profileId NOT IN (SELECT id FROM profiles);

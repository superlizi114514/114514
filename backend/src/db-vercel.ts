// Cloudflare D1 HTTP API 客户端
// 使用 Global API Key + Email 认证

const D1_DATABASE_ID = process.env.D1_DATABASE_ID || 'c209b83e-0b0c-4660-b7ef-83460b9b1ea9'
const D1_ACCOUNT_ID = process.env.D1_ACCOUNT_ID || '2c0eca8956b99c7c1c27879f8c3dc54d'
const D1_API_TOKEN = process.env.D1_API_TOKEN || 'm5ZWzx5opDcxa-97-MM-_JtnonXNPuUMmnGmGxFq'

// D1 API 基础 URL
const D1_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${D1_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}`

// 调试日志
console.log('[D1] Database ID:', D1_DATABASE_ID)
console.log('[D1] Account ID:', D1_ACCOUNT_ID)
console.log('[D1] Base URL:', D1_BASE_URL)

interface D1Response {
  success: boolean
  errors: Array<{ code: number; message: string }>
  result?: Array<{
    results: any[]
    meta: {
      rows_written?: number
      rows_changed?: number
      last_row_id?: number
    }
  }>
}

// 执行 SQL 查询
async function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const requestBody = JSON.stringify({ sql, params, return_meta: true })
  console.log('[D1] Executing query:', sql, 'params:', params)

  const response = await fetch(`${D1_BASE_URL}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${D1_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: requestBody,
  })

  console.log('[D1] Response status:', response.status)
  const data: D1Response = await response.json()
  console.log('[D1] Response:', JSON.stringify(data))

  if (!data.success) {
    console.error('D1 query error:', data.errors)
    throw new Error(`D1 query error: ${data.errors?.[0]?.message || 'Unknown error'}`)
  }

  return data.result?.[0]?.results as T[] || []
}

// 执行单条查询并返回第一行
async function queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const results = await executeQuery<T>(sql, params)
  return results[0] || null
}

// 执行插入/更新/删除操作
async function executeRun(sql: string, params: any[] = []): Promise<{ rowsAffected: number; lastInsertRowId?: number }> {
  const response = await fetch(`${D1_BASE_URL}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${D1_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params, return_meta: true }),
  })

  const data: D1Response = await response.json()

  if (!data.success) {
    console.error('D1 run error:', data.errors)
    throw new Error(`D1 query error: ${data.errors?.[0]?.message || 'Unknown error'}`)
  }

  return {
    rowsAffected: data.result?.[0]?.meta?.rows_written || data.result?.[0]?.meta?.rows_changed || 0,
    lastInsertRowId: data.result?.[0]?.meta?.last_row_id,
  }
}

// 数据库操作类
export class Database {
  // 通用查询方法
  async executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return executeQuery<T>(sql, params)
  }

  // 通用执行方法
  async executeRun(sql: string, params: any[] = []): Promise<{ rowsAffected: number; lastInsertRowId?: number }> {
    return executeRun(sql, params)
  }

  // ============ User 操作 ============
  async findUserById(id: number): Promise<User | null> {
    return queryFirst<User>('SELECT * FROM users WHERE id = ?', [id])
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return queryFirst<User>('SELECT * FROM users WHERE email = ?', [email])
  }

  async findUserByPhone(phone: string): Promise<User | null> {
    return queryFirst<User>('SELECT * FROM users WHERE phone = ?', [phone])
  }

  async createUser(email: string): Promise<User> {
    const result = await queryFirst<User>(
      'INSERT INTO users (email) VALUES (?) RETURNING *',
      [email]
    )
    if (!result) throw new Error('Failed to create user')
    return result
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    const result = await queryFirst<User>(
      `UPDATE users SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`,
      [...values, id]
    )
    if (!result) throw new Error('Failed to update user')
    return result
  }

  async updateUserTitle(id: number, title: string | null): Promise<User> {
    return this.updateUser(id, { title })
  }

  async toggleUserTitleVisibility(id: number, showTitle: number): Promise<User> {
    return this.updateUser(id, { showTitle })
  }

  async updateUserNickname(id: number, nickname: string): Promise<User> {
    return this.updateUser(id, { nickname })
  }

  // ============ EmailCode 操作 ============
  async findEmailCode(email: string, code: string): Promise<EmailCode | null> {
    return queryFirst<EmailCode>(
      'SELECT * FROM email_codes WHERE email = ? AND code = ? AND isUsed = 0 AND expireAt > CURRENT_TIMESTAMP ORDER BY createdAt DESC LIMIT 1',
      [email, code]
    )
  }

  async createEmailCode(email: string, code: string, expireAt: string): Promise<void> {
    await executeRun('INSERT INTO email_codes (email, code, expireAt) VALUES (?, ?, ?)', [email, code, expireAt])
  }

  async markEmailCodeUsed(id: number): Promise<void> {
    await executeRun('UPDATE email_codes SET isUsed = 1 WHERE id = ?', [id])
  }

  async findEmailCodesCountToday(email: string, start: string, end: string): Promise<number> {
    const result = await queryFirst<{ count: number }>(
      'SELECT COUNT(*) as count FROM email_codes WHERE email = ? AND createdAt >= ? AND createdAt < ?',
      [email, start, end]
    )
    return result?.count || 0
  }

  // ============ CaptchaCode 操作 ============
  async findCaptchaCode(sessionId: string): Promise<CaptchaCode | null> {
    return queryFirst<CaptchaCode>('SELECT * FROM captcha_codes WHERE sessionId = ?', [sessionId])
  }

  async createCaptchaCode(sessionId: string, code: string, expireAt: string): Promise<void> {
    await executeRun('INSERT INTO captcha_codes (sessionId, code, expireAt) VALUES (?, ?, ?)', [sessionId, code, expireAt])
  }

  async markCaptchaCodeUsed(sessionId: string): Promise<void> {
    await executeRun('UPDATE captcha_codes SET isUsed = 1 WHERE sessionId = ?', [sessionId])
  }

  // ============ Profile 操作 ============
  async findProfilesByUserId(userId: number): Promise<Profile[]> {
    return executeQuery<Profile>('SELECT * FROM profiles WHERE userId = ? ORDER BY createdAt DESC', [userId])
  }

  async findProfileById(id: number): Promise<Profile | null> {
    return queryFirst<Profile>('SELECT * FROM profiles WHERE id = ?', [id])
  }

  async createProfile(
    userId: number,
    name: string,
    campus?: string | null,
    className?: string | null,
    isPublic?: boolean,
    type?: string,
    remark?: string | null
  ): Promise<Profile> {
    const result = await queryFirst<Profile>(
      'INSERT INTO profiles (userId, name, campus, className, isPublic, type, remark) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *',
      [userId, name, campus || null, className || null, isPublic ? 1 : 0, type || 'red', remark || null]
    )
    if (!result) throw new Error('Failed to create profile')
    return result
  }

  async updateProfile(id: number, data: Partial<Profile>): Promise<Profile> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    const result = await queryFirst<Profile>(
      `UPDATE profiles SET ${fields} WHERE id = ? RETURNING *`,
      [...values, id]
    )
    if (!result) throw new Error('Failed to update profile')
    return result
  }

  async deleteProfile(id: number): Promise<void> {
    await executeRun('DELETE FROM profiles WHERE id = ?', [id])
  }

  async findProfilesByName(name: string): Promise<Profile[]> {
    return executeQuery<Profile>('SELECT * FROM profiles WHERE name = ? ORDER BY createdAt DESC', [name])
  }

  // ============ ProfileReview 操作 ============
  async findProfileReviewsByProfileId(profileId: number, limit = 50): Promise<ProfileReview[]> {
    return executeQuery<ProfileReview>(
      'SELECT * FROM profile_reviews WHERE profileId = ? ORDER BY createdAt DESC LIMIT ?',
      [profileId, limit]
    )
  }

  async findProfileReviewById(id: number): Promise<ProfileReview | null> {
    return queryFirst<ProfileReview>('SELECT * FROM profile_reviews WHERE id = ?', [id])
  }

  async createProfileReview(
    reviewerId: number,
    profileId: number,
    type: string,
    content?: string | null,
    isAnonymous?: boolean,
    totalCount?: number,
    bigVotes?: number,
    smallVotes?: number
  ): Promise<ProfileReview> {
    const result = await queryFirst<ProfileReview>(
      'INSERT INTO profile_reviews (reviewerId, profileId, type, content, isAnonymous, totalCount, bigVotes, smallVotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
      [reviewerId, profileId, type, content || null, isAnonymous ? 1 : 0, totalCount || 0, bigVotes || 0, smallVotes || 0]
    )
    if (!result) throw new Error('Failed to create profile review')
    return result
  }

  async updateProfileReview(id: number, data: Partial<ProfileReview>): Promise<void> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    await executeRun(`UPDATE profile_reviews SET ${fields} WHERE id = ?`, [...values, id])
  }

  async deleteProfileReview(id: number): Promise<void> {
    await executeRun('DELETE FROM profile_reviews WHERE id = ?', [id])
  }

  async countProfileReviewsByReviewerAndProfile(reviewerId: number, profileId: number, start: string, end: string): Promise<number> {
    // 将 ISO 时间转换为 SQLite datetime 格式 (YYYY-MM-DD HH:MM:SS)
    const startStr = start.replace('T', ' ').substring(0, 19)
    const endStr = end.replace('T', ' ').substring(0, 19)
    const result = await queryFirst<{ count: number }>(
      'SELECT COUNT(*) as count FROM profile_reviews WHERE reviewerId = ? AND profileId = ? AND datetime(createdAt) >= ? AND datetime(createdAt) < ?',
      [reviewerId, profileId, startStr, endStr]
    )
    return result?.count || 0
  }

  async findProfileReviewsTodayByReviewer(reviewerId: number, start: string, end: string): Promise<{ totalCount: number }[]> {
    // 将 ISO 时间转换为 SQLite datetime 格式 (YYYY-MM-DD HH:MM:SS)
    const startStr = start.replace('T', ' ').substring(0, 19)
    const endStr = end.replace('T', ' ').substring(0, 19)
    return executeQuery<{ totalCount: number }>(
      'SELECT totalCount FROM profile_reviews WHERE reviewerId = ? AND datetime(createdAt) >= ? AND datetime(createdAt) < ?',
      [reviewerId, startStr, endStr]
    )
  }

  // ============ Merchant 操作 ============
  async findMerchants(search?: string, limit = 50): Promise<Merchant[]> {
    if (search) {
      return executeQuery<Merchant>('SELECT * FROM merchants WHERE name LIKE ? ORDER BY createdAt DESC LIMIT ?', [`%${search}%`, limit])
    }
    return executeQuery<Merchant>('SELECT * FROM merchants ORDER BY createdAt DESC LIMIT ?', [limit])
  }

  async findMerchantById(id: number): Promise<Merchant | null> {
    return queryFirst<Merchant>('SELECT * FROM merchants WHERE id = ?', [id])
  }

  async createMerchant(
    name: string,
    category?: string | null,
    address?: string | null,
    phone?: string | null
  ): Promise<Merchant> {
    const result = await queryFirst<Merchant>(
      'INSERT INTO merchants (name, category, address, phone) VALUES (?, ?, ?, ?) RETURNING *',
      [name, category || null, address || null, phone || null]
    )
    if (!result) throw new Error('Failed to create merchant')
    return result
  }

  async updateMerchant(id: number, data: Partial<Merchant>): Promise<Merchant> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    const result = await queryFirst<Merchant>(
      `UPDATE merchants SET ${fields} WHERE id = ? RETURNING *`,
      [...values, id]
    )
    if (!result) throw new Error('Failed to update merchant')
    return result
  }

  async deleteMerchant(id: number): Promise<void> {
    await executeRun('DELETE FROM merchants WHERE id = ?', [id])
  }

  // ============ MerchantReview 操作 ============
  async findMerchantReviewsByMerchantId(merchantId: number, limit = 50): Promise<MerchantReview[]> {
    return executeQuery<MerchantReview>(
      'SELECT * FROM merchant_reviews WHERE merchantId = ? ORDER BY createdAt DESC LIMIT ?',
      [merchantId, limit]
    )
  }

  async findMerchantReviewById(id: number): Promise<MerchantReview | null> {
    return queryFirst<MerchantReview>('SELECT * FROM merchant_reviews WHERE id = ?', [id])
  }

  async createMerchantReview(
    reviewerId: number,
    merchantId: number,
    type: string,
    rating?: number | null,
    content?: string | null,
    isAnonymous?: boolean,
    totalCount?: number,
    bigVotes?: number,
    smallVotes?: number
  ): Promise<MerchantReview> {
    const result = await queryFirst<MerchantReview>(
      'INSERT INTO merchant_reviews (reviewerId, merchantId, type, rating, content, isAnonymous, totalCount, bigVotes, smallVotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
      [reviewerId, merchantId, type, rating || null, content || null, isAnonymous ? 1 : 0, totalCount || 0, bigVotes || 0, smallVotes || 0]
    )
    if (!result) throw new Error('Failed to create merchant review')
    return result
  }

  async updateMerchantReview(id: number, data: Partial<MerchantReview>): Promise<void> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    await executeRun(`UPDATE merchant_reviews SET ${fields} WHERE id = ?`, [...values, id])
  }

  async deleteMerchantReview(id: number): Promise<void> {
    await executeRun('DELETE FROM merchant_reviews WHERE id = ?', [id])
  }

  async countMerchantReviewsByReviewerAndMerchant(
    reviewerId: number,
    merchantId: number,
    start: string,
    end: string
  ): Promise<number> {
    const result = await queryFirst<{ count: number }>(
      'SELECT COUNT(*) as count FROM merchant_reviews WHERE reviewerId = ? AND merchantId = ? AND createdAt >= ? AND createdAt < ?',
      [reviewerId, merchantId, start, end]
    )
    return result?.count || 0
  }

  async findMerchantReviewsTodayByReviewer(reviewerId: number, start: string, end: string): Promise<{ totalCount: number }[]> {
    // 将 ISO 时间转换为 SQLite datetime 格式 (YYYY-MM-DD HH:MM:SS)
    const startStr = start.replace('T', ' ').substring(0, 19)
    const endStr = end.replace('T', ' ').substring(0, 19)
    return executeQuery<{ totalCount: number }>(
      'SELECT totalCount FROM merchant_reviews WHERE reviewerId = ? AND datetime(createdAt) >= ? AND datetime(createdAt) < ?',
      [reviewerId, startStr, endStr]
    )
  }

  // ============ Report 操作 ============
  async createReport(
    reviewId: number | null,
    reviewType: string,
    reporterId: number,
    reason: string
  ): Promise<void> {
    await executeRun('INSERT INTO reports (reviewId, reviewType, reporterId, reason) VALUES (?, ?, ?, ?)', [reviewId, reviewType, reporterId, reason])
  }

  async findReportById(id: number): Promise<Report | null> {
    return queryFirst<Report>('SELECT * FROM reports WHERE id = ?', [id])
  }

  async findPendingReports(limit = 50): Promise<Report[]> {
    return executeQuery<Report>('SELECT * FROM reports WHERE status = ? ORDER BY createdAt DESC LIMIT ?', ['pending', limit])
  }

  async updateReportStatus(id: number, status: string, handlerId?: number | null): Promise<void> {
    await executeRun('UPDATE reports SET status = ?, handlerId = ?, handledAt = CURRENT_TIMESTAMP WHERE id = ?', [status, handlerId || null, id])
  }

  async deleteReport(id: number): Promise<void> {
    await executeRun('DELETE FROM reports WHERE id = ?', [id])
  }

  // ============ BlockedWord 操作 ============
  async findBlockedWords(category?: string): Promise<BlockedWord[]> {
    if (category) {
      return executeQuery<BlockedWord>('SELECT * FROM blocked_words WHERE category = ? AND isActive = 1', [category])
    }
    return executeQuery<BlockedWord>('SELECT * FROM blocked_words WHERE isActive = 1')
  }

  async addBlockedWord(word: string, category: string): Promise<void> {
    await executeRun('INSERT INTO blocked_words (word, category) VALUES (?, ?)', [word, category])
  }

  async removeBlockedWord(id: number): Promise<void> {
    await executeRun('DELETE FROM blocked_words WHERE id = ?', [id])
  }

  async deactivateBlockedWord(word: string): Promise<void> {
    await executeRun('UPDATE blocked_words SET isActive = 0 WHERE word = ?', [word])
  }

  // ============ InviteCode 操作 ============
  async findInviteCode(code: string): Promise<InviteCode | null> {
    return queryFirst<InviteCode>('SELECT * FROM invite_codes WHERE code = ? AND isActive = 1', [code])
  }

  async createInviteCode(code: string, createdBy: number): Promise<void> {
    await executeRun('INSERT INTO invite_codes (code, createdBy) VALUES (?, ?)', [code, createdBy])
  }

  async useInviteCode(code: string, usedBy: number): Promise<void> {
    await executeRun('UPDATE invite_codes SET usedBy = ?, isActive = 0, usedAt = CURRENT_TIMESTAMP WHERE code = ?', [usedBy, code])
  }

  async findInviteCodesByCreator(createdBy: number): Promise<InviteCode[]> {
    return executeQuery<InviteCode>('SELECT * FROM invite_codes WHERE createdBy = ? ORDER BY createdAt DESC', [createdBy])
  }

  // ============ SupportRecord 操作 ============
  async createSupportRecord(
    userId: number,
    amount: number,
    message?: string | null,
    wechat?: string | null,
    sponsorName?: string | null
  ): Promise<void> {
    await executeRun('INSERT INTO support_records (userId, amount, message, wechat, sponsorName) VALUES (?, ?, ?, ?, ?)', [userId, amount, message || null, wechat || null, sponsorName || null])
  }

  async findSupportRecords(userId?: number, status?: string): Promise<SupportRecord[]> {
    let sql = 'SELECT * FROM support_records WHERE 1=1'
    const params: any[] = []

    if (userId) {
      sql += ' AND userId = ?'
      params.push(userId)
    }
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY createdAt DESC'
    return executeQuery<SupportRecord>(sql, params)
  }

  async findSupportRecordById(id: number): Promise<SupportRecord | null> {
    return queryFirst<SupportRecord>('SELECT * FROM support_records WHERE id = ?', [id])
  }

  async updateSupportRecord(id: number, data: Partial<SupportRecord>): Promise<void> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    await executeRun(`UPDATE support_records SET ${fields} WHERE id = ?`, [...values, id])
  }

  async deleteSupportRecord(id: number): Promise<void> {
    await executeRun('DELETE FROM support_records WHERE id = ?', [id])
  }

  // ============ PartTimeJob 操作 ============
  async findPartTimeJobs(activeOnly = true, keyword?: string, gender?: string): Promise<PartTimeJob[]> {
    let sql = 'SELECT * FROM part_time_jobs WHERE 1=1'
    const conditions: string[] = []
    const params: any[] = []

    if (activeOnly) {
      conditions.push("isActive = 1 AND (expireAt IS NULL OR expireAt > datetime('now'))")
    }

    if (keyword) {
      conditions.push('(name LIKE ? OR description LIKE ? OR type LIKE ? OR priceList LIKE ?)')
      const keywordPattern = `%${keyword}%`
      params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern)
    }

    if (gender && gender !== '不限') {
      conditions.push('AND gender = ?')
      params.push(gender)
    }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' ')
    }

    sql += ' ORDER BY createdAt DESC'
    return executeQuery<PartTimeJob>(sql, params)
  }

  async findPartTimeJobById(id: number): Promise<PartTimeJob | null> {
    return queryFirst<PartTimeJob>('SELECT * FROM part_time_jobs WHERE id = ?', [id])
  }

  async createPartTimeJob(data: Partial<PartTimeJob>): Promise<PartTimeJob> {
    const result = await queryFirst<PartTimeJob>(
      'INSERT INTO part_time_jobs (name, gender, type, description, priceList, contact, expireAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *',
      [
        data.name || '',
        data.gender || '不限',
        data.type || '',
        data.description || null,
        data.priceList || null,
        data.contact || '',
        data.expireAt || null,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      ]
    )
    if (!result) throw new Error('Failed to create part-time job')
    return result
  }

  async updatePartTimeJob(id: number, data: Partial<PartTimeJob>): Promise<PartTimeJob> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    const result = await queryFirst<PartTimeJob>(
      `UPDATE part_time_jobs SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`,
      [...values, id]
    )
    if (!result) throw new Error('Failed to update part-time job')
    return result
  }

  async deletePartTimeJob(id: number): Promise<void> {
    await executeRun('DELETE FROM part_time_jobs WHERE id = ?', [id])
  }

  // ============ Rankings 操作 ============
  async getProfileRankings(type: string, limit = 20, timeRange: 'all' | 'week' | 'day' = 'all'): Promise<any[]> {
    let timeCondition = ''
    if (timeRange === 'week') {
      timeCondition = 'AND pr.createdAt >= datetime("now", "-7 days")'
    } else if (timeRange === 'day') {
      timeCondition = 'AND pr.createdAt >= datetime("now", "-1 day")'
    }

    const sql = `
      SELECT
        MIN(p.id) as id,
        p.name,
        MAX(p.campus) as campus,
        MAX(p.className) as className,
        COUNT(DISTINCT p.id) as profileCount,
        COUNT(pr.id) as reviewCount,
        COALESCE(SUM(CASE WHEN pr.type = 'red' THEN pr.bigVotes ELSE 0 END), 0) as redBigVotes,
        COALESCE(SUM(CASE WHEN pr.type = 'red' THEN pr.smallVotes ELSE 0 END), 0) as redSmallVotes,
        COALESCE(SUM(CASE WHEN pr.type = 'black' THEN pr.bigVotes ELSE 0 END), 0) as blackBigVotes,
        COALESCE(SUM(CASE WHEN pr.type = 'black' THEN pr.smallVotes ELSE 0 END), 0) as blackSmallVotes,
        COALESCE(SUM(CASE WHEN pr.type = 'red' THEN pr.bigVotes + pr.smallVotes * 1.0 / 10 ELSE 0 END), 0) as redScore,
        COALESCE(SUM(CASE WHEN pr.type = 'black' THEN pr.bigVotes + pr.smallVotes * 1.0 / 10 ELSE 0 END), 0) as blackScore
      FROM profiles p
      INNER JOIN profile_reviews pr ON p.id = pr.profileId
      WHERE 1=1 ${timeCondition}
      GROUP BY
        p.name,
        COALESCE(p.className, '')
      HAVING COUNT(pr.id) > 0
      ORDER BY ${type === 'red' ? 'redScore' : 'blackScore'} DESC
      LIMIT ?
    `
    return executeQuery(sql, [limit])
  }

  async getMerchantRankings(type: string, limit = 20): Promise<any[]> {
    const sql = `
      SELECT m.*,
             COUNT(mr.id) as reviewCount,
             COALESCE(SUM(CASE WHEN mr.type = 'red' THEN mr.bigVotes ELSE 0 END), 0) as redBigVotes,
             COALESCE(SUM(CASE WHEN mr.type = 'red' THEN mr.smallVotes ELSE 0 END), 0) as redSmallVotes,
             COALESCE(SUM(CASE WHEN mr.type = 'black' THEN mr.bigVotes ELSE 0 END), 0) as blackBigVotes,
             COALESCE(SUM(CASE WHEN mr.type = 'black' THEN mr.smallVotes ELSE 0 END), 0) as blackSmallVotes,
             COALESCE(SUM(CASE WHEN mr.type = 'red' THEN mr.bigVotes + mr.smallVotes * 1.0 / 10 ELSE 0 END), 0) as redScore,
             COALESCE(SUM(CASE WHEN mr.type = 'black' THEN mr.bigVotes + mr.smallVotes * 1.0 / 10 ELSE 0 END), 0) as blackScore
      FROM merchants m
      LEFT JOIN merchant_reviews mr ON m.id = mr.merchantId
      WHERE m.id IN (SELECT merchantId FROM merchant_reviews WHERE type = ?)
      GROUP BY m.id
      ORDER BY redScore DESC, blackScore DESC
      LIMIT ?
    `
    return executeQuery(sql, [type, limit])
  }

  // ============ 登录失败限流操作 ============
  async findFailedLoginAttemptsByIp(ip: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const result = await queryFirst<{ count: number }>(
      'SELECT COUNT(*) as count FROM failed_login_attempts WHERE ip = ? AND createdAt > ?',
      [ip, oneHourAgo]
    )
    return result?.count || 0
  }

  async createFailedLoginAttempt(ip: string, email: string): Promise<void> {
    await executeRun('INSERT INTO failed_login_attempts (ip, email) VALUES (?, ?)', [ip, email])
  }

  async clearFailedLoginAttempts(ip: string): Promise<void> {
    await executeRun('DELETE FROM failed_login_attempts WHERE ip = ?', [ip])
  }
}

// 导出数据库实例
export function createDb(): Database {
  return new Database()
}

// ============ 类型定义 ============

export interface User {
  id: number
  email: string
  phone: string | null
  passwordHash: string | null
  nickname: string | null
  avatar: string | null
  deviceId: string | null
  isVip: number
  isSvip: number
  isMvip: number
  vipExpire: string | null
  svipExpire: string | null
  mvipExpire: string | null
  title: string | null
  showTitle: number
  createdAt: string
  updatedAt: string
}

export interface EmailCode {
  id: number
  email: string
  code: string
  isUsed: number
  expireAt: string
  createdAt: string
}

export interface CaptchaCode {
  id: number
  sessionId: string
  code: string
  isUsed: number
  expireAt: string
  createdAt: string
}

export interface SmsCode {
  id: number
  phone: string
  code: string
  type: string
  isUsed: number
  expireAt: string
  createdAt: string
}

export interface Profile {
  id: number
  userId: number
  name: string
  campus: string | null
  className: string | null
  isPublic: number
  type: string
  remark: string | null
  createdAt: string
}

export interface ProfileReview {
  id: number
  reviewerId: number
  profileId: number
  type: string
  content: string | null
  isAnonymous: number
  totalCount: number
  bigVotes: number
  smallVotes: number
  createdAt: string
}

export interface Merchant {
  id: number
  name: string
  category: string | null
  address: string | null
  phone: string | null
  createdAt: string
}

export interface MerchantReview {
  id: number
  reviewerId: number
  merchantId: number
  rating: number | null
  type: string
  content: string | null
  isAnonymous: number
  totalCount: number
  bigVotes: number
  smallVotes: number
  createdAt: string
}

export interface Report {
  id: number
  reviewId: number | null
  reviewType: string
  reporterId: number
  reason: string
  status: string
  handlerId: number | null
  handledAt: string | null
  createdAt: string
}

export interface BlockedWord {
  id: number
  word: string
  category: string
  isActive: number
  createdAt: string
}

export interface InviteCode {
  id: number
  code: string
  createdBy: number
  usedBy: number | null
  isActive: number
  createdAt: string
  usedAt: string | null
}

export interface SupportRecord {
  id: number
  userId: number
  amount: number
  message: string | null
  wechat: string | null
  sponsorName: string | null
  status: string
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
}

export interface PartTimeJob {
  id: number
  name: string
  gender: string
  type: string
  description: string | null
  priceList: string | null
  contact: string
  expireAt: string | null
  isActive: number
  createdAt: string
  updatedAt: string
}

import type { D1Database } from '@cloudflare/workers-types'

export interface Env {
  DB: D1Database
  JWT_SECRET: string
}

// 数据库操作类
export class Database {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  // ============ User 操作 ============
  async findUserById(id: number): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>()
    return result || null
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>()
    return result || null
  }

  async findUserByPhone(phone: string): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first<User>()
    return result || null
  }

  async createUser(email: string): Promise<User> {
    const result = await this.db
      .prepare('INSERT INTO users (email) VALUES (?) RETURNING *')
      .bind(email)
      .first<User>()
    return result!
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    const result = await this.db
      .prepare(`UPDATE users SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`)
      .bind(...values, id)
      .first<User>()
    return result!
  }

  async updateUserTitle(id: number, title: string | null): Promise<User> {
    const result = await this.db
      .prepare('UPDATE users SET title = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? RETURNING *')
      .bind(title || null, id)
      .first<User>()
    return result!
  }

  async toggleUserTitleVisibility(id: number, showTitle: number): Promise<User> {
    const result = await this.db
      .prepare('UPDATE users SET showTitle = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? RETURNING *')
      .bind(showTitle ? 1 : 0, id)
      .first<User>()
    return result!
  }

  // ============ EmailCode 操作 ============
  async findEmailCode(email: string, code: string): Promise<EmailCode | null> {
    const result = await this.db
      .prepare(
        'SELECT * FROM email_codes WHERE email = ? AND code = ? AND isUsed = 0 AND expireAt > CURRENT_TIMESTAMP ORDER BY createdAt DESC LIMIT 1'
      )
      .bind(email, code)
      .first<EmailCode>()
    return result || null
  }

  async createEmailCode(email: string, code: string, expireAt: string): Promise<void> {
    await this.db
      .prepare('INSERT INTO email_codes (email, code, expireAt) VALUES (?, ?, ?)')
      .bind(email, code, expireAt)
      .run()
  }

  async markEmailCodeUsed(id: number): Promise<void> {
    await this.db.prepare('UPDATE email_codes SET isUsed = 1 WHERE id = ?').bind(id).run()
  }

  async findEmailCodesCountToday(email: string, start: string, end: string): Promise<number> {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM email_codes WHERE email = ? AND createdAt >= ? AND createdAt < ?')
      .bind(email, start, end)
      .first<{ count: number }>()
    return result?.count || 0
  }

  // ============ CaptchaCode 操作 ============
  async findCaptchaCode(sessionId: string): Promise<CaptchaCode | null> {
    const result = await this.db
      .prepare('SELECT * FROM captcha_codes WHERE sessionId = ?')
      .bind(sessionId)
      .first<CaptchaCode>()
    return result || null
  }

  async createCaptchaCode(sessionId: string, code: string, expireAt: string): Promise<void> {
    await this.db
      .prepare('INSERT INTO captcha_codes (sessionId, code, expireAt) VALUES (?, ?, ?)')
      .bind(sessionId, code, expireAt)
      .run()
  }

  async markCaptchaCodeUsed(sessionId: string): Promise<void> {
    await this.db.prepare('UPDATE captcha_codes SET isUsed = 1 WHERE sessionId = ?').bind(sessionId).run()
  }

  // ============ SmsCode 操作 ============
  async findSmsCode(phone: string, code: string): Promise<SmsCode | null> {
    const result = await this.db
      .prepare(
        'SELECT * FROM sms_codes WHERE phone = ? AND code = ? AND isUsed = 0 AND expireAt > CURRENT_TIMESTAMP ORDER BY createdAt DESC LIMIT 1'
      )
      .bind(phone, code)
      .first<SmsCode>()
    return result || null
  }

  async createSmsCode(phone: string, code: string, type: string, expireAt: string): Promise<void> {
    await this.db
      .prepare('INSERT INTO sms_codes (phone, code, type, expireAt) VALUES (?, ?, ?, ?)')
      .bind(phone, code, type, expireAt)
      .run()
  }

  async markSmsCodeUsed(id: number): Promise<void> {
    await this.db.prepare('UPDATE sms_codes SET isUsed = 1 WHERE id = ?').bind(id).run()
  }

  // ============ Profile 操作 ============
  async findProfilesByUserId(userId: number): Promise<Profile[]> {
    const result = await this.db
      .prepare('SELECT * FROM profiles WHERE userId = ? ORDER BY createdAt DESC')
      .bind(userId)
      .all<Profile>()
    return result.results || []
  }

  async findProfileById(id: number): Promise<Profile | null> {
    const result = await this.db.prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first<Profile>()
    return result || null
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
    const result = await this.db
      .prepare(
        'INSERT INTO profiles (userId, name, campus, className, isPublic, type, remark) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *'
      )
      .bind(userId, name, campus || null, className || null, isPublic ? 1 : 0, type || 'red', remark || null)
      .first<Profile>()
    return result!
  }

  async updateProfile(id: number, data: Partial<Profile>): Promise<Profile> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    const result = await this.db
      .prepare(`UPDATE profiles SET ${fields} WHERE id = ? RETURNING *`)
      .bind(...values, id)
      .first<Profile>()
    return result!
  }

  async deleteProfile(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM profiles WHERE id = ?').bind(id).run()
  }

  async findProfilesByName(name: string): Promise<Profile[]> {
    const result = await this.db
      .prepare('SELECT * FROM profiles WHERE name = ? ORDER BY createdAt DESC')
      .bind(name)
      .all<Profile>()
    return result.results || []
  }

  // ============ ProfileReview 操作 ============
  async findProfileReviewsByProfileId(profileId: number, limit = 50): Promise<ProfileReview[]> {
    const result = await this.db
      .prepare('SELECT * FROM profile_reviews WHERE profileId = ? ORDER BY createdAt DESC LIMIT ?')
      .bind(profileId, limit)
      .all<ProfileReview>()
    return result.results || []
  }

  async findProfileReviewById(id: number): Promise<ProfileReview | null> {
    const result = await this.db
      .prepare('SELECT * FROM profile_reviews WHERE id = ?')
      .bind(id)
      .first<ProfileReview>()
    return result || null
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
    const result = await this.db
      .prepare(
        'INSERT INTO profile_reviews (reviewerId, profileId, type, content, isAnonymous, totalCount, bigVotes, smallVotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *'
      )
      .bind(reviewerId, profileId, type, content || null, isAnonymous ? 1 : 0, totalCount || 0, bigVotes || 0, smallVotes || 0)
      .first<ProfileReview>()
    return result!
  }

  async updateProfileReview(id: number, data: Partial<ProfileReview>): Promise<void> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    await this.db
      .prepare(`UPDATE profile_reviews SET ${fields} WHERE id = ?`)
      .bind(...values, id)
      .run()
  }

  async deleteProfileReview(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM profile_reviews WHERE id = ?').bind(id).run()
  }

  async countProfileReviewsByReviewerAndProfile(reviewerId: number, profileId: number, start: string, end: string): Promise<number> {
    const result = await this.db
      .prepare(
        'SELECT COUNT(*) as count FROM profile_reviews WHERE reviewerId = ? AND profileId = ? AND createdAt >= ? AND createdAt < ?'
      )
      .bind(reviewerId, profileId, start, end)
      .first<{ count: number }>()
    return result?.count || 0
  }

  async findProfileReviewsTodayByReviewer(reviewerId: number, start: string, end: string): Promise<{ totalCount: number }[]> {
    const result = await this.db
      .prepare(
        'SELECT totalCount FROM profile_reviews WHERE reviewerId = ? AND createdAt >= ? AND createdAt < ?'
      )
      .bind(reviewerId, start, end)
      .all<{ totalCount: number }>()
    return result.results || []
  }

  // ============ Merchant 操作 ============
  async findMerchants(search?: string, limit = 50): Promise<Merchant[]> {
    let sql = 'SELECT * FROM merchants'
    if (search) {
      sql += ' WHERE name LIKE ?'
      const result = await this.db.prepare(sql).bind(`%${search}%`).all<Merchant>()
      return result.results || []
    }
    const result = await this.db.prepare(sql + ' ORDER BY createdAt DESC LIMIT ?').bind(limit).all<Merchant>()
    return result.results || []
  }

  async findMerchantById(id: number): Promise<Merchant | null> {
    const result = await this.db.prepare('SELECT * FROM merchants WHERE id = ?').bind(id).first<Merchant>()
    return result || null
  }

  async createMerchant(
    name: string,
    category?: string | null,
    address?: string | null,
    phone?: string | null
  ): Promise<Merchant> {
    const result = await this.db
      .prepare('INSERT INTO merchants (name, category, address, phone) VALUES (?, ?, ?, ?) RETURNING *')
      .bind(name, category || null, address || null, phone || null)
      .first<Merchant>()
    return result!
  }

  async updateMerchant(id: number, data: Partial<Merchant>): Promise<Merchant> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    const result = await this.db
      .prepare(`UPDATE merchants SET ${fields} WHERE id = ? RETURNING *`)
      .bind(...values, id)
      .first<Merchant>()
    return result!
  }

  async deleteMerchant(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM merchants WHERE id = ?').bind(id).run()
  }

  // ============ MerchantReview 操作 ============
  async findMerchantReviewsByMerchantId(merchantId: number, limit = 50): Promise<MerchantReview[]> {
    const result = await this.db
      .prepare('SELECT * FROM merchant_reviews WHERE merchantId = ? ORDER BY createdAt DESC LIMIT ?')
      .bind(merchantId, limit)
      .all<MerchantReview>()
    return result.results || []
  }

  async findMerchantReviewById(id: number): Promise<MerchantReview | null> {
    const result = await this.db
      .prepare('SELECT * FROM merchant_reviews WHERE id = ?')
      .bind(id)
      .first<MerchantReview>()
    return result || null
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
    const result = await this.db
      .prepare(
        'INSERT INTO merchant_reviews (reviewerId, merchantId, type, rating, content, isAnonymous, totalCount, bigVotes, smallVotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *'
      )
      .bind(reviewerId, merchantId, type, rating || null, content || null, isAnonymous ? 1 : 0, totalCount || 0, bigVotes || 0, smallVotes || 0)
      .first<MerchantReview>()
    return result!
  }

  async updateMerchantReview(id: number, data: Partial<MerchantReview>): Promise<void> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    await this.db
      .prepare(`UPDATE merchant_reviews SET ${fields} WHERE id = ?`)
      .bind(...values, id)
      .run()
  }

  async deleteMerchantReview(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM merchant_reviews WHERE id = ?').bind(id).run()
  }

  async countMerchantReviewsByReviewerAndMerchant(
    reviewerId: number,
    merchantId: number,
    start: string,
    end: string
  ): Promise<number> {
    const result = await this.db
      .prepare(
        'SELECT COUNT(*) as count FROM merchant_reviews WHERE reviewerId = ? AND merchantId = ? AND createdAt >= ? AND createdAt < ?'
      )
      .bind(reviewerId, merchantId, start, end)
      .first<{ count: number }>()
    return result?.count || 0
  }

  async findMerchantReviewsTodayByReviewer(reviewerId: number, start: string, end: string): Promise<{ totalCount: number }[]> {
    const result = await this.db
      .prepare(
        'SELECT totalCount FROM merchant_reviews WHERE reviewerId = ? AND createdAt >= ? AND createdAt < ?'
      )
      .bind(reviewerId, start, end)
      .all<{ totalCount: number }>()
    return result.results || []
  }

  // ============ Report 操作 ============
  async createReport(
    reviewId: number | null,
    reviewType: string,
    reporterId: number,
    reason: string
  ): Promise<void> {
    await this.db
      .prepare('INSERT INTO reports (reviewId, reviewType, reporterId, reason) VALUES (?, ?, ?, ?)')
      .bind(reviewId, reviewType, reporterId, reason)
      .run()
  }

  async findReportById(id: number): Promise<Report | null> {
    const result = await this.db.prepare('SELECT * FROM reports WHERE id = ?').bind(id).first<Report>()
    return result || null
  }

  async findPendingReports(limit = 50): Promise<Report[]> {
    const result = await this.db
      .prepare('SELECT * FROM reports WHERE status = ? ORDER BY createdAt DESC LIMIT ?')
      .bind('pending', limit)
      .all<Report>()
    return result.results || []
  }

  async updateReportStatus(id: number, status: string, handlerId?: number | null): Promise<void> {
    await this.db
      .prepare('UPDATE reports SET status = ?, handlerId = ?, handledAt = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(status, handlerId || null, id)
      .run()
  }

  async deleteReport(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM reports WHERE id = ?').bind(id).run()
  }

  // ============ BlockedWord 操作 ============
  async findBlockedWords(category?: string): Promise<BlockedWord[]> {
    let sql = 'SELECT * FROM blocked_words WHERE isActive = 1'
    if (category) {
      sql += ' AND category = ?'
      const result = await this.db.prepare(sql).bind(category).all<BlockedWord>()
      return result.results || []
    }
    const result = await this.db.prepare(sql).all<BlockedWord>()
    return result.results || []
  }

  async addBlockedWord(word: string, category: string): Promise<void> {
    await this.db
      .prepare('INSERT INTO blocked_words (word, category) VALUES (?, ?)')
      .bind(word, category)
      .run()
  }

  async removeBlockedWord(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM blocked_words WHERE id = ?').bind(id).run()
  }

  async deactivateBlockedWord(word: string): Promise<void> {
    await this.db.prepare('UPDATE blocked_words SET isActive = 0 WHERE word = ?').bind(word).run()
  }

  // ============ InviteCode 操作 ============
  async findInviteCode(code: string): Promise<InviteCode | null> {
    const result = await this.db
      .prepare('SELECT * FROM invite_codes WHERE code = ? AND isActive = 1')
      .bind(code)
      .first<InviteCode>()
    return result || null
  }

  async createInviteCode(code: string, createdBy: number): Promise<void> {
    await this.db.prepare('INSERT INTO invite_codes (code, createdBy) VALUES (?, ?)').bind(code, createdBy).run()
  }

  async useInviteCode(code: string, usedBy: number): Promise<void> {
    await this.db
      .prepare('UPDATE invite_codes SET usedBy = ?, isActive = 0, usedAt = CURRENT_TIMESTAMP WHERE code = ?')
      .bind(usedBy, code)
      .run()
  }

  async findInviteCodesByCreator(createdBy: number): Promise<InviteCode[]> {
    const result = await this.db
      .prepare('SELECT * FROM invite_codes WHERE createdBy = ? ORDER BY createdAt DESC')
      .bind(createdBy)
      .all<InviteCode>()
    return result.results || []
  }

  // ============ SupportRecord 操作 ============
  async createSupportRecord(
    userId: number,
    amount: number,
    message?: string | null,
    wechat?: string | null,
    sponsorName?: string | null
  ): Promise<void> {
    await this.db
      .prepare('INSERT INTO support_records (userId, amount, message, wechat, sponsorName) VALUES (?, ?, ?, ?, ?)')
      .bind(userId, amount, message || null, wechat || null, sponsorName || null)
      .run()
  }

  async findSupportRecords(userId?: number, status?: string): Promise<SupportRecord[]> {
    let sql = 'SELECT * FROM support_records'
    const conditions: string[] = []
    const params: any[] = []

    if (userId) {
      conditions.push('userId = ?')
      params.push(userId)
    }
    if (status) {
      conditions.push('status = ?')
      params.push(status)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY createdAt DESC'

    const result = await this.db.prepare(sql).bind(...params).all<SupportRecord>()
    return result.results || []
  }

  async findSupportRecordById(id: number): Promise<SupportRecord | null> {
    const result = await this.db.prepare('SELECT * FROM support_records WHERE id = ?').bind(id).first<SupportRecord>()
    return result || null
  }

  async updateSupportRecord(id: number, data: Partial<SupportRecord>): Promise<void> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    await this.db
      .prepare(`UPDATE support_records SET ${fields} WHERE id = ?`)
      .bind(...values, id)
      .run()
  }

  async deleteSupportRecord(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM support_records WHERE id = ?').bind(id).run()
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
      conditions.push('gender = ?')
      params.push(gender)
    }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY createdAt DESC'

    const result = await this.db.prepare(sql).bind(...params).all<PartTimeJob>()
    return result.results || []
  }

  async findPartTimeJobById(id: number): Promise<PartTimeJob | null> {
    const result = await this.db.prepare('SELECT * FROM part_time_jobs WHERE id = ?').bind(id).first<PartTimeJob>()
    return result || null
  }

  async createPartTimeJob(data: Partial<PartTimeJob>): Promise<PartTimeJob> {
    const result = await this.db
      .prepare(
        'INSERT INTO part_time_jobs (name, gender, type, description, priceList, contact, expireAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *'
      )
      .bind(
        data.name || '',
        data.gender || '不限',
        data.type || '',
        data.description || null,
        data.priceList || null,
        data.contact || '',
        data.expireAt || null,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1
      )
      .first<PartTimeJob>()
    return result!
  }

  async updatePartTimeJob(id: number, data: Partial<PartTimeJob>): Promise<PartTimeJob> {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    const result = await this.db
      .prepare(`UPDATE part_time_jobs SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`)
      .bind(...values, id)
      .first<PartTimeJob>()
    return result!
  }

  async deletePartTimeJob(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM part_time_jobs WHERE id = ?').bind(id).run()
  }

  // ============ Rankings 操作 ============
  async getProfileRankings(type: string, limit = 20, timeRange: 'all' | 'week' | 'day' = 'all'): Promise<any[]> {
    // 按 name+className 分组整合人员数据
    // 同名 + 同班级（级 + 系）定义为同一个人，校区不作为区分条件
    // 如果没有班级，则只按姓名分组
    // 榜分计算：1 × 大票 + 小票/10（允许小数点）

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
    const result = await this.db.prepare(sql).bind(limit).all()
    return result.results || []
  }

  async getMerchantRankings(type: string, limit = 20): Promise<any[]> {
    // 榜分计算：1 × 大票 + 小票/10（允许小数点）
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
    const result = await this.db.prepare(sql).bind(type, limit).all()
    return result.results || []
  }
}

// 创建数据库实例的工厂函数
export function createDb(db: D1Database): Database {
  return new Database(db)
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

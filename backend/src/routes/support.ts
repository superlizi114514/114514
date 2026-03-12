import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import type { Database } from '../db-vercel.js'

const router = new Hono<AppEnv>()

// JWT 验证中间件
async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未登录' }, 401)
  }
  try {
    const { jwtVerify } = await import('jose')
    const token = authHeader.slice(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    c.set('userId', (payload as any).userId)
    c.set('email', (payload as any).email)
    await next()
  } catch {
    return c.json({ success: false, message: 'Token 无效' }, 401)
  }
}

// 提交赞助申请
router.post('/submit', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  const { amount, message, wechat } = await c.req.json()

  if (!amount || amount < 1) {
    return c.json({ success: false, message: '赞助金额至少 ¥1' })
  }

  await db.createSupportRecord(userId, parseFloat(amount), message || null, wechat || null)
  return c.json({ success: true, message: '提交成功！管理员将在 24 小时内处理' })
})

// 获取我的赞助记录
router.get('/records', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  const records = await db.findSupportRecords(userId)
  return c.json({ success: true, records })
})

// 获取赞助者名单（公开）
router.get('/supporters', async (c) => {
  const db = c.get('db') as Database

  const records = await db.findSupportRecords(undefined, 'approved')
  const result = records
    .map((s) => ({
      id: s.id,
      userId: s.userId,
      amount: s.amount,
      message: s.message,
      sponsorName: s.sponsorName,
      createdAt: s.createdAt
    }))
    .sort((a, b) => b.amount - a.amount) // 按赞助金额降序排序

  return c.json({ success: true, supporters: result })
})

// 管理员获取所有赞助记录
router.get('/admin/records', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未登录' }, 401)
  }

  try {
    const { jwtVerify } = await import('jose')
    const token = authHeader.slice(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const email = (payload as any).email

    if (email !== 'admin@admin') {
      return c.json({ success: false, message: '无权限' }, 403)
    }

    const db = c.get('db') as Database

    // 查询赞助记录并关联用户信息
    const sql = `
      SELECT s.*, u.email, u.nickname, u.phone
      FROM support_records s
      LEFT JOIN users u ON s.userId = u.id
      ORDER BY s.createdAt DESC
    `
    const result = await (db as any).executeQuery(sql)
    const records = result || []

    // 格式化返回数据
    const formattedRecords = records.map((r: any) => ({
      ...r,
      user: {
        email: r.email,
        nickname: r.nickname,
        phone: r.phone
      }
    }))

    return c.json({ success: true, records: formattedRecords })
  } catch (e) {
    console.error('Get support records error:', e)
    return c.json({ success: false, message: 'Token 无效：' + (e as any)?.message }, 401)
  }
})

// 管理员审核通过
router.post('/admin/approve', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未登录' }, 401)
  }

  try {
    const { jwtVerify } = await import('jose')
    const token = authHeader.slice(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const userId = (payload as any).userId
    const email = (payload as any).email

    if (email !== 'admin@admin') {
      return c.json({ success: false, message: '无权限' }, 403)
    }

    const { recordId, vipDays } = await c.req.json()
    if (!recordId || vipDays === undefined || vipDays === null) {
      return c.json({ success: false, message: '参数不完整' })
    }

    const db = c.get('db') as Database
    const record = await db.findSupportRecordById(recordId)
    if (!record) {
      return c.json({ success: false, message: '记录不存在' })
    }

    // 只有 vipDays > 0 时才开通 VIP
    if (vipDays > 0) {
      const vipExpire = new Date(Date.now() + vipDays * 24 * 60 * 60 * 1000).toISOString()
      await db.updateUser(record.userId, { isVip: 1, vipExpire })
    }

    await db.updateSupportRecord(recordId, { status: 'approved', approvedBy: String(userId), approvedAt: new Date().toISOString() })

    return c.json({ success: true, message: vipDays > 0 ? 'VIP 已开通' : '赞助已记录（未开通 VIP）' })
  } catch (e) {
    console.error('Approve error:', e)
    return c.json({ success: false, message: '操作失败' }, 500)
  }
})

// 管理员直接授予 VIP（无需赞助记录）
router.post('/admin/grant', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未登录' }, 401)
  }

  try {
    const { jwtVerify } = await import('jose')
    const token = authHeader.slice(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const email = (payload as any).email
    const userId = (payload as any).userId

    console.log('[/admin/grant] Request:', { email, targetUserId: userId })

    if (email !== 'admin@admin') {
      return c.json({ success: false, message: '无权限' }, 403)
    }

    const { targetUserId, amount, vipDays } = await c.req.json()
    console.log('[/admin/grant] Params:', { targetUserId, amount, vipDays })

    if (!targetUserId || amount === undefined || amount === null) {
      return c.json({ success: false, message: '参数不完整' })
    }

    const db = c.get('db') as Database
    const user = await db.findUserById(targetUserId)
    console.log('[/admin/grant] User found:', user)

    if (!user) {
      return c.json({ success: false, message: '用户不存在' })
    }

    // 只有 vipDays > 0 时才开通 VIP
    if (vipDays && vipDays > 0) {
      const vipExpire = new Date(Date.now() + vipDays * 24 * 60 * 60 * 1000).toISOString()
      console.log('[/admin/grant] Setting VIP expire:', vipExpire)
      await db.updateUser(targetUserId, { isVip: 1, vipExpire })
    }

    // 创建赞助记录（无论是否开通 VIP 都记录）
    await db.createSupportRecord(targetUserId, amount || 0, '管理员直接授予', null)

    return c.json({ success: true, message: vipDays && vipDays > 0 ? 'VIP 已开通' : '赞助已记录' })
  } catch (e) {
    console.error('Grant error:', e)
    return c.json({ success: false, message: '操作失败：' + (e as any)?.message }, 500)
  }
})

// 管理员修改赞助记录的赞助人名称
router.post('/admin/update-nickname', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未登录' }, 401)
  }

  try {
    const { jwtVerify } = await import('jose')
    const token = authHeader.slice(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const email = (payload as any).email

    if (email !== 'admin@admin') {
      return c.json({ success: false, message: '无权限' }, 403)
    }

    const { recordId, nickname } = await c.req.json()
    if (!recordId) {
      return c.json({ success: false, message: '参数不完整' })
    }

    const db = c.get('db') as Database
    // 确保 recordId 是数字类型
    const id = typeof recordId === 'string' ? parseInt(recordId) : recordId
    const record = await db.findSupportRecordById(id)
    if (!record) {
      return c.json({ success: false, message: '记录不存在' })
    }

    // 更新赞助记录的 sponsorName 字段（独立于用户昵称）
    await db.updateSupportRecord(id, { sponsorName: nickname || null })

    return c.json({ success: true, message: '赞助人名称已更新' })
  } catch (e) {
    console.error('Update nickname error:', e)
    return c.json({ success: false, message: '操作失败' }, 500)
  }
})

// 管理员修改赞助金额
router.post('/admin/update', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未登录' }, 401)
  }

  try {
    const { jwtVerify } = await import('jose')
    const token = authHeader.slice(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const email = (payload as any).email

    if (email !== 'admin@admin') {
      return c.json({ success: false, message: '无权限' }, 403)
    }

    const { recordId, amount } = await c.req.json()
    if (!recordId || amount === undefined || amount === null) {
      return c.json({ success: false, message: '参数不完整' })
    }

    const db = c.get('db') as Database
    const id = typeof recordId === 'string' ? parseInt(recordId) : recordId
    const record = await db.findSupportRecordById(id)
    if (!record) {
      return c.json({ success: false, message: '记录不存在' })
    }

    if (parseFloat(amount) < 0) {
      return c.json({ success: false, message: '金额不能为负数' })
    }

    await db.updateSupportRecord(id, { amount: parseFloat(amount) })

    return c.json({ success: true, message: '金额已更新' })
  } catch (e) {
    console.error('Update amount error:', e)
    return c.json({ success: false, message: '操作失败' }, 500)
  }
})

// 管理员删除赞助记录
router.post('/admin/delete', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未登录' }, 401)
  }

  try {
    const { jwtVerify } = await import('jose')
    const token = authHeader.slice(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const email = (payload as any).email

    if (email !== 'admin@admin') {
      return c.json({ success: false, message: '无权限' }, 403)
    }

    const { recordId } = await c.req.json()
    if (!recordId) {
      return c.json({ success: false, message: '参数不完整' })
    }

    const db = c.get('db') as Database
    const id = typeof recordId === 'string' ? parseInt(recordId) : recordId
    await db.deleteSupportRecord(id)

    return c.json({ success: true, message: '记录已删除' })
  } catch (e) {
    console.error('Delete error:', e)
    return c.json({ success: false, message: '操作失败' }, 500)
  }
})

export default router

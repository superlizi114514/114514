import { Hono } from 'hono'
import type { AppEnv } from '../worker.js'
import type { Database } from '../db.js'

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
    const secret = new TextEncoder().encode(c.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    c.set('userId', (payload as any).userId)
    c.set('email', (payload as any).email)
    await next()
  } catch {
    return c.json({ success: false, message: 'Token 无效' }, 401)
  }
}

// 检查是否管理员
async function isAdminMiddleware(c: any, next: any) {
  await authMiddleware(c, next)
  const email = c.get('email')
  if (email !== 'admin@admin') {
    return c.json({ success: false, message: '无权限' }, 403)
  }
}

// 获取举报列表
router.get('/', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database

  // 查询举报数据，并关联查询点评和举报人信息
  const sql = `
    SELECT
      r.*,
      u.email as reporterEmail,
      pr.content as profileReviewContent,
      mr.content as merchantReviewContent,
      pr.id as profileReviewId,
      mr.id as merchantReviewId,
      pr.reviewerId as profileReviewerId,
      mr.reviewerId as merchantReviewerId,
      pr.totalCount as profileTotalCount,
      mr.totalCount as merchantTotalCount,
      m.name as merchantName,
      p.name as profileName,
      p.id as profileId
    FROM reports r
    LEFT JOIN users u ON r.reporterId = u.id
    LEFT JOIN profile_reviews pr ON r.reviewId = pr.id AND r.reviewType = 'profile'
    LEFT JOIN merchant_reviews mr ON r.reviewId = mr.id AND r.reviewType = 'merchant'
    LEFT JOIN merchants m ON mr.merchantId = m.id
    LEFT JOIN profiles p ON pr.profileId = p.id
    ORDER BY r.createdAt DESC
    LIMIT 50
  `
  const result = await c.env.DB.prepare(sql).all()
  const reports = result.results || []

  // 处理数据格式
  const formattedReports = reports.map((rep: any) => {
    // 根据 reviewType 选择对应的字段
    const reviewContent = rep.reviewType === 'profile' ? rep.profileReviewContent : rep.merchantReviewContent
    const reviewId = rep.reviewType === 'profile' ? rep.profileReviewId : rep.merchantReviewId
    const reviewerId = rep.reviewType === 'profile' ? rep.profileReviewerId : rep.merchantReviewerId
    const totalCount = rep.reviewType === 'profile' ? rep.profileTotalCount : rep.merchantTotalCount

    return {
      ...rep,
      reporter: { email: rep.reporterEmail },
      review: {
        content: reviewContent || null,
        id: reviewId || null,
        reviewerId: reviewerId || null,
        totalCount: totalCount || 0
      },
      merchant: rep.merchantName ? { name: rep.merchantName } : null,
      profile: rep.profileName ? { name: rep.profileName, id: rep.profileId } : null
    }
  })

  return c.json({ success: true, data: formattedReports })
})

// 举报审批通过
router.post('/reports/:id/approve', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))

  const report = await db.findReportById(id)
  if (!report) {
    return c.json({ success: false, message: '记录不存在' })
  }

  if (report.reviewType === 'profile') {
    await db.deleteProfileReview(report.reviewId)
  } else if (report.reviewType === 'merchant') {
    await db.deleteMerchantReview(report.reviewId)
  }

  await db.updateReportStatus(id, 'approved', userId)
  return c.json({ success: true })
})

// 举报审批拒绝
router.post('/reports/:id/reject', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'))

  await db.updateReportStatus(id, 'rejected', userId)
  return c.json({ success: true })
})

// 获取举报历史记录
router.get('/reports/history', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database

  // 查询已处理的举报，并关联查询点评和举报人信息
  const sql = `
    SELECT
      r.*,
      u.email as reporterEmail,
      pr.content as profileReviewContent,
      mr.content as merchantReviewContent,
      pr.id as profileReviewId,
      mr.id as merchantReviewId,
      pr.reviewerId as profileReviewerId,
      mr.reviewerId as merchantReviewerId,
      pr.totalCount as profileTotalCount,
      mr.totalCount as merchantTotalCount,
      m.name as merchantName,
      p.name as profileName,
      p.id as profileId
    FROM reports r
    LEFT JOIN users u ON r.reporterId = u.id
    LEFT JOIN profile_reviews pr ON r.reviewId = pr.id AND r.reviewType = 'profile'
    LEFT JOIN merchant_reviews mr ON r.reviewId = mr.id AND r.reviewType = 'merchant'
    LEFT JOIN merchants m ON mr.merchantId = m.id
    LEFT JOIN profiles p ON pr.profileId = p.id
    WHERE r.status != ?
    ORDER BY r.createdAt DESC
    LIMIT 100
  `
  const result = await c.env.DB.prepare(sql).bind('pending').all()
  const reports = result.results || []

  // 处理数据格式
  const formattedReports = reports.map((rep: any) => {
    const reviewContent = rep.reviewType === 'profile' ? rep.profileReviewContent : rep.merchantReviewContent
    const reviewId = rep.reviewType === 'profile' ? rep.profileReviewId : rep.merchantReviewId
    const reviewerId = rep.reviewType === 'profile' ? rep.profileReviewerId : rep.merchantReviewerId
    const totalCount = rep.reviewType === 'profile' ? rep.profileTotalCount : rep.merchantTotalCount

    return {
      ...rep,
      reporter: { email: rep.reporterEmail },
      review: {
        content: reviewContent || null,
        id: reviewId || null,
        reviewerId: reviewerId || null,
        totalCount: totalCount || 0
      },
      merchant: rep.merchantName ? { name: rep.merchantName } : null,
      profile: rep.profileName ? { name: rep.profileName, id: rep.profileId } : null
    }
  })

  return c.json({ success: true, data: formattedReports })
})

// 获取用户列表
router.get('/users', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const now = new Date()

  // 查询所有用户字段
  const result = await c.env.DB
    .prepare('SELECT id, email, nickname, isVip, isSvip, isMvip, vipExpire, svipExpire, mvipExpire, createdAt, title, showTitle FROM users ORDER BY createdAt DESC LIMIT 100')
    .all()

  // 检查过期时间，返回正确的 VIP 状态
  const users = (result.results || []).map((user: any) => {
    const isAdmin = user.email === 'admin@admin'
    const isSvip = !isAdmin && user.isSvip === 1 && user.svipExpire && new Date(user.svipExpire) > now
    const isMvip = !isAdmin && !isSvip && user.isMvip === 1 && user.mvipExpire && new Date(user.mvipExpire) > now
    const isVip = !isSvip && !isMvip && !isAdmin && user.isVip === 1 && user.vipExpire && new Date(user.vipExpire) > now

    return {
      ...user,
      isSvip,
      isMvip,
      isVip
    }
  })

  return c.json({ success: true, data: users })
})

// 删除用户
router.post('/users/:id/delete', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')
  const targetId = parseInt(c.req.param('id'))

  if (targetId === userId) {
    return c.json({ success: false, message: '不能删除自己' })
  }

  try {
    // 删除相关数据（注意顺序：先删除外键引用的表）
    await c.env.DB.prepare('DELETE FROM invite_codes WHERE createdBy = ?').bind(targetId).run()
    await c.env.DB.prepare('DELETE FROM support_records WHERE userId = ?').bind(targetId).run()
    await c.env.DB.prepare('DELETE FROM profile_reviews WHERE reviewerId = ?').bind(targetId).run()
    await c.env.DB.prepare('DELETE FROM merchant_reviews WHERE reviewerId = ?').bind(targetId).run()
    await c.env.DB.prepare('DELETE FROM profiles WHERE userId = ?').bind(targetId).run()
    await c.env.DB.prepare('DELETE FROM reports WHERE reporterId = ?').bind(targetId).run()
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(targetId).run()

    return c.json({ success: true, message: '用户已删除' })
  } catch (e: any) {
    console.error('Delete user error:', e)
    return c.json({ success: false, message: '删除失败：' + e.message }, 500)
  }
})

// 重置用户密码
router.post('/users/:id/reset-password', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const targetId = parseInt(c.req.param('id'))
  const { newPassword } = await c.req.json()

  if (!newPassword || newPassword.length < 6) {
    return c.json({ success: false, message: '密码至少 6 位' })
  }

  const user = await db.findUserById(targetId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' })
  }

  // 计算密码 hash
  const encoder = new TextEncoder()
  const data = encoder.encode(newPassword)
  const hashBuffer = await (crypto as any).subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  const passwordHash = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  await db.updateUser(targetId, { passwordHash })
  return c.json({ success: true, message: '密码已重置' })
})

// 重置用户点评次数
router.post('/users/:id/reset-reviews', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const targetId = parseInt(c.req.param('id'))

  const user = await db.findUserById(targetId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' })
  }

  // 删除该用户的所有点评记录
  await c.env.DB.prepare('DELETE FROM profile_reviews WHERE reviewerId = ?').bind(targetId).run()
  await c.env.DB.prepare('DELETE FROM merchant_reviews WHERE reviewerId = ?').bind(targetId).run()

  return c.json({ success: true, message: '点评记录已清空' })
})

// 设置用户称号
router.post('/users/:id/set-title', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const targetId = parseInt(c.req.param('id'))
  const { title } = await c.req.json()

  const user = await db.findUserById(targetId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' })
  }

  // 称号为空则删除，否则更新
  await db.updateUserTitle(targetId, title || null)
  return c.json({ success: true, message: '称号已更新' })
})

// 切换用户称号显示状态
router.post('/users/:id/toggle-title', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const targetId = parseInt(c.req.param('id'))
  const { showTitle } = await c.req.json()

  const user = await db.findUserById(targetId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' })
  }

  await db.toggleUserTitleVisibility(targetId, showTitle ? 1 : 0)
  return c.json({ success: true, message: '称号显示状态已更新' })
})

// 获取用户可用称号列表（管理员）
router.get('/users/:id/available-titles', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const targetId = parseInt(c.req.param('id'))
  const now = new Date()

  const user = await db.findUserById(targetId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' })
  }

  const titles: string[] = []

  // 权限组称号
  if (user.email === 'admin@admin') {
    titles.push('管理员')
    titles.push('站长')
    titles.push('幕后黑手')
  } else if (user.isSvip === 1 && user.svipExpire && new Date(user.svipExpire) > now) {
    titles.push('SVIP')
    titles.push('至尊大佬')
    titles.push('荣誉校友')
  } else if (user.isMvip === 1 && user.mvipExpire && new Date(user.mvipExpire) > now) {
    titles.push('MVIP')
    titles.push('精英玩家')
  } else if (user.isVip === 1 && user.vipExpire && new Date(user.vipExpire) > now) {
    titles.push('VIP')
    titles.push('校园达人')
  }

  // 通用称号
  const commonTitles = [
    '吃瓜群众',
    '萌新',
    '路人甲',
    '潜水员',
    '键盘侠',
    '观察员',
    '打工人',
    '干饭王',
    '学霸',
    '学渣',
    '社牛',
    '社恐',
    '早八人',
    '熬夜冠军',
    '摸鱼达人'
  ]

  commonTitles.forEach(t => {
    if (!titles.includes(t)) {
      titles.push(t)
    }
  })

  // 自定义称号
  if (user.title) {
    titles.push(user.title)
  }

  return c.json({ success: true, titles, currentTitle: user.title || null, showTitle: user.showTitle === 1 })
})

// 设置用户 VIP 状态
router.post('/users/:id/set-vip', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const targetId = parseInt(c.req.param('id'))
  const { isVip, isSvip, isMvip, vipDays, svipDays, mvipDays } = await c.req.json()

  const user = await db.findUserById(targetId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' })
  }

  const updateData: any = {}
  const now = new Date()

  // 如果设置 MVIP，先关闭 VIP 和 SVIP
  if (isMvip) {
    updateData.isVip = 0
    updateData.isSvip = 0
    updateData.isMvip = 1
    if (mvipDays) {
      const expireDate = new Date(now)
      expireDate.setDate(expireDate.getDate() + parseInt(mvipDays))
      updateData.mvipExpire = expireDate.toISOString()
    } else {
      updateData.mvipExpire = null
    }
  }
  // 如果设置 SVIP，先关闭 VIP 和 MVIP
  else if (isSvip) {
    updateData.isVip = 0
    updateData.isMvip = 0
    updateData.isSvip = 1
    if (svipDays) {
      const expireDate = new Date(now)
      expireDate.setDate(expireDate.getDate() + parseInt(svipDays))
      updateData.svipExpire = expireDate.toISOString()
    } else {
      updateData.svipExpire = null
    }
  }
  // 如果设置 VIP，先关闭 SVIP 和 MVIP
  else if (isVip) {
    updateData.isSvip = 0
    updateData.isMvip = 0
    updateData.isVip = 1
    if (vipDays) {
      const expireDate = new Date(now)
      expireDate.setDate(expireDate.getDate() + parseInt(vipDays))
      updateData.vipExpire = expireDate.toISOString()
    } else {
      updateData.vipExpire = null
    }
  }
  // 如果都不是，全部关闭
  else {
    updateData.isVip = 0
    updateData.isSvip = 0
    updateData.isMvip = 0
    updateData.vipExpire = null
    updateData.svipExpire = null
    updateData.mvipExpire = null
  }

  await db.updateUser(targetId, updateData)
  return c.json({ success: true, message: 'VIP 状态已更新' })
})

// 获取人员列表（管理后台）
router.get('/profiles', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database

  // 获取所有人员，并关联查询点评数量
  const sql = `
    SELECT
      p.*,
      COUNT(pr.id) as reviewCount
    FROM profiles p
    LEFT JOIN profile_reviews pr ON p.id = pr.profileId
    GROUP BY p.id
    ORDER BY p.createdAt DESC
    LIMIT 200
  `
  const result = await c.env.DB.prepare(sql).all()

  // 转换数据格式，适配前端期望的 _count.reviews 结构
  const profiles = (result.results || []).map((p: any) => ({
    ...p,
    _count: { reviews: p.reviewCount || 0 }
  }))

  return c.json({ success: true, data: profiles })
})

// 获取人员点评记录
router.get('/profiles/:id/reviews', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const profileId = parseInt(c.req.param('id'))

  const reviews = await db.findProfileReviewsByProfileId(profileId, 100)
  return c.json({ success: true, data: reviews })
})

// 更新人员信息
router.post('/profiles/:id/update', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const profileId = parseInt(c.req.param('id'))
  const { name, campus, className, type, remark } = await c.req.json()

  const profile = await db.findProfileById(profileId)
  if (!profile) {
    return c.json({ success: false, message: '人员不存在' })
  }

  await db.updateProfile(profileId, {
    name: name || profile.name,
    campus: campus !== undefined ? campus : profile.campus,
    className: className !== undefined ? className : profile.className,
    type: type || profile.type,
    remark: remark !== undefined ? remark : profile.remark
  })

  return c.json({ success: true, message: '已更新' })
})

// 删除人员
router.post('/profiles/:id/delete', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const profileId = parseInt(c.req.param('id'))

  const profile = await db.findProfileById(profileId)
  if (!profile) {
    return c.json({ success: false, message: '人员不存在' })
  }

  // 先删除相关点评
  await c.env.DB.prepare('DELETE FROM profile_reviews WHERE profileId = ?').bind(profileId).run()
  await db.deleteProfile(profileId)

  return c.json({ success: true, message: '人员已删除' })
})

// 导出人员数据
router.get('/profiles/export', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database

  const result = await c.env.DB.prepare('SELECT * FROM profiles').all()
  return c.json({ success: true, data: result.results || [] })
})

// 获取商家列表（管理后台）
router.get('/merchants', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database

  // 获取所有商家，并关联查询点评数量
  const sql = `
    SELECT
      m.*,
      COUNT(mr.id) as reviewCount
    FROM merchants m
    LEFT JOIN merchant_reviews mr ON m.id = mr.merchantId
    GROUP BY m.id
    ORDER BY m.createdAt DESC
    LIMIT 200
  `
  const result = await c.env.DB.prepare(sql).all()

  // 转换数据格式，适配前端期望的 _count.reviews 结构
  const merchants = (result.results || []).map((m: any) => ({
    ...m,
    _count: { reviews: m.reviewCount || 0 }
  }))

  return c.json({ success: true, data: merchants })
})

// 获取商家点评记录
router.get('/merchants/:id/reviews', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const merchantId = parseInt(c.req.param('id'))

  const reviews = await db.findMerchantReviewsByMerchantId(merchantId, 100)
  return c.json({ success: true, data: reviews })
})

// 创建商家
router.post('/merchants', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const { name, category, address, phone } = await c.req.json()

  if (!name) {
    return c.json({ success: false, message: '商家名称必填' })
  }

  const created = await db.createMerchant(name, category || null, address || null, phone || null)
  return c.json({ success: true, data: created })
})

// 更新商家信息
router.post('/merchants/:id/update', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const merchantId = parseInt(c.req.param('id'))
  const { name, category, address, phone } = await c.req.json()

  const merchant = await db.findMerchantById(merchantId)
  if (!merchant) {
    return c.json({ success: false, message: '商家不存在' })
  }

  await db.updateMerchant(merchantId, {
    name: name || merchant.name,
    category: category !== undefined ? category : merchant.category,
    address: address !== undefined ? address : merchant.address,
    phone: phone !== undefined ? phone : merchant.phone
  })

  return c.json({ success: true, message: '已更新' })
})

// 删除商家
router.post('/merchants/:id/delete', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const merchantId = parseInt(c.req.param('id'))

  const merchant = await db.findMerchantById(merchantId)
  if (!merchant) {
    return c.json({ success: false, message: '商家不存在' })
  }

  // 先删除相关点评
  await c.env.DB.prepare('DELETE FROM merchant_reviews WHERE merchantId = ?').bind(merchantId).run()
  await db.deleteMerchant(merchantId)

  return c.json({ success: true, message: '商家已删除' })
})

export default router

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

// 获取商家列表
router.get('/', async (c) => {
  const db = c.get('db') as Database
  const merchants = await db.findMerchants(undefined, 50)
  return c.json({ success: true, data: merchants })
})

// 添加商家（需要登录）
router.post('/', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const { name, category, address, phone } = await c.req.json()

  if (!name) {
    return c.json({ success: false, message: '商家名称必填' })
  }

  const created = await db.createMerchant(name, category || null, address || null, phone || null)
  return c.json({ success: true, data: created })
})

// 获取商家点评
router.get('/:id/reviews', async (c) => {
  const db = c.get('db') as Database
  const merchantId = parseInt(c.req.param('id'))

  const reviews = await db.findMerchantReviewsByMerchantId(merchantId, 50)

  // 获取每个点评者的称号信息
  const reviewsWithTitles = await Promise.all(
    reviews.map(async (review) => {
      const reviewer = await db.findUserById(review.reviewerId)
      return {
        ...review,
        reviewerTitle: reviewer?.showTitle === 1 ? reviewer?.title : null
      }
    })
  )

  return c.json({ success: true, data: reviewsWithTitles })
})

// 检查次数限制
async function checkReviewLimits(
  db: Database,
  userId: number,
  merchantId: number,
  voteCount: number
): Promise<{ success: boolean; message?: string; todayReviewsForThisMerchant?: number }> {
  const user = await db.findUserById(userId)
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const startStr = start.toISOString()
  const endStr = end.toISOString()

  // 计算今日已消耗的总票数（每次点评都算 1 票）
  const todayReviews = await db.findMerchantReviewsTodayByReviewer(userId, startStr, endStr)
  let usedVotes = 0
  todayReviews.forEach((r) => {
    usedVotes += r.totalCount || 0
  })

  // 检查对该商家的今日点评次数（判断是否是大票）
  const todayReviewsForThisMerchant = await db.countMerchantReviewsByReviewerAndMerchant(
    userId,
    merchantId,
    startStr,
    endStr
  )

  // 用户等级判断
  const isAdmin = user?.email === 'admin@admin'
  const isSvip = !isAdmin && user?.isSvip === 1 && user.svipExpire && new Date(user.svipExpire) > now
  const isVip = !isSvip && !isAdmin && user?.isVip === 1 && user.vipExpire && new Date(user.vipExpire) > now
  const dailyLimit = isAdmin ? 999 : isSvip ? 10 : isVip ? 5 : 3

  if (usedVotes + voteCount > dailyLimit) {
    const remaining = Math.max(0, dailyLimit - usedVotes)
    return {
      success: false,
      message: isAdmin
        ? `今日票数不足，剩余${remaining}票（管理员每日 999 票）`
        : isSvip
        ? `今日票数不足，剩余${remaining}票（SVIP 每日 10 票）`
        : isVip
        ? `今日票数不足，剩余${remaining}票（VIP 每日 5 票）`
        : `今日票数不足，剩余${remaining}票（普通用户每日 3 票）`
    }
  }

  return { success: true, todayReviewsForThisMerchant }
}

// 添加商家点评
router.post('/:id/reviews', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')
  const merchantId = parseInt(c.req.param('id'))

  const { type, content, rating, count } = await c.req.json()
  const reviewCount = Math.min(Math.max(Number(count) || 1, 1), 10)

  if (!type) {
    return c.json({ success: false, message: '请选择点评类型' })
  }
  if (type !== 'red' && type !== 'black') {
    return c.json({ success: false, message: '类型必须为 red 或 black' })
  }

  const merchant = await db.findMerchantById(merchantId)
  if (!merchant) {
    return c.json({ success: false, message: '商家不存在' })
  }

  // 检查违禁词
  if (content && content.trim().length > 0) {
    const blockedWords = await db.findBlockedWords()
    const foundWords = blockedWords.filter((bw) => content.includes(bw.word))
    if (foundWords.length > 0) {
      return c.json({ success: false, message: '内容包含不当词汇，请修改后提交' })
    }
  }

  const limitCheck = await checkReviewLimits(db, userId, merchantId, reviewCount)
  if (!limitCheck.success) {
    return c.json({ success: false, message: limitCheck.message })
  }

  const isReviewerFirstToday = (limitCheck.todayReviewsForThisMerchant || 0) === 0

  // 计算票数
  // 规则：每天给某个商家的第一票是大票，后续追加的票都是小票
  let bigVotes = 0
  let smallVotes = reviewCount

  if (isReviewerFirstToday) {
    // 今天是第一次给这个商家投票
    if (reviewCount >= 1) {
      bigVotes = 1  // 第一票是大票
      smallVotes = reviewCount - 1  // 其余是小票
    }
  }
  // 如果不是第一次，所有票都是小票 (bigVotes=0, smallVotes=reviewCount)

  const created = await db.createMerchantReview(
    userId,
    merchantId,
    type,
    rating || null,
    content,
    true,
    reviewCount,
    bigVotes,
    smallVotes
  )

  return c.json({ success: true, data: [created], count: reviewCount, bigVotes, smallVotes })
})

// 举报商家点评
router.post('/:id/reviews/:reviewId/report', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')
  const reviewId = parseInt(c.req.param('reviewId'))

  const { reason } = await c.req.json()

  if (!reason || reason.trim().length === 0) {
    return c.json({ success: false, message: '举报原因不能为空' })
  }

  const review = await db.findMerchantReviewById(reviewId)
  if (!review) {
    return c.json({ success: false, message: '点评不存在' })
  }

  try {
    await db.createReport(reviewId, 'merchant', userId, reason.trim())
    return c.json({ success: true, message: '举报已提交' })
  } catch {
    return c.json({ success: false, message: '举报失败' })
  }
})

export default router

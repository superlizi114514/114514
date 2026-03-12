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

// 检查违禁词
async function checkBlockedWords(db: Database, content: string): Promise<{ hasBlocked: boolean; words: string[] }> {
  const blockedWords = await db.findBlockedWords()
  const foundWords = blockedWords.filter((bw) => content.includes(bw.word))
  return { hasBlocked: foundWords.length > 0, words: foundWords.map((bw) => bw.word) }
}

// 获取人员列表（按姓名分组，合并同名人员）
router.get('/', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  const allProfiles = await db.findProfilesByUserId(userId)

  // 按姓名分组，合并同名人员的信息
  const groupedByName = new Map<string, any>()
  allProfiles.forEach((profile) => {
    const existing = groupedByName.get(profile.name)
    if (!existing) {
      groupedByName.set(profile.name, {
        id: profile.id,
        ids: [profile.id],
        name: profile.name,
        campus: profile.campus,
        className: profile.className,
        allClassNames: profile.className ? [profile.className] : [],
        allCampuses: profile.campus ? [profile.campus] : [],
        reviewCount: 1
      })
    } else {
      if (profile.className && !existing.allClassNames.includes(profile.className)) {
        existing.allClassNames.push(profile.className)
      }
      if (profile.campus && !existing.allCampuses.includes(profile.campus)) {
        existing.allCampuses.push(profile.campus)
      }
      existing.ids.push(profile.id)
      existing.reviewCount = (existing.reviewCount || 0) + 1
    }
  })

  const result = Array.from(groupedByName.values()).map((item) => ({
    ...item,
    reviewCount: item.reviewCount || 1,
    classNameDisplay: item.allClassNames.length > 0 ? item.allClassNames.join(', ') : null,
    campusDisplay: item.allCampuses.length > 0 ? item.allCampuses.join(', ') : null
  }))

  return c.json({ success: true, data: result })
})

// 按 ID 获取单个人员
router.get('/:id', async (c) => {
  const db = c.get('db') as Database
  const profileId = parseInt(c.req.param('id'))

  const profile = await db.findProfileById(profileId)
  if (!profile) {
    return c.json({ success: false, message: '人员不存在' }, 404)
  }

  return c.json({ success: true, data: profile })
})

// 搜索人员（按姓名查找）
router.get('/search/by-name', async (c) => {
  const db = c.get('db') as Database
  const name = c.req.query('name')

  if (!name) {
    return c.json({ success: false, message: '姓名参数必填' })
  }

  const profiles = await db.findProfilesByName(name)

  const allClassNames = new Set<string>()
  const allCampuses = new Set<string>()
  const ids: number[] = []
  profiles.forEach((p) => {
    if (p.className) allClassNames.add(p.className)
    if (p.campus) allCampuses.add(p.campus)
    ids.push(p.id)
  })

  return c.json({
    success: true,
    data: {
      name,
      count: profiles.length,
      ids,
      allClassNames: Array.from(allClassNames),
      allCampuses: Array.from(allCampuses),
      profiles
    }
  })
})

// 添加人员
router.post('/', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  const { name, campus, className, isPublic, type, remark } = await c.req.json()

  if (!name) {
    return c.json({ success: false, message: '姓名必填' })
  }

  // 验证班级格式：允许 xx 级 xx 系 或 xx 级 xxx 系 等格式
  if (className && className.trim()) {
    const trimmedClass = className.trim()
    // 基本验证：数字 + 级 + 中文 + 系
    // \u7ea7 = 级，\u7cfb = 系
    const classPattern = /^\d{2,4}\u7ea7[\u4e00-\u9fa5]{2,4}\u7cfb$/u
    if (!classPattern.test(trimmedClass)) {
      return c.json({
        success: false,
        message: '班级格式不正确，请填写 xx 级 xx 系（如：25 级电子系）'
      })
    }
  }

  // 检查是否已存在完全相同的人员（姓名 + 校区 + 班级都相同）
  const existingProfiles = await db.findProfilesByName(name)
  const duplicate = existingProfiles.find(
    (p) => p.campus === (campus || null) && p.className === (className ? className.trim() : null)
  )
  if (duplicate) {
    return c.json({
      success: false,
      message: '该人员已存在，请直接添加点评'
    })
  }

  const created = await db.createProfile(
    userId,
    name,
    campus || null,
    className ? className.trim() : null,
    isPublic !== false,
    type || 'red',
    remark || null
  )

  return c.json({ success: true, data: created })
})

// 获取人员点评列表
router.get('/:id/reviews', async (c) => {
  const db = c.get('db') as Database
  const profileId = parseInt(c.req.param('id'))

  const reviews = await db.findProfileReviewsByProfileId(profileId, 50)

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

// 检查每日点评次数限制
async function checkReviewLimits(
  db: Database,
  userId: number,
  profileId: number,
  voteCount: number
): Promise<{ success: boolean; message?: string; todayReviewsForThisProfile?: number }> {
  const user = await db.findUserById(userId)
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const startStr = start.toISOString()
  const endStr = end.toISOString()

  // 计算今日已消耗的总票数（每次点评都算 1 票）
  const todayReviews = await db.findProfileReviewsTodayByReviewer(userId, startStr, endStr)
  let usedVotes = 0
  todayReviews.forEach((r) => {
    usedVotes += r.totalCount || 0
  })

  // 检查对该人员的今日点评次数（判断是否是大票）
  const todayReviewsForThisProfile = await db.countProfileReviewsByReviewerAndProfile(
    userId,
    profileId,
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

  return { success: true, todayReviewsForThisProfile }
}

// 添加人员点评
router.post('/:id/reviews', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')
  const profileId = parseInt(c.req.param('id'))

  const { type, content, count } = await c.req.json()
  const reviewCount = Math.min(Math.max(Number(count) || 1, 1), 10)

  if (!type) {
    return c.json({ success: false, message: '请选择点评类型' })
  }
  if (type !== 'red' && type !== 'black') {
    return c.json({ success: false, message: '类型必须为 red 或 black' })
  }

  const profile = await db.findProfileById(profileId)
  if (!profile) {
    return c.json({ success: false, message: '人员不存在' })
  }

  // 检查违禁词
  if (content && content.trim().length > 0) {
    const blockCheck = await checkBlockedWords(db, content)
    if (blockCheck.hasBlocked) {
      return c.json({ success: false, message: '内容包含不当词汇，请修改后提交' })
    }
  }

  // 检查次数限制
  const limitCheck = await checkReviewLimits(db, userId, profileId, reviewCount)
  if (!limitCheck.success) {
    return c.json({ success: false, message: limitCheck.message })
  }

  const isReviewerFirstToday = (limitCheck.todayReviewsForThisProfile || 0) === 0

  // 计算票数
  // 规则：每天给某个人的第一票是大票，后续追加的票都是小票
  let bigVotes = 0
  let smallVotes = reviewCount

  if (isReviewerFirstToday) {
    // 今天是第一次给这个人投票
    if (reviewCount >= 1) {
      bigVotes = 1  // 第一票是大票
      smallVotes = reviewCount - 1  // 其余是小票
    }
  }
  // 如果不是第一次，所有票都是小票 (bigVotes=0, smallVotes=reviewCount)

  const created = await db.createProfileReview(userId, profileId, type, content, true, reviewCount, bigVotes, smallVotes)

  return c.json({ success: true, data: [created], count: reviewCount, bigVotes, smallVotes })
})

// 举报人员点评
router.post('/:id/reviews/:reviewId/report', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')
  const reviewId = parseInt(c.req.param('reviewId'))

  const { reason } = await c.req.json()

  if (!reason || reason.trim().length === 0) {
    return c.json({ success: false, message: '举报原因不能为空' })
  }

  const review = await db.findProfileReviewById(reviewId)
  if (!review) {
    return c.json({ success: false, message: '点评不存在' })
  }

  try {
    await db.createReport(reviewId, 'profile', userId, reason.trim())
    return c.json({ success: true, message: '举报已提交' })
  } catch {
    return c.json({ success: false, message: '举报失败' })
  }
})

export default router

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

// 举报人员点评
router.post('/profile', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  const { reviewId, reason } = await c.req.json()

  if (!reviewId || !reason) {
    return c.json({ success: false, message: '参数不完整' })
  }

  const review = await db.findProfileReviewById(Number(reviewId))
  if (!review) {
    return c.json({ success: false, message: '点评不存在' })
  }

  await db.createReport(Number(reviewId), 'profile', userId, String(reason))
  return c.json({ success: true, data: { id: reviewId } })
})

// 举报商家点评
router.post('/merchant', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  const { reviewId, reason } = await c.req.json()

  if (!reviewId || !reason) {
    return c.json({ success: false, message: '参数不完整' })
  }

  const review = await db.findMerchantReviewById(Number(reviewId))
  if (!review) {
    return c.json({ success: false, message: '点评不存在' })
  }

  await db.createReport(Number(reviewId), 'merchant', userId, String(reason))
  return c.json({ success: true, data: { id: reviewId } })
})

export default router

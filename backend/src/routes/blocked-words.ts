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

// 获取违禁词列表（公开）
router.get('/', async (c) => {
  const db = c.get('db') as Database
  const words = await db.findBlockedWords()
  return c.json({ success: true, words })
})

// 获取所有违禁词（包括已禁用的，仅管理员）
router.get('/all', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  // 直接查询所有
  const result = await c.env.DB.prepare('SELECT * FROM blocked_words ORDER BY createdAt DESC').all()
  return c.json({ success: true, words: result.results || [] })
})

// 添加违禁词（仅管理员）
router.post('/', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const { word, category = 'insult' } = await c.req.json()

  if (!word || word.trim().length === 0) {
    return c.json({ success: false, message: '违禁词不能为空' })
  }

  await db.addBlockedWord(word.trim(), category)
  return c.json({ success: true, message: '添加成功' })
})

// 删除违禁词（仅管理员）- 改为禁用
router.delete('/:id', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const id = parseInt(c.req.param('id'))

  await db.removeBlockedWord(id)
  return c.json({ success: true, message: '删除成功' })
})

// 恢复违禁词（仅管理员）
router.post('/:word/restore', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const word = decodeURIComponent(c.req.param('word'))

  await db.deactivateBlockedWord(word)
  return c.json({ success: true, message: '已恢复' })
})

export default router

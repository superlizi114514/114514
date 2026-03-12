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

// 获取违禁词列表
router.get('/', async (c) => {
  const db = c.get('db') as Database
  const words = await db.findBlockedWords()
  return c.json({ success: true, words })
})

// 设置用户称号
router.post('/set-title', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')
  const { title } = await c.req.json()

  const user = await db.findUserById(userId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' })
  }

  // 空称号则删除，否则更新
  await db.updateUserTitle(userId, title || null)
  return c.json({ success: true, message: '称号已更新' })
})

// 切换称号显示状态
router.post('/toggle-title-display', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')
  const { showTitle } = await c.req.json()

  const user = await db.findUserById(userId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' })
  }

  await db.toggleUserTitleVisibility(userId, showTitle ? 1 : 0)
  return c.json({ success: true, message: '称号显示状态已更新' })
})

// 获取可用称号列表（权限组称号 + 自定义称号 + 可选通用称号）
router.get('/available-titles', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  const user = await db.findUserById(userId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' })
  }

  const titles: string[] = []
  const now = new Date()

  // 权限组称号（根据用户等级自动获得）
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

  // 通用称号（所有用户可用）
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

  // 将通用称号添加到列表
  commonTitles.forEach(t => {
    if (!titles.includes(t)) {
      titles.push(t)
    }
  })

  // 自定义称号（如果有）
  if (user.title) {
    titles.push(user.title)
  }

  return c.json({ success: true, titles, currentTitle: user.title || null, showTitle: user.showTitle === 1 })
})

// 更新昵称
router.post('/nickname', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')
  const { nickname } = await c.req.json()

  if (!nickname || nickname.trim().length === 0) {
    return c.json({ success: false, message: '昵称不能为空' })
  }

  if (nickname.length > 20) {
    return c.json({ success: false, message: '昵称最多 20 个字符' })
  }

  const user = await db.findUserById(userId)
  if (!user) {
    return c.json({ success: false, message: '用户不存在' })
  }

  await db.updateUserNickname(userId, nickname.trim())
  return c.json({ success: true, message: '昵称已更新' })
})

export default router

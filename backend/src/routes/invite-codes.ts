import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import type { Database } from '../db-vercel.js'

// 简单的密码哈希（与 auth.ts 保持一致）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await (crypto as any).subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

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

// 生成邀请码（仅管理员）
router.post('/generate', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  const generateCode = () => {
    const chars = '0123456789abcdef'
    let part1 = ''
    let part2 = ''
    for (let i = 0; i < 5; i++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length))
      part2 += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `${part1}@${part2}`
  }

  const code = generateCode()
  await db.createInviteCode(code, userId)

  return c.json({ success: true, code })
})

// 获取邀请码列表（仅管理员）
router.get('/list', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  const list = await db.findInviteCodesByCreator(userId)
  return c.json({ success: true, list })
})

// 验证邀请码（公开）
router.post('/verify', async (c) => {
  const db = c.get('db') as Database
  const { code } = await c.req.json()

  if (!code) {
    return c.json({ success: false, message: '邀请码不能为空' })
  }

  const inviteCode = await db.findInviteCode(code)
  if (!inviteCode) {
    return c.json({ success: false, message: '邀请码不存在' })
  }

  if (inviteCode.isActive === 0 || inviteCode.usedBy) {
    return c.json({ success: false, message: '邀请码已禁用或已被使用' })
  }

  // 获取创建者信息
  const creator = await db.findUserById(inviteCode.createdBy)
  return c.json({
    success: true,
    creatorName: creator?.email || '管理员',
    creatorId: creator?.id
  })
})

// 使用邀请码登录/注册
router.post('/use', async (c) => {
  const db = c.get('db') as Database
  const { code, password } = await c.req.json()

  if (!code) {
    return c.json({ success: false, message: '邀请码不能为空' })
  }

  if (!password || password.length < 6 || password.length > 20) {
    return c.json({ success: false, message: '密码 6-20 位' })
  }

  const inviteCode = await db.findInviteCode(code)
  if (!inviteCode || inviteCode.isActive === 0 || inviteCode.usedBy) {
    return c.json({ success: false, message: '邀请码无效或已被使用' })
  }

  const tempEmail = `${code}@invite`

  // 检查是否已存在
  const existingUser = await db.findUserByEmail(tempEmail)
  if (existingUser) {
    // 已存在，验证密码
    const inputHash = await hashPassword(password)
    if (inputHash !== existingUser.passwordHash) {
      return c.json({ success: false, message: '密码错误' })
    }
  }

  // 创建用户（密码哈希）
  const passwordHash = await hashPassword(password)

  // 创建用户
  const userResult = await c.env.DB.prepare(
    'INSERT INTO users (email, passwordHash) VALUES (?, ?) RETURNING *'
  ).bind(tempEmail, passwordHash).first()

  const user = userResult as any

  // 标记邀请码为已使用
  await db.useInviteCode(code, user.id)

  // 生成 token
  const { SignJWT } = await import('jose')
  const secret = new TextEncoder().encode(c.env.JWT_SECRET)
  const token = await new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)

  return c.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email
    }
  })
})

export default router

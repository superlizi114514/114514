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

// 管理员验证中间件
async function isAdminMiddleware(c: any, next: any) {
  await authMiddleware(c, next)
  const email = c.get('email')
  if (email !== 'admin@admin') {
    return c.json({ success: false, message: '无权限' }, 403)
  }
}

// 获取兼职列表（公开）支持搜索和性别筛选
router.get('/list', async (c) => {
  const db = c.get('db') as Database
  const keyword = c.req.query('keyword') || ''
  const gender = c.req.query('gender') || ''

  const jobs = await db.findPartTimeJobs(true, keyword || undefined, gender || undefined)
  return c.json({ success: true, jobs })
})

// 管理员获取所有兼职（包含已下架）
router.get('/admin/list', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database

  const jobs = await db.findPartTimeJobs(false)
  return c.json({ success: true, jobs })
})

// 管理员创建兼职
router.post('/admin/create', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database

  const { name, gender, type, description, priceList, contact, expireAt } = await c.req.json()

  if (!name || !contact) {
    return c.json({ success: false, message: '名称和联系方式必填' })
  }

  const job = await db.createPartTimeJob({
    name,
    gender: gender || '不限',
    type,
    description: description || null,
    priceList: priceList || null,
    contact,
    expireAt: expireAt || null
  })

  return c.json({ success: true, data: job })
})

// 管理员更新兼职
router.post('/admin/update', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database

  const { id, name, gender, type, description, priceList, contact, expireAt, isActive } = await c.req.json()

  if (!id) {
    return c.json({ success: false, message: '兼职 ID 必填' })
  }

  const job = await db.findPartTimeJobById(id)
  if (!job) {
    return c.json({ success: false, message: '兼职不存在' })
  }

  await db.updatePartTimeJob(id, {
    name: name || job.name,
    gender: gender !== undefined ? gender : job.gender,
    type: type || job.type,
    description: description !== undefined ? description : job.description,
    priceList: priceList !== undefined ? priceList : job.priceList,
    contact: contact || job.contact,
    expireAt: expireAt !== undefined ? expireAt : job.expireAt,
    isActive: isActive !== undefined ? (isActive ? 1 : 0) : job.isActive
  })

  return c.json({ success: true, message: '已更新' })
})

// 管理员删除兼职
router.post('/admin/delete', isAdminMiddleware, async (c) => {
  const db = c.get('db') as Database

  const { id } = await c.req.json()

  if (!id) {
    return c.json({ success: false, message: '兼职 ID 必填' })
  }

  await db.deletePartTimeJob(id)

  return c.json({ success: true, message: '已删除' })
})

export default router

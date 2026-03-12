import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/vercel'
import { createDb } from '../src/db-vercel.js'
import type { Database } from '../src/db-vercel.js'

// 导入路由
import authRouter from '../src/routes/auth.js'
import profilesRouter from '../src/routes/profiles.js'
import rankingsRouter from '../src/routes/rankings.js'
import searchRouter from '../src/routes/search.js'
import reportsRouter from '../src/routes/reports.js'
import adminRouter from '../src/routes/admin.js'
import merchantsRouter from '../src/routes/merchants.js'
import supportRouter from '../src/routes/support.js'
import settingsRouter from '../src/routes/settings.js'
import blockedWordsRouter from '../src/routes/blocked-words.js'
import inviteCodesRouter from '../src/routes/invite-codes.js'
import partTimeJobsRouter from '../src/routes/partTimeJobs.js'

export type AppEnv = {
  Variables: {
    userId: number
    email: string
    db: Database
  }
}

const app = new Hono<AppEnv>()

// CORS 中间件
app.use('*', cors())

// 日志中间件
app.use('*', async (c, next) => {
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.path}`)
  await next()
})

// 健康检查
app.get('/health', (c) => c.json({ ok: true, timestamp: new Date().toISOString() }))

// 首页
app.get('/', (c) => {
  return c.json({
    message: '山信黑红榜 API 服务',
    version: '1.0.0 (Vercel)',
    endpoints: {
      auth: '/api/auth',
      profiles: '/api/profiles',
      merchants: '/api/merchants',
      rankings: '/api/rankings',
      search: '/api/search',
      reports: '/api/reports',
      admin: '/api/admin',
      support: '/api/support',
      settings: '/api/settings',
      'part-time-jobs': '/api/part-time-jobs'
    }
  })
})

// 数据库初始化中间件
app.use('*', async (c, next) => {
  try {
    const db = createDb()
    c.set('db', db)
    await next()
  } catch (error: any) {
    console.error('Database connection error:', error.message)
    return c.json({ success: false, message: 'Database connection error: ' + error.message }, 500)
  }
})

// 注册路由
app.route('/api/auth', authRouter)
app.route('/api/profiles', profilesRouter)
app.route('/api/rankings', rankingsRouter)
app.route('/api/search', searchRouter)
app.route('/api/reports', reportsRouter)
app.route('/api/admin', adminRouter)
app.route('/api/merchants', merchantsRouter)
app.route('/api/support', supportRouter)
app.route('/api/settings', settingsRouter)
app.route('/api/blocked-words', blockedWordsRouter)
app.route('/api/invite-codes', inviteCodesRouter)
app.route('/api/part-time-jobs', partTimeJobsRouter)

// 404 处理
app.notFound((c) => {
  return c.json({ success: false, message: 'Not Found' }, 404)
})

// 错误处理
app.onError((err, c) => {
  console.error('Error:', err)
  console.error('Error stack:', err.stack)
  return c.json({ success: false, message: 'Internal Server Error: ' + err.message }, 500)
})

// 导出 Vercel Serverless Function handlers
export default app

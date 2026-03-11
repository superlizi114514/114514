import { Hono } from 'hono'
import type { AppEnv } from '../worker.js'
import type { Database } from '../db.js'

const router = new Hono<AppEnv>()

// GET /api/rankings/total - 总黑红榜
router.get('/total', async (c) => {
  const db = c.get('db') as Database
  const timeRange = c.req.query('timeRange') || 'all'

  try {
    const redProfiles = await db.getProfileRankings('red', 20, timeRange as any)
    const blackProfiles = await db.getProfileRankings('black', 20, timeRange as any)
    const redMerchants = await db.getMerchantRankings('red', 20)
    const blackMerchants = await db.getMerchantRankings('black', 20)

    return c.json({
      success: true,
      rankings: {
        red: { profiles: redProfiles, merchants: redMerchants },
        black: { profiles: blackProfiles, merchants: blackMerchants }
      }
    })
  } catch (e) {
    console.error('Rankings error:', e)
    return c.json({ success: false, message: '获取榜单失败' }, 500)
  }
})

// GET /api/rankings/profile - 个人黑红榜
router.get('/profile', async (c) => {
  const db = c.get('db') as Database
  const type = c.req.query('type') || 'red'
  const timeRange = c.req.query('timeRange') || 'all'

  try {
    const profiles = await db.getProfileRankings(type, 50, timeRange as any)
    return c.json({ success: true, profiles })
  } catch (e) {
    console.error('Profile rankings error:', e)
    return c.json({ success: false, message: '获取失败' }, 500)
  }
})

// GET /api/rankings/merchant - 商家黑红榜
router.get('/merchant', async (c) => {
  const db = c.get('db') as Database
  const type = c.req.query('type') || 'red'

  try {
    const merchants = await db.getMerchantRankings(type, 50)
    return c.json({ success: true, merchants })
  } catch (e) {
    console.error('Merchant rankings error:', e)
    return c.json({ success: false, message: '获取失败' }, 500)
  }
})

export default router

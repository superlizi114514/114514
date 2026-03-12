import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import type { Database } from '../db-vercel.js'

const router = new Hono<AppEnv>()

// GET /api/search - 搜索
router.get('/', async (c) => {
  const db = c.get('db') as Database
  const q = c.req.query('q') || ''
  const type = c.req.query('type') || ''
  const sort = c.req.query('sort') || 'latest'

  if (!q) {
    return c.json({ success: true, data: { profiles: [], merchants: [] } })
  }

  // 搜索人员
  const profilesResult = await db.findProfilesByName(q)

  // 搜索商家
  const merchants = await db.findMerchants(q, 50)

  // 获取人员的点评数据
  const profileVotesMap = new Map<number, { bigVotes: number; smallVotes: number; reviewCount: number }>()

  for (const profile of profilesResult) {
    const reviews = await db.findProfileReviewsByProfileId(profile.id, 100)
    let totalBigVotes = 0
    let totalSmallVotes = 0
    reviews.forEach((r) => {
      totalBigVotes += r.bigVotes || 0
      totalSmallVotes += r.smallVotes || 0
    })
    profileVotesMap.set(profile.id, {
      bigVotes: totalBigVotes,
      smallVotes: totalSmallVotes,
      reviewCount: reviews.length
    })
  }

  // 获取商家的点评数据
  const merchantVotesMap = new Map<number, { bigVotes: number; smallVotes: number; reviewCount: number }>()

  for (const merchant of merchants) {
    const reviews = await db.findMerchantReviewsByMerchantId(merchant.id, 100)
    let totalBigVotes = 0
    let totalSmallVotes = 0
    reviews.forEach((r) => {
      totalBigVotes += r.bigVotes || 0
      totalSmallVotes += r.smallVotes || 0
    })
    merchantVotesMap.set(merchant.id, {
      bigVotes: totalBigVotes,
      smallVotes: totalSmallVotes,
      reviewCount: reviews.length
    })
  }

  const profilesWithVotes = profilesResult.map((p) => ({
    ...p,
    totalBigVotes: profileVotesMap.get(p.id)?.bigVotes || 0,
    totalSmallVotes: profileVotesMap.get(p.id)?.smallVotes || 0,
    reviewCount: profileVotesMap.get(p.id)?.reviewCount || 0
  }))

  const merchantsWithVotes = merchants.map((m) => ({
    ...m,
    totalBigVotes: merchantVotesMap.get(m.id)?.bigVotes || 0,
    totalSmallVotes: merchantVotesMap.get(m.id)?.smallVotes || 0,
    reviewCount: merchantVotesMap.get(m.id)?.reviewCount || 0
  }))

  // 按姓名 + 班级分组，合并同名同班人员
  const groupedByKey = new Map<string, any>()
  const profileIdMap = new Map<string, number[]>()

  profilesWithVotes.forEach((profile) => {
    // 使用 name + className 作为分组键，同名同班级的人会被合并
    const classKey = profile.className || ''
    const groupKey = `${profile.name}|${classKey}`

    const existing = groupedByKey.get(groupKey)
    if (!existing) {
      groupedByKey.set(groupKey, {
        id: profile.id,
        name: profile.name,
        campus: profile.campus,
        className: profile.className,
        allClassNames: profile.className ? [profile.className] : [],
        allCampuses: profile.campus ? [profile.campus] : [],
        totalBigVotes: profile.totalBigVotes || 0,
        totalSmallVotes: profile.totalSmallVotes || 0,
        reviewCount: 0
      })
      profileIdMap.set(groupKey, [profile.id])
    } else {
      if (profile.className && !existing.allClassNames.includes(profile.className)) {
        existing.allClassNames.push(profile.className)
      }
      if (profile.campus && !existing.allCampuses.includes(profile.campus)) {
        existing.allCampuses.push(profile.campus)
      }
      existing.totalBigVotes += profile.totalBigVotes || 0
      existing.totalSmallVotes += profile.totalSmallVotes || 0
      const ids = profileIdMap.get(groupKey) || []
      ids.push(profile.id)
      profileIdMap.set(groupKey, ids)
    }
  })

  const groupedProfiles = Array.from(groupedByKey.values()).map((item) => {
    const ids = profileIdMap.get(item.name + '|' + (item.className || '')) || [item.id]
    return {
      ...item,
      ids,
      classNameDisplay: item.allClassNames.length > 0 ? item.allClassNames.join(', ') : null,
      campusDisplay: item.allCampuses.length > 0 ? item.allCampuses.join(', ') : null
    }
  })

  return c.json({ success: true, data: { profiles: groupedProfiles, merchants: merchantsWithVotes } })
})

export default router

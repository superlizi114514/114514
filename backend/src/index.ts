import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRouter from './routes/auth.js'
import profilesRouter from './routes/profiles.js'
import rankingsRouter from './routes/rankings.js'
import searchRouter from './routes/search.js'
import reportsRouter from './routes/reports.js'
import adminRouter from './routes/admin.js'
import merchantsRouter from './routes/merchants.js'
import supportRouter from './routes/support.js'
import settingsRouter from './routes/settings.js'
import blockedWordsRouter from './routes/blocked-words.js'
import inviteCodesRouter from './routes/invite-codes.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.get('/', (req, res) => {
  res.json({
    message: '山信黑红榜 API 服务',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      profiles: '/api/profiles',
      merchants: '/api/merchants',
      rankings: '/api/rankings',
      search: '/api/search',
      reports: '/api/reports',
      admin: '/api/admin',
      support: '/api/support',
      settings: '/api/settings'
    }
  })
})

app.use('/api/auth', authRouter)
app.use('/api/profiles', profilesRouter)
app.use('/api/rankings', rankingsRouter)
app.use('/api/search', searchRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/admin', adminRouter)
app.use('/api/merchants', merchantsRouter)
app.use('/api/support', supportRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/blocked-words', blockedWordsRouter)
app.use('/api/invite-codes', inviteCodesRouter)

const port = process.env.PORT ? Number(process.env.PORT) : 3000
app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`)
})

import type { Database } from './db-vercel.js'

export type AppEnv = {
  Variables: {
    userId: number
    email: string
    db: Database
  }
}

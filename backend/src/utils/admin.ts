import { Request } from 'express'

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token'

export function isAdminRequest(req: Request): boolean {
  const token = req.headers['x-admin-token']
  return token === ADMIN_TOKEN
}

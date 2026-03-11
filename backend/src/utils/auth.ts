import { Request } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../prisma.js'

export function getUserIdFromRequest(req: Request): number | null {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null

  try {
    const jwtSecret = process.env.JWT_SECRET || 'change-me'
    const payload = jwt.verify(token, jwtSecret) as { userId?: number }
    return payload.userId ?? null
  } catch {
    return null
  }
}

// 检查是否为管理员（admin@admin.admin 永远拥有管理员权限）
export async function isAdmin(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return false
  // admin@admin.admin 邮箱永远拥有管理员权限
  if (user.email === 'admin@admin.admin') return true
  return false
}

// 同步版本（用于已知用户邮箱的场景）
export function isAdminSync(email: string): boolean {
  return email === 'admin@admin.admin'
}

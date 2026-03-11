import prisma from '../src/db.js'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function setAdminPassword() {
  const adminEmail = 'admin@admin'
  const password = 'lzlz58205820'
  const passwordHash = hashPassword(password)

  try {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash, isVip: true },
      create: {
        email: adminEmail,
        passwordHash,
        isVip: true
      }
    })
    console.log(`admin 账户密码已设置为：${password}`)
    console.log('admin 账户拥有永久 VIP 权限和管理员权限')
  } catch (error: any) {
    console.error('设置密码失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setAdminPassword()

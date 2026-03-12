import { Hono } from 'hono'
import { SignJWT, jwtVerify } from 'jose'
import type { AppEnv } from '../types.js'
import type { Database } from '../db-vercel.js'

const router = new Hono<AppEnv>()

// 简单的密码哈希
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await (crypto as any).subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateCode(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
}

// 发送邮件函数（支持 Resend/SendGrid/腾讯云）
async function sendEmailVerification(to: string, code: string) {
  console.log('[SendEmail] Starting:', { to, code, hasResendKey: !!process.env.RESEND_API_KEY })

  // 方案 1: Resend (推荐) - 每月 3000 封免费
  if (process.env.RESEND_API_KEY) {
    try {
      console.log('[SendEmail] Using Resend')
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
          to: [to],
          subject: '【山信黑红榜】登录验证码',
          html: `
            <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
              <h2>山信黑红榜</h2>
              <p>您的登录验证码是：</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">
                ${code}
              </div>
              <p>验证码 10 分钟内有效</p>
              <p>如非本人操作，请忽略此邮件</p>
              <hr/>
              <p style="color: #999; font-size: 12px;">山信黑红榜 敬上</p>
            </div>
          `
        })
      })
      const result = await response.json()
      console.log('[SendEmail] Resend response:', result)
      if (response.ok) {
        return true
      } else {
        console.error('[SendEmail] Resend error:', result)
      }
    } catch (e) {
      console.error('[SendEmail] Resend exception:', e)
    }
  }

  // 方案 2: SendGrid - 每天 100 封免费
  if (env.SENDGRID_API_KEY) {
    try {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com', name: '山信黑红榜' },
          subject: '【山信黑红榜】登录验证码',
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
                <h2>山信黑红榜</h2>
                <p>您的登录验证码是：</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">
                  ${code}
                </div>
                <p>验证码 10 分钟内有效</p>
                <p>如非本人操作，请忽略此邮件</p>
                <hr/>
                <p style="color: #999; font-size: 12px;">山信黑红榜 敬上</p>
              </div>
            `
          }]
        })
      })
      return true
    } catch (e) {
      console.error('SendGrid 邮件发送失败:', e)
    }
  }

  // 方案 3: 腾讯云邮件推送 - 每天 200 封免费
  if (env.TENCENT_SECRET_ID && env.TENCENT_SECRET_KEY) {
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const params: any = {
        Action: 'SendEmail',
        Version: '2018-03-01',
        Region: 'ap-guangzhou',
        FromAddress: env.TENCENT_FROM_EMAIL || 'noreply@yourdomain.com',
        ToAddresses: [to],
        Subject: '【山信黑红榜】登录验证码',
        Content: `
          <div style="font-family: Arial;">
            <h2>山信黑红榜</h2>
            <p>您的登录验证码是：</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">
              ${code}
            </div>
            <p>验证码 10 分钟内有效</p>
            <p>如非本人操作，请忽略此邮件</p>
          </div>
        `,
        Timestamp: timestamp,
        Nonce: Math.floor(Math.random() * 100000),
        SecretId: env.TENCENT_SECRET_ID
      }

      // 生成签名（HMAC-SHA256）
      const signStr = await signTencentRequest(params, env.TENCENT_SECRET_KEY)
      params.Signature = signStr

      await fetch('https://dm.tencentcloudapi.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      return true
    } catch (e) {
      console.error('腾讯云邮件发送失败:', e)
    }
  }

  // 如果未配置邮件服务，记录日志（生产环境应抛出错误）
  console.log(`[邮件发送] 收件人：${to}, 验证码：${code}`)
  return false
}

// 腾讯云 API 签名函数
async function signTencentRequest(params: any, secretKey: string): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')

  const signStr = `POSTdm.tencentcloudapi.com/?${sortedParams}`

  const encoder = new TextEncoder()
  const data = encoder.encode(signStr)
  const key = encoder.encode(secretKey)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
  const hashArray = new Uint8Array(signature)
  return btoa(String.fromCharCode(...Array.from(hashArray)))
}

function generateCaptchaText(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function makeSvg(text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40">
<rect width="120" height="40" fill="#f3f3f3"/>
<text x="60" y="26" text-anchor="middle" font-size="20" fill="#333">${text}</text>
</svg>`
  // 在 Node.js 环境使用 Buffer 进行 base64 编码
  const base64 = typeof Buffer !== 'undefined'
    ? Buffer.from(svg).toString('base64')
    : btoa(svg)
  return `data:image/svg+xml;base64,${base64}`
}

// 获取图形验证码
router.get('/captcha', async (c) => {
  const db = c.get('db') as Database

  // 在 Node.js 和浏览器环境中都兼容
  const randomUUID = typeof crypto.randomUUID !== 'undefined'
    ? crypto.randomUUID()
    : require('crypto').randomUUID()
  const sessionId = randomUUID
  const text = generateCaptchaText()
  const expireAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  try {
    // 保存到数据库
    await db.createCaptchaCode(sessionId, text, expireAt)
    return c.json({ success: true, sessionId, image: makeSvg(text) })
  } catch (e: any) {
    console.error('Captcha error:', e?.message || e)
    return c.json({ success: false, message: '验证码生成失败：' + (e?.message || 'unknown error') }, 500)
  }
})

// 发送邮箱验证码
router.post('/send-email-code', async (c) => {
  const db = c.get('db') as Database

  try {
    const { email, captchaCode, captchaSession } = await c.req.json()
    console.log('[SendEmailCode] Request:', { email, captchaCode, captchaSession })

    if (!email || !captchaCode || !captchaSession) {
      return c.json({ success: false, message: '参数不完整' })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // 允许特殊邮箱格式：admin@admin、邀请码邮箱（@invite 后缀）
    const isAdminEmail = email === 'admin@admin'
    const isInviteEmail = email.endsWith('@invite')
    if (!emailRegex.test(email) && !isAdminEmail && !isInviteEmail) {
      return c.json({ success: false, message: '邮箱格式不正确' })
    }

    const captcha = await db.findCaptchaCode(captchaSession)
    console.log('[SendEmailCode] Captcha from DB:', captcha)

    if (!captcha) {
      return c.json({ success: false, message: '图形验证码不存在，请刷新' })
    }
    if (captcha.isUsed === 1) {
      return c.json({ success: false, message: '图形验证码已使用，请刷新' })
    }
    if (new Date(captcha.expireAt) < new Date()) {
      return c.json({ success: false, message: '图形验证码已过期，请刷新' })
    }

    if (captcha.code !== String(captchaCode).toUpperCase()) {
      console.log('[SendEmailCode] Code mismatch:', { stored: captcha.code, input: String(captchaCode).toUpperCase() })
      return c.json({ success: false, message: '图形验证码错误，请重新输入' })
    }

    // 标记图形验证码已使用
    await db.markCaptchaCodeUsed(captchaSession)

    // 检查发送频率（同一邮箱每日最多 3 次）
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const todayStart = today.toISOString()
    const todayEnd = tomorrow.toISOString()

    const todayCount = await db.findEmailCodesCountToday(email, todayStart, todayEnd)
    if (todayCount >= 3) {
      return c.json({
        success: false,
        message: '今日发送次数已达上限，请明日再试'
      })
    }

    // 生成 6 位邮箱验证码
    const code = generateCode(6)
    const expireAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await db.createEmailCode(email, code, expireAt)
    console.log('[SendEmailCode] Code generated:', { email, code })

    // 检查环境变量
    console.log('[SendEmailCode] Env check:', {
      hasResend: !!process.env.RESEND_API_KEY,
      hasSendgrid: !!process.env.SENDGRID_API_KEY,
      hasTencent: !!(process.env.TENCENT_SECRET_ID && process.env.TENCENT_SECRET_KEY)
    })

    // 发送邮件
    const sent = await sendEmailVerification(email, code)
    console.log('[SendEmailCode] Send result:', sent)

    return c.json({
      success: true,
      message: sent ? '验证码已发送，请检查邮箱' : '验证码已生成（邮件服务未配置，查看控制台）'
    })
  } catch (e) {
    console.error('[SendEmailCode] Error:', e)
    return c.json({ success: false, message: '发送失败' }, 500)
  }
})

// 登录
router.post('/login', async (c) => {
  const db = c.get('db') as Database
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'

  try {
    const { email, code, password } = await c.req.json()
    console.log('[Login] Request:', { email, hasCode: !!code, hasPassword: !!password, ip })

    if (!email) {
      return c.json({ success: false, message: '请输入邮箱' })
    }

    // 检查 IP 登录失败次数（防暴力破解）
    try {
      const loginAttempts = await db.findFailedLoginAttemptsByIp(ip)
      console.log('[Login] Failed attempts for IP:', loginAttempts)
      if (loginAttempts >= 5) {
        return c.json({ success: false, message: '登录失败次数过多，请稍后再试' })
      }
    } catch (e: any) {
      console.error('[Login] Check failed attempts error:', e?.message || e)
    }

    let user = null
    try {
      user = await db.findUserByEmail(email)
      console.log('[Login] User found:', user ? { id: user.id, email: user.email } : 'null')
    } catch (e: any) {
      console.error('[Login] Find user error:', e?.message || e)
      return c.json({ success: false, message: '数据库查询失败：' + (e?.message || 'Unknown error') }, 500)
    }

    // 密码登录
    if (password) {
      if (!user) {
        return c.json({ success: false, message: '该邮箱未注册，请使用验证码登录' })
      }
      if (!user.passwordHash) {
        return c.json({ success: false, message: '该账号未设置密码，请使用验证码登录' })
      }
      const inputHash = await hashPassword(password)
      console.log('[Login] Password hash check:', { input: inputHash, stored: user.passwordHash, match: inputHash === user.passwordHash })
      if (inputHash !== user.passwordHash) {
        // 记录失败尝试
        await db.createFailedLoginAttempt(ip, email)
        return c.json({ success: false, message: '密码错误' })
      }
    }
    // 验证码登录/注册
    else if (code) {
      // 检查邮箱验证码（支持多个验证码在有效期内）
      const emailCode = await db.findEmailCode(email, code)

      if (!emailCode) {
        return c.json({ success: false, message: '邮箱验证码错误或已过期' })
      }

      // 标记验证码已使用
      await db.markEmailCodeUsed(emailCode.id)

      // 新用户自动注册
      if (!user) {
        user = await db.createUser(email)
      }
    } else {
      return c.json({ success: false, message: '请输入密码或验证码' })
    }

    // 登录成功，清除该 IP 的失败记录
    await db.clearFailedLoginAttempts(ip)

    // 生成 JWT Token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    const hasPassword = !!user.passwordHash

    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        hasPassword
      },
      needSetPassword: !hasPassword
    })
  } catch (e) {
    console.error('[Login] General error:', e)
    return c.json({ success: false, message: '登录失败：' + (e as any)?.message || 'Unknown error' }, 500)
  }
})

// 发送短信验证码
router.post('/send-phone-code', async (c) => {
  const db = c.get('db') as Database

  try {
    const { phone } = await c.req.json()

    if (!phone) {
      return c.json({ success: false, message: '请填写手机号' })
    }

    const code = generateCode(6)
    const expireAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await db.createSmsCode(phone, code, 'bind', expireAt)

    // TODO: 调用阿里云短信 API 发送

    return c.json({ success: true, message: '验证码已发送（测试环境）' })
  } catch (e) {
    console.error('Send phone code error:', e)
    return c.json({ success: false, message: '发送失败' }, 500)
  }
})

// 绑定手机号
router.post('/bind-phone', async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ success: false, message: '未登录' }, 401)
  }

  try {
    const { phone, code } = await c.req.json()

    if (!phone || !code) {
      return c.json({ success: false, message: '参数不完整' })
    }

    const sms = await db.findSmsCode(phone, code)
    if (!sms) {
      return c.json({ success: false, message: '短信验证码错误或已过期' })
    }

    await db.markSmsCodeUsed(sms.id)
    await db.updateUser(userId, { phone })

    return c.json({ success: true })
  } catch (e) {
    console.error('Bind phone error:', e)
    return c.json({ success: false, message: '绑定失败' }, 500)
  }
})

// 设置密码（首次登录，不需要原密码）
router.post('/set-password', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ success: false, message: '未登录' }, 401)
  }

  try {
    const { password, confirmPassword } = await c.req.json()

    if (!password || password.length < 6) {
      return c.json({ success: false, message: '密码至少 6 位' })
    }

    if (password !== confirmPassword) {
      return c.json({ success: false, message: '两次输入的密码不一致' })
    }

    const passwordHash = await hashPassword(password)
    await db.updateUser(userId, { passwordHash })

    return c.json({ success: true, message: '密码设置成功' })
  } catch (e) {
    console.error('Set password error:', e)
    return c.json({ success: false, message: '设置失败' }, 500)
  }
})

// 更改密码（需要登录，需要原密码）
router.post('/change-password', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ success: false, message: '未登录' }, 401)
  }

  try {
    const { oldPassword, newPassword, confirmNewPassword } = await c.req.json()

    if (!oldPassword) {
      return c.json({ success: false, message: '请输入原密码' })
    }

    if (!newPassword || newPassword.length < 6) {
      return c.json({ success: false, message: '新密码至少 6 位' })
    }

    if (newPassword !== confirmNewPassword) {
      return c.json({ success: false, message: '两次输入的新密码不一致' })
    }

    // 获取用户信息，验证原密码
    const user = await db.findUserById(userId)
    if (!user) {
      return c.json({ success: false, message: '用户不存在' })
    }

    if (!user.passwordHash) {
      return c.json({ success: false, message: '原密码未设置，请使用验证码登录' })
    }

    // 验证原密码
    const inputHash = await hashPassword(oldPassword)
    if (inputHash !== user.passwordHash) {
      return c.json({ success: false, message: '原密码错误' })
    }

    // 设置新密码
    const newPasswordHash = await hashPassword(newPassword)
    await db.updateUser(userId, { passwordHash: newPasswordHash })

    return c.json({ success: true, message: '密码已更新' })
  } catch (e) {
    console.error('Change password error:', e)
    return c.json({ success: false, message: '更改失败' }, 500)
  }
})

// JWT 验证中间件
async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未登录' }, 401)
  }

  try {
    const token = authHeader.slice(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    c.set('userId', (payload as any).userId)
    c.set('email', (payload as any).email)
    await next()
  } catch (e) {
    return c.json({ success: false, message: 'Token 无效' }, 401)
  }
}

// 获取当前用户信息
router.get('/me', authMiddleware, async (c) => {
  const db = c.get('db') as Database
  const userId = c.get('userId')

  try {
    const user = await db.findUserById(userId)
    if (!user) {
      return c.json({ success: false, message: '用户不存在' }, 404)
    }

    // 计算今日剩余票数
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const startStr = start.toISOString()
    const endStr = end.toISOString()

    // 计算今日已用票数（统计所有点评记录的 totalCount）
    const [profileReviews, merchantReviews] = await Promise.all([
      db.findProfileReviewsTodayByReviewer(userId, startStr, endStr),
      db.findMerchantReviewsTodayByReviewer(userId, startStr, endStr)
    ])

    console.log('[/me] profileReviews:', profileReviews)
    console.log('[/me] merchantReviews:', merchantReviews)

    let usedVotes = 0
    profileReviews.forEach((r) => {
      usedVotes += r.totalCount || 0
    })
    merchantReviews.forEach((r) => {
      usedVotes += r.totalCount || 0
    })

    console.log('[/me] usedVotes:', usedVotes, 'dailyLimit:', dailyLimit, 'remaining:', remaining)

    const isAdmin = user.email === 'admin@admin'
    const isSvip = !isAdmin && user.isSvip === 1 && user.svipExpire && new Date(user.svipExpire) > now
    const isMvip = !isAdmin && !isSvip && user.isMvip === 1 && user.mvipExpire && new Date(user.mvipExpire) > now
    const isVip = !isSvip && !isMvip && !isAdmin && user.isVip === 1 && user.vipExpire && new Date(user.vipExpire) > now

    const dailyLimit = isAdmin ? 999 : isSvip ? 10 : isMvip ? 8 : isVip ? 5 : 3
    const remaining = Math.max(0, dailyLimit - usedVotes)

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        isAdmin,
        isSvip,
        isMvip,
        isVip,
        vipExpire: user.vipExpire,
        svipExpire: user.svipExpire,
        mvipExpire: user.mvipExpire,
        dailyLimit,
        remaining,
        title: user.title,
        showTitle: user.showTitle
      }
    })
  } catch (e) {
    console.error('Get user error:', e)
    return c.json({ success: false, message: '获取用户信息失败' }, 500)
  }
})

export default router

# 邮件服务配置指南

## 概述

系统支持三种邮件服务提供商，任选其一配置即可。

---

## 方案一：Resend（强烈推荐）

### 优势
- 免费额度：**每月 3,000 封**（约每天 100 封）
- API 简洁，开发者友好
- 无需域名验证即可开始（使用 Resend 提供的测试域名）
- 审核宽松，注册即可用

### 配置步骤

#### 1. 注册 Resend 账号
1. 访问 https://resend.com/
2. 点击 "Sign Up" 注册账号
3. 验证邮箱

#### 2. 获取 API Key
1. 登录 Resend Dashboard
2. 进入 Settings → API Keys
3. 复制 API Key（以 `re_` 开头）

#### 3. 配置发件人邮箱
1. 进入 Domains → Add Domain
2. 添加你的域名（或使用 Resend 提供的测试域名 `onboarding@resend.dev`）
3. 配置 DNS 记录（DKIM/SPF）
4. 验证通过后即可使用

#### 4. 部署配置
在 Cloudflare Workers 设置中添加环境变量：
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

或修改 `wrangler.toml`：
```toml
[vars]
RESEND_API_KEY = "re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL = "noreply@yourdomain.com"
```

---

## 方案二：SendGrid（国际用户）

### 优势
- 免费额度：100 封/天
- 设置简单
- 全球到达率高

### 配置步骤

#### 1. 注册 SendGrid 账号
1. 访问 https://sendgrid.com/
2. 点击 "Sign Up" 注册账号
3. 验证邮箱

#### 2. 创建 API Key
1. 登录 SendGrid Dashboard
2. 进入 Settings → API Keys
3. 点击 "Create API Key"
4. 选择 "Custom API Key"
5. 名称填写：`shanxin-heihongbang`
6. 权限选择：**Full Access**
7. 复制生成的 API Key（只显示一次）

#### 3. 配置发件人邮箱
1. 进入 Settings → Sender Authentication
2. 点击 "Verify a Single Sender"
3. 填写发件人信息：
   - From Email: 你的邮箱（如 noreply@yourdomain.com）
   - From Name: 山信黑红榜
   - Address: 你的地址
4. 验证邮箱

#### 4. 部署配置
在 Cloudflare Workers 设置中添加环境变量：
```
SENDGRID_API_KEY=你的 API_KEY
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

或修改 `wrangler.toml`：
```toml
[vars]
SENDGRID_API_KEY = "SG.xxxxxx.xxxxxx"
SENDGRID_FROM_EMAIL = "noreply@yourdomain.com"
```

---

## 方案二：腾讯云邮件推送（推荐国内用户）

### 优势
- 免费额度：200 封/天
- 国内到达率高
- 适合中国大陆用户

### 配置步骤

#### 1. 注册腾讯云账号
1. 访问 https://cloud.tencent.com/
2. 注册并实名认证

#### 2. 开通邮件推送服务
1. 访问 https://console.cloud.tencent.com/dm
2. 点击 "开通服务"
3. 填写发信申请（说明用途为"用户验证码邮件"）

#### 3. 创建发信域名
1. 进入域名管理 → 创建域名
2. 填写你的域名（如 yourdomain.com）
3. 按提示配置 DNS 记录（SPF、DKIM）
4. 等待域名验证通过（通常几分钟到几小时）

#### 4. 创建发信邮箱
1. 进入发信邮箱 → 创建发信邮箱
2. 填写邮箱地址（如 noreply@yourdomain.com）
3. 验证邮箱

#### 5. 获取密钥
1. 访问 https://console.cloud.tencent.com/cam/capi
2. 创建密钥或查看已有密钥
3. 复制 SecretId 和 SecretKey

#### 6. 部署配置
在 Cloudflare Workers 设置中添加环境变量：
```
TENCENT_SECRET_ID=你的 SecretID
TENCENT_SECRET_KEY=你的 SecretKey
TENCENT_FROM_EMAIL=noreply@yourdomain.com
```

或修改 `wrangler.toml`：
```toml
[vars]
TENCENT_SECRET_ID = "AKIDxxxxx"
TENCENT_SECRET_KEY = "xxxxx"
TENCENT_FROM_EMAIL = "noreply@yourdomain.com"
```

---

## 测试邮件发送

### 使用 wrangler 测试
```bash
# 本地测试
npx wrangler dev

# 然后访问 http://localhost:8787/api/auth/send-email-code
# POST 请求测试
```

### 使用 curl 测试
```bash
curl -X POST http://localhost:8787/api/auth/send-email-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "captchaCode": "ABCD", "captchaSession": "session-id"}'
```

---

## 常见问题

### Q1: 邮件发送失败
- 检查 API Key/密钥是否正确
- 检查发件人邮箱是否验证
- 查看 Cloudflare Workers 日志

### Q2: 邮件进入垃圾箱
- 确保域名 DNS 记录（SPF/DKIM）配置正确
- 避免发送频繁
- 邮件内容不要包含敏感词

### Q3: 发送频率限制
- SendGrid: 100 封/天
- 腾讯云：200 封/天
- 系统已实现同一邮箱每日最多 3 次验证码

---

## 安全建议

1. **生产环境使用环境变量**
   - 不要在代码中硬编码密钥
   - 使用 Cloudflare Workers 环境变量

2. **定期轮换密钥**
   - 建议每 3-6 个月更换一次

3. **监控发送量**
   - 定期检查邮件发送日志
   - 设置异常告警

4. **限制发送频率**
   - 系统已实现每日限制
   - 可根据需要调整

---

## 代码参考

邮件发送逻辑位于：`backend/src/routes/auth.ts`
- `sendEmailVerification()` 函数
- 支持 SendGrid 和腾讯云两种服务
- 自动选择配置的服务

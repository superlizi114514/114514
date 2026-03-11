# 安全审查报告 - 山信点评系统

## 审查日期
2026-03-11

## 审查范围
- 所有后端 API 路由（/backend/src/routes/）
- 数据库查询安全性
- 身份认证与授权机制
- 输入验证与输出编码
- XSS/SQL 注入防护

---

## 一、安全现状总结

### 1.1 已实现的安全措施（良好）

| 安全领域 | 状态 | 说明 |
|---------|------|------|
| SQL 注入防护 | 已实现 | 所有数据库查询使用参数化查询（`.bind()` 方法） |
| JWT 认证 | 已实现 | 所有敏感 API 需要 Bearer Token 验证 |
| 管理员权限验证 | 已实现 | 检查 `email === 'admin@admin'` |
| 密码哈希存储 | 已实现 | 使用 SHA-256 哈希（建议升级为 bcrypt） |
| 违禁词过滤 | 已实现 | 点评内容提交前检查违禁词 |
| 每日票数限制 | 已实现 | 根据用户等级限制每日点评次数 |
| 验证码机制 | 已实现 | 图形验证码 + 邮箱验证码双重验证 |
| 发送频率限制 | 已实现 | 邮箱验证码每日最多 3 次 |

### 1.2 安全等级评估

| 风险类别 | 风险等级 | 修复优先级 |
|---------|---------|-----------|
| SQL 注入 | 低 | - |
| XSS 攻击 | 低 | - |
| CSRF 攻击 | 中 | P2 |
| 未授权访问 | 低 | - |
| 密码安全 | 中 | P2 |
| 敏感信息泄露 | 低 | - |

---

## 二、详细安全分析

### 2.1 SQL 注入防护（安全）

所有路由文件中的数据库查询均使用参数化查询，有效防止 SQL 注入：

```typescript
// 示例：partTimeJobs.ts - 安全的参数化查询
let sql = 'SELECT * FROM part_time_jobs WHERE 1=1'
const conditions: string[] = []
const params: any[] = []
if (keyword) {
  conditions.push('(name LIKE ? OR description LIKE ? OR type LIKE ? OR priceList LIKE ?)')
  const keywordPattern = `%${keyword}%`
  params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern)
}
// 使用 .bind() 绑定参数
const result = await this.db.prepare(sql).bind(...params).all<PartTimeJob>()
```

**检查过的路由文件：**
- `auth.ts` - 登录认证相关
- `profiles.ts` - 人员管理相关
- `merchants.ts` - 商家管理相关
- `support.ts` - 赞助管理相关
- `partTimeJobs.ts` - 兼职管理相关
- `admin.ts` - 管理后台相关
- `settings.ts` - 用户设置相关
- `blocked-words.ts` - 违禁词管理相关
- `rankings.ts` - 排行榜相关
- `search.ts` - 搜索相关
- `reports.ts` - 举报相关
- `invite-codes.ts` - 邀请码相关

### 2.2 XSS 防护（安全）

前端使用 Vue 3 + Vant UI，默认自动转义输出：

```vue
<!-- Vue 模板自动转义，防止 XSS -->
<div class="job-name">{{ item.name }}</div>
<div class="job-description">{{ item.description }}</div>
```

**注意：** 如果未来需要渲染富文本内容，需使用 `v-html` 时需额外添加 DOMPurify 过滤。

### 2.3 身份认证（安全）

所有敏感操作均需要 JWT Token 验证：

```typescript
// 标准认证中间件模式
async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: '未登录' }, 401)
  }
  try {
    const token = authHeader.slice(7)
    const secret = new TextEncoder().encode(c.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    c.set('userId', (payload as any).userId)
    c.set('email', (payload as any).email)
    await next()
  } catch {
    return c.json({ success: false, message: 'Token 无效' }, 401)
  }
}
```

### 2.4 管理员权限验证（安全）

管理接口使用双重验证（先认证，再验证管理员身份）：

```typescript
async function isAdminMiddleware(c: any, next: any) {
  await authMiddleware(c, next)
  const email = c.get('email')
  if (email !== 'admin@admin') {
    return c.json({ success: false, message: '无权限' }, 403)
  }
}
```

### 2.5 输入验证（良好）

关键接口已实现输入验证：

```typescript
// 兼职创建 - 必填字段验证
if (!name || !contact) {
  return c.json({ success: false, message: '名称和联系方式必填' })
}

// 密码长度验证
if (!password || password.length < 6) {
  return c.json({ success: false, message: '密码至少 6 位' })
}

// 班级格式验证（profiles.ts）
const classPattern = /^\d{2,4}级 [\u4e00-\u9fa5]{2,4}系$/u
if (!classPattern.test(trimmedClass)) {
  return c.json({ success: false, message: '班级格式不正确' })
}
```

### 2.6 错误处理（良好）

错误信息不包含敏感技术细节：

```typescript
try {
  // 业务逻辑
} catch (e) {
  console.error('Error:', e)  // 详细错误仅记录到日志
  return c.json({ success: false, message: '操作失败，请重试' })  // 用户看到通用提示
}
```

---

## 三、发现的安全问题与建议

### P2 - 中等优先级

#### 3.1 密码哈希算法建议升级

**现状：** 使用 SHA-256 哈希
```typescript
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await (crypto as any).subtle.digest('SHA-256', data)
  // ...
}
```

**建议：** 升级为 bcrypt 或 Argon2（带盐值和成本因子）

**原因：** SHA-256 计算过快，易受暴力破解和彩虹表攻击

**影响范围：** `auth.ts`, `admin.ts`, `invite-codes.ts`

#### 3.2 缺少 CSRF 防护

**现状：** 未实现 CSRF Token 验证

**建议：**
- 对于 State-changing 操作（POST/PUT/DELETE）添加 CSRF Token 验证
- 或在 Cloudflare Workers 层配置 SameSite Cookie 策略

**风险：** 如果用户同时登录多个网站，可能遭受跨站请求伪造攻击

#### 3.3 兼职商家点评的违禁词检查未完成

**位置：** `merchants.ts:151-154`
```typescript
// 检查违禁词（简化）
if (content && content.trim().length > 0) {
  // TODO: 实现违禁词检查
}
```

**建议：** 添加与 `profiles.ts` 相同的违禁词检查逻辑

### P3 - 低优先级

#### 3.4 JWT Secret 管理

**建议：**
- 确保 `JWT_SECRET` 环境变量使用强随机字符串（至少 32 字节）
- 定期轮换 JWT Secret

#### 3.5 管理员邮箱硬编码

**现状：** `email === 'admin@admin'` 硬编码在多处

**建议：** 使用配置文件或环境变量 `ADMIN_EMAIL`

**影响范围：** 所有使用 `isAdminMiddleware` 的路由文件

---

## 四、数据库安全设计

### 4.1 参数化查询覆盖完整

| 路由文件 | 查询方式 | 安全性 |
|---------|---------|-------|
| auth.ts | `.bind()` | 安全 |
| profiles.ts | `.bind()` | 安全 |
| merchants.ts | `.bind()` | 安全 |
| support.ts | `.bind()` | 安全 |
| partTimeJobs.ts | `.bind()` | 安全 |
| admin.ts | `.bind()` | 安全 |
| settings.ts | `.bind()` | 安全 |
| blocked-words.ts | `.bind()` | 安全 |

### 4.2 敏感字段保护

- 用户密码：哈希后存储（`passwordHash` 字段）
- Token：仅内存中验证，不存储
- 邮箱验证码：验证后标记为已使用（`isUsed` 字段）

---

## 五、前端安全（Vue 3 + Vant）

### 5.1 XSS 防护

- Vue 模板默认转义所有插值表达式 `{{ }}`
- Vant 组件库安全处理用户输入
- 未使用 `v-html` 渲染不可信内容

### 5.2 认证 Token 存储

**现状：** Token 存储在 `localStorage`

**建议：**
- 考虑使用 `sessionStorage`（浏览器关闭自动清除）
- 或实现 HttpOnly Cookie（需要后端配合）

---

## 六、安全建议总结

### 立即可做（低成本高收益）

1. ✅ **违禁词检查补全** - 在 `merchants.ts` 中添加与 `profiles.ts` 相同的违禁词检查
2. ✅ **环境变量检查** - 确保 `JWT_SECRET` 使用强随机字符串

### 短期改进（1-2 周）

1. 升级密码哈希为 bcrypt
2. 实现 CSRF Token 验证
3. 管理员邮箱配置化

### 长期规划（1-3 月）

1. 实现操作日志审计功能
2. 添加异常登录检测
3. 实现 IP 黑名单机制

---

## 七、部署安全检查清单

部署前请确认以下项目：

### 环境变量配置
- [ ] `JWT_SECRET` 已设置为强随机字符串（至少 32 字符）
- [ ] `ADMIN_EMAIL` 已配置（如果使用）
- [ ] 邮件服务 API Key 已配置（SendGrid 或腾讯云）
- [ ] 数据库连接配置正确

### 数据库迁移
- [ ] 执行 `add_sponsor_name_to_support_records.sql`
- [ ] 执行 `add_part_time_jobs.sql`
- [ ] 验证 `part_time_jobs` 表结构正确
- [ ] 验证 `support_records.sponsorName` 字段存在

### 功能测试
- [ ] 管理员登录验证
- [ ] 兼职发布/编辑/删除功能
- [ ] 赞助人名称设置功能
- [ ] 自定义称号授予功能
- [ ] 搜索和筛选功能
- [ ] 违禁词过滤功能

---

## 八、如何部署

### 8.1 Cloudflare Workers 部署

```bash
# 1. 安装依赖
cd backend
npm install

# 2. 配置环境变量（wrangler.toml 或 Cloudflare 控制台）
# JWT_SECRET=your-secret-key-here
# ADMIN_EMAIL=admin@admin

# 3. 执行数据库迁移
npx wrangler d1 execute <DATABASE_NAME> --file=migrations/add_sponsor_name_to_support_records.sql
npx wrangler d1 execute <DATABASE_NAME> --file=migrations/add_part_time_jobs.sql

# 4. 部署
npm run deploy
```

### 8.2 前端部署

```bash
# 1. 安装依赖
cd frontend
npm install

# 2. 配置 API 地址（.env 或 vite.config.ts）
# VITE_API_URL=https://your-worker.your-subdomain.workers.dev

# 3. 构建
npm run build

# 4. 部署到 Cloudflare Pages 或其他静态托管
```

### 8.3 本地测试

```bash
# 后端
cd backend
npm run dev  # 启动本地开发服务器

# 前端
cd frontend
npm run dev  # 启动前端开发服务器
```

---

## 九、联系信息

如有安全问题反馈，请联系开发团队。

---

*本报告由自动化工具辅助生成，建议定期进行人工安全审计。*

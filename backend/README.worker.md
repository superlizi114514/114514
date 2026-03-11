# 山信黑红榜 - Cloudflare Workers 版本

## 项目结构

```
backend/
├── src/
│   ├── worker.ts          # Workers 入口文件
│   ├── db.ts              # D1 数据库操作类
│   ├── routes/            # 路由文件 (Hono 版本)
│   │   ├── auth.ts
│   │   ├── profiles.ts
│   │   ├── merchants.ts
│   │   ├── rankings.ts
│   │   ├── search.ts
│   │   ├── reports.ts
│   │   ├── admin.ts
│   │   ├── support.ts
│   │   ├── settings.ts
│   │   ├── blocked-words.ts
│   │   └── invite-codes.ts
│   └── index.ts           # Express 入口 (保留)
├── sql/
│   └── schema.sql         # D1 数据库 Schema
├── wrangler.toml          # Workers 配置
├── package.json
├── tsconfig.json
└── DEPLOY.md              # 部署指南
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 D1 数据库

```bash
wrangler d1 create shanxin-db
```

记录返回的 `database_id`。

### 4. 配置 wrangler.toml

编辑 `wrangler.toml`，填入你的 `database_id`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "shanxin-db"
database_id = "你的 database_id"
```

### 5. 初始化数据库

```bash
npm run db:init:prod
```

### 6. 设置环境变量

```bash
wrangler secret put JWT_SECRET
```

### 7. 本地开发

```bash
npm run dev:worker
```

访问 `http://localhost:8787/health`

### 8. 部署

```bash
npm run deploy
```

---

## API 端点

| 端点 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `GET /` | API 信息 |
| `POST /api/auth/login` | 登录 |
| `GET /api/auth/captcha` | 获取图形验证码 |
| `POST /api/auth/send-email-code` | 发送邮箱验证码 |
| `GET /api/auth/me` | 获取用户信息 |
| `GET /api/profiles` | 获取人员列表 |
| `POST /api/profiles` | 添加人员 |
| `POST /api/profiles/:id/reviews` | 添加人员点评 |
| `GET /api/merchants` | 获取商家列表 |
| `POST /api/merchants/:id/reviews` | 添加商家点评 |
| `GET /api/rankings/total` | 总榜单 |
| `GET /api/rankings/profile` | 个人榜单 |
| `GET /api/rankings/merchant` | 商家榜单 |
| `GET /api/search?q=xxx` | 搜索 |
| `POST /api/reports/profile` | 举报人员点评 |
| `POST /api/reports/merchant` | 举报商家点评 |
| `GET /api/admin/users` | 用户管理 (管理员) |
| `GET /api/support/supporters` | 赞助者名单 |

---

## 从 Express 迁移到 Hono

### 主要变化

1. **路由定义**
   - Express: `router.get('/', fn)`
   - Hono: `router.get('/', fn)` (语法相同)

2. **请求/响应**
   - Express: `req.body`, `res.json()`
   - Hono: `c.req.json()`, `c.json()`

3. **中间件**
   - Express: `function(req, res, next)`
   - Hono: `async (c, next) => { await next() }`

4. **数据库**
   - Express: Prisma ORM
   - Hono: D1 原生 SQL

---

## 成本

| 项目 | 免费额度 | 说明 |
|------|----------|------|
| Workers | 10 万次请求/天 | 约 300 万次/月 |
| D1 | 5GB + 500 万次读取 | 足够 3000+ 用户 |
| **总计** | **¥0** | 纯免费 |

---

## 部署到自定义域名

1. Cloudflare 添加网站 `shanxin.online`
2. 修改 DNS 服务器到 Cloudflare
3. Workers → Triggers → Custom domains
4. 添加 `api.shanxin.online`

---

## 下一步

1. 部署后端到 Workers
2. 部署前端到 Cloudflare Pages
3. 绑定自定义域名
4. 配置 HTTPS（自动）

详细部署步骤请查看 [DEPLOY.md](./DEPLOY.md)

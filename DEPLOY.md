# Cloudflare 部署指南

## 概述

本项目分为两部分：
- **Backend**: Cloudflare Workers + D1 数据库
- **Frontend**: Cloudflare Pages

---

## 准备工作

### 1. 创建 Cloudflare 账号
访问 https://dash.cloudflare.com/sign-up 注册账号

### 2. 获取 API Token

1. 登录 Cloudflare Dashboard
2. 进入 **Profile** → **API Tokens**
3. 点击 **Create Token**
4. 选择模板：**Edit Cloudflare Workers**
5. 权限确认：
   - Account Cloudflare Pages: Edit
   - Account Cloudflare Workers: Edit
   - Account D1: Edit
6. 复制生成的 Token

### 3. 配置 GitHub Secrets

在 GitHub 仓库设置中添加 Secrets：

1. 进入 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加以下 Secret：

| Name | Value |
|------|-------|
| `CF_API_TOKEN` | 上面创建的 Cloudflare API Token |
| `CF_ACCOUNT_ID` | Cloudflare 账号 ID（在 Profile 页面找到） |

---

## 后端部署 (Workers + D1)

### 步骤 1: 创建 D1 数据库

```bash
cd backend

# 创建生产数据库
npx wrangler d1 create shanxin-db

# 或使用远程模式
npx wrangler d1 create shanxin-db --remote
```

记录返回的 `database_id`，更新到 `wrangler.toml` 中。

### 步骤 2: 初始化数据库

```bash
# 执行数据库迁移
npx wrangler d1 execute shanxin-db --remote --file=sql/schema.sql
```

### 步骤 3: 部署 Workers

```bash
# 登录 Cloudflare
npx wrangler login

# 部署到生产环境
npx wrangler deploy --env production
```

或使用 GitHub Actions 自动部署：
- 推送代码到 `master` 或 `main` 分支自动触发部署

### 步骤 4: 配置环境变量

在 Cloudflare Dashboard 中设置生产环境变量：

1. 进入 **Workers & Pages** → **shanxin-api**
2. 点击 **Settings** → **Variables**
3. 添加以下变量：

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | 随机生成的密钥（至少 32 位） |
| `RESEND_API_KEY` | Resend API Key |
| `RESEND_FROM_EMAIL` | 发件人邮箱 |

---

## 前端部署 (Pages)

### 步骤 1: 修改 API 地址

编辑 `frontend/src/api/http.ts` 或创建 `.env.production`：

```bash
VITE_API_URL=https://api.shanxin.com
```

### 步骤 2: 部署到 Pages

```bash
cd frontend

# 登录 Cloudflare
npx wrangler login

# 创建 Pages 项目
npx wrangler pages project create shanxin-frontend

# 部署
npx wrangler pages deploy dist --project-name=shanxin-frontend
```

### 或使用 GitHub Actions 自动部署

推送代码到 `master` 或 `main` 分支自动触发部署。

---

## 自定义域名配置

### 1. 绑定域名

**Workers (后端 API):**
1. 进入 Workers → **shanxin-api** → **Settings**
2. 点击 **Triggers** → **Add Custom Domain**
3. 输入你的域名：`api.shanxin.com`

**Pages (前端):**
1. 进入 Pages → **shanxin-frontend** → **Settings**
2. 点击 **Custom Domains** → **Add Custom Domain**
3. 输入你的域名：`www.shanxin.com`

### 2. 配置 DNS

在域名服务商添加 CNAME 记录：

| 类型 | 名称 | 内容 |
|------|------|------|
| CNAME | api | `shanxin-api.your-subdomain.workers.dev` |
| CNAME | www | `shanxin-frontend.pages.dev` |

---

## 数据库迁移

### 导出本地数据

```bash
npx wrangler d1 export shanxin-db --local --output=backup.sql
```

### 导入到生产环境

```bash
npx wrangler d1 execute shanxin-db --remote --file=backup.sql
```

---

## 日志查看

### Workers 日志

```bash
# 实时查看日志
npx wrangler tail shanxin-api

# 或查看特定环境
npx wrangler tail shanxin-api --env production
```

### 在 Dashboard 查看

1. 进入 **Workers & Pages** → 选择项目
2. 点击 **Logs** 标签页

---

## 故障排查

### Q1: 部署失败 - 认证错误
**解决:** 重新执行 `npx wrangler login`

### Q2: 数据库绑定失败
**解决:** 检查 `wrangler.toml` 中的 `database_id` 是否正确

### Q3: CORS 错误
**解决:** 在 `backend/src/worker.ts` 中添加 CORS 配置

### Q4: 环境变量未生效
**解决:**
- 检查是否在正确的环境中部署（`--env production`）
- 在 Dashboard 中确认变量已设置

---

## 自动化部署流程

```
GitHub Push → GitHub Actions → Cloudflare
     ↓
  master/main
     ↓
  触发部署
     ↓
  自动构建 + 部署
```

### 查看部署状态

- GitHub: **Actions** 标签页查看 CI/CD 状态
- Cloudflare: **Workers & Pages** → 选择项目 → **Deployments**

---

## 安全建议

1. **不要提交敏感信息**
   - `.env` 文件添加到 `.gitignore`
   - 使用 GitHub Secrets 管理密钥

2. **定期轮换密钥**
   - JWT_SECRET 每 3 个月更换
   - API Keys 定期检查

3. **启用 Cloudflare 保护**
   - 开启 **Web Analytics**
   - 配置 **Rate Limiting**
   - 启用 **Bot Management**

---

## 费用估算

### 免费额度

| 服务 | 免费额度 |
|------|----------|
| Workers | 100,000 请求/天 |
| D1 | 5GB 存储，1000 万读取/月 |
| Pages | 500 次构建/月，无限流量 |

### 预计成本

对于小型项目，基本在**免费额度内**。

---

## 参考链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

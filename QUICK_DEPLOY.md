# GitHub 自动部署快速指南

## 部署步骤

### 1. 创建 Cloudflare API Token

1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 **Create Token**
3. 选择 **Edit Cloudflare Workers** 模板
4. 确认权限：
   - Account Cloudflare Pages: **Edit**
   - Account Cloudflare Workers: **Edit**
   - Account D1: **Edit**
   - Account Cloudflare Logs: **Read**
5. 点击 **Continue to summary**
6. 复制 API Token（只显示一次！）

### 2. 配置 GitHub Secrets

1. 打开你的 GitHub 仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下两个 Secret：

| Name | Value |
|------|-------|
| `CF_API_TOKEN` | 步骤 1 中创建的 API Token |
| `CF_ACCOUNT_ID` | 你的 Cloudflare 账号 ID |

> 💡 账号 ID 获取方式：登录 Cloudflare → 右侧显示 Account ID → 点击复制

### 3. 推送代码到 GitHub

```bash
# 如果还没初始化 git
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送到 main 分支
git push -u origin main
```

### 4. 创建 D1 数据库

```bash
cd backend

# 登录 Cloudflare
npx wrangler login

# 创建数据库
npx wrangler d1 create shanxin-db

# 复制返回的 database_id，更新到 wrangler.toml 中
```

### 5. 初始化数据库

```bash
# 执行数据库迁移
npx wrangler d1 execute shanxin-db --remote --file=sql/schema.sql
```

### 6. 部署后端

```bash
cd backend

# 部署到 Cloudflare Workers
npx wrangler deploy
```

### 7. 部署前端

```bash
cd frontend

# 构建并部署
npm run build
npx wrangler pages deploy dist --project-name=shanxin-frontend
```

---

## 自动部署

完成以上步骤后，每次推送代码到 `main` 或 `master` 分支时：

```
Git Push → GitHub Actions → Cloudflare
```

自动触发部署！

### 查看部署状态

- **GitHub**: 仓库 → **Actions** 标签页
- **Cloudflare**: Workers & Pages → 选择项目 → **Deployments**

---

## 配置 Resend 发件人

1. 登录 https://resend.com/
2. 进入 **Domains** → **Add Domain**
3. 添加你的域名
4. 配置 DNS 记录（SPF、DKIM、MX）
5. 验证通过后，在 **Verified Emails** 添加发件人邮箱
6. 更新 `backend/wrangler.toml` 中的 `RESEND_FROM_EMAIL`

---

## 配置自定义域名

### 后端 API

1. 进入 **Workers & Pages** → **shanxin-api**
2. 点击 **Settings** → **Triggers**
3. 点击 **Add Custom Domain**
4. 输入：`api.shanxin.com`

### 前端

1. 进入 **Workers & Pages** → **shanxin-frontend**
2. 点击 **Settings** → **Custom Domains**
3. 点击 **Add Custom Domain**
4. 输入：`www.shanxin.com` 或 `shanxin.com`

### DNS 配置

在域名服务商添加 CNAME 记录：

```
类型    名称              内容
CNAME   api    →    shanxin-api.<你的子域名>.workers.dev
CNAME   www    →    shanxin-frontend.pages.dev
```

---

## 环境变量管理

### 生产环境变量

在 Cloudflare Dashboard 设置：

1. **Workers & Pages** → **shanxin-api** → **Settings** → **Variables**
2. 添加以下变量：

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | 随机生成至少 32 位 |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` |

---

## 常见问题

### Q: 部署失败，提示认证错误
**A:** 重新执行 `npx wrangler login`

### Q: GitHub Actions 失败
**A:** 检查 Secrets 是否正确配置

### Q: 数据库绑定失败
**A:** 检查 `wrangler.toml` 中的 `database_id` 是否正确

### Q: 前端无法连接后端 API
**A:** 修改 `frontend/.env.production` 中的 `VITE_API_BASE_URL` 为实际域名

---

## 参考资源

- [DEPLOY.md](./DEPLOY.md) - 完整部署文档
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Resend 文档](https://resend.com/docs)

# Cloudflare Workers 部署指南

## 一、准备工作

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

会打开浏览器进行授权。

---

## 二、创建 D1 数据库

```bash
wrangler d1 create shanxin-db
```

记录返回的 `database_id`（类似 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）。

---

## 三、配置项目

### 1. 更新 wrangler.toml

编辑 `backend/wrangler.toml`，将 `database_id` 填入：

```toml
name = "shanxin-api"
main = "src/worker.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
JWT_SECRET = "your-random-secret-change-this"

[[d1_databases]]
binding = "DB"
database_name = "shanxin-db"
database_id = "你的 database_id"
```

### 2. 初始化数据库

```bash
# 本地测试
wrangler d1 execute shanxin-db --file sql/schema.sql --local

# 生产环境
wrangler d1 execute shanxin-db --file sql/schema.sql
```

---

## 四、设置环境变量

```bash
# 设置 JWT 密钥（生产环境）
wrangler secret put JWT_SECRET
```

输入一个随机字符串，至少 16 位。

---

## 五、本地开发

```bash
npm run dev
```

访问 `http://localhost:8787/health` 测试。

---

## 六、部署到 Cloudflare

```bash
npm run deploy
```

部署成功后会返回 API 地址，类似：
```
https://shanxin-api.your-subdomain.workers.dev
```

---

## 七、绑定自定义域名

### 1. Cloudflare 添加网站

1. 登录 Cloudflare Dashboard
2. 添加网站 `shanxin.online`
3. 按照提示修改 DNS 服务器

### 2. Workers 绑定域名

1. Workers & Pages → 选择 `shanxin-api`
2. Triggers → Custom domains
3. Add custom domain
4. 输入 `api.shanxin.online`

---

## 八、前端配置

更新前端的 `.env` 文件：

```env
VITE_API_BASE_URL=https://api.shanxin.online
```

---

## 九、成本预估

| 项目 | 免费额度 | 说明 |
|------|----------|------|
| Workers | 10 万次请求/天 | 足够小规模使用 |
| D1 | 5GB 存储 + 500 万次读取/月 | 足够 3000+ 用户 |
| 域名 | 已拥有 | shanxin.online |
| **总计** | **¥0/月** | 纯免费方案 |

---

## 十、常见问题

### Q1: 部署失败，提示 "bindings not found"
确保 `wrangler.toml` 中的 `database_id` 正确。

### Q2: 数据库表不存在
运行初始化命令：
```bash
wrangler d1 execute shanxin-db --file sql/schema.sql
```

### Q3: Token 验证失败
确保 `JWT_SECRET` 已正确设置：
```bash
wrangler secret put JWT_SECRET
```

### Q4: CORS 错误
Worker 已配置 CORS 中间件，检查前端请求的域名是否正确。

---

## 十一、监控

### 查看日志

```bash
wrangler tail shanxin-api
```

### 查看数据库

```bash
wrangler d1 execute shanxin-db --command "SELECT * FROM users LIMIT 10"
```

---

**部署完成！** 🎉

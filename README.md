# 山信黑红榜 — 项目骨架

已按文档启动前后端基础结构，并将“手机号绑定为登录后可选项”落地到接口设计。

## 目录结构

```
shanxin-heihongbang/
├── frontend/   # Vue3 + Vite
└── backend/    # Node.js + Express + TypeScript
```

## 前端

1. 进入 `frontend` 安装依赖并启动：
   - `npm install`
   - `npm run dev`
2. 默认接口地址 `http://localhost:3000`，可通过 `VITE_API_BASE_URL` 覆盖。

## 后端

1. 进入 `backend` 安装依赖并启动：
   - `npm install`
   - `npm run dev`
2. 复制 `.env.example` 为 `.env` 后按需配置。
3. 首次使用数据库需执行：
   - `npm run prisma:generate`
   - `npm run prisma:migrate`

## 接口说明（当前为最小可运行骨架）

- `GET /api/auth/captcha`：获取图形验证码
- `POST /api/auth/send-email-code`：发送邮箱验证码
- `POST /api/auth/login`：邮箱验证码登录
- `POST /api/auth/send-phone-code`：发送绑定/找回短信验证码
- `POST /api/auth/bind-phone`：绑定手机号（登录后可选）
- `GET /api/profiles`：获取人员列表（当前用户）
- `POST /api/profiles`：添加人员
- `GET /api/profiles/:id/reviews`：获取人员点评
- `POST /api/profiles/:id/reviews`：添加人员点评
- `GET /api/rankings/profile`：人员榜单（按点评数）
- `GET /api/search`：搜索人员（支持 `keyword` 与 `type`）
- `GET /api/merchants`：获取商家列表
- `POST /api/merchants`：添加商家
- `GET /api/merchants/:id/reviews`：获取商家点评
- `POST /api/merchants/:id/reviews`：添加商家点评
- `GET /api/rankings/merchant`：商家榜单（按点评数）
- `POST /api/reports/profile`：举报人员点评
- `GET /api/admin/reports`：管理员获取待处理举报（需 `x-admin-token`）
- `GET /api/admin/reports/history`：管理员获取处理记录
- `POST /api/admin/reports/:id/approve`：管理员通过并删除点评
- `POST /api/admin/reports/:id/reject`：管理员驳回举报

## 后续建议

- 接入真实邮件与短信服务
- 补全用户、点评、商家等核心业务模块

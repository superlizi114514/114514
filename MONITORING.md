# 监控告警设置指南

## 方案一：Uptime Robot（推荐，5 分钟一次）

### 1. 注册账号
1. 访问 https://uptimerobot.com
2. 点击 "Sign Up" 免费注册
3. 用邮箱注册并验证

### 2. 添加监控
1. 登录后点击 "Add New Monitor"
2. 填写配置：
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `山信黑红榜 API`
   - **URL**: `https://api.sxhh.online/health`
   - **Monitoring Interval**: `5 minutes` (免费版默认)
3. 点击 "Create Monitor"

### 3. 设置邮箱告警
1. 点击右上角头像 → "My Settings"
2. 选择 "Alert Contacts" → "Add Alert Contact"
3. 填写：
   - **Friendly Name**: `我的邮箱`
   - **Type**: Email
   - **Email**: 你的邮箱地址
4. 点击 "Create Alert Contact"

### 4. 设置微信告警（可选，推荐）

#### 步骤 1: 获取 ServerChan SendKey
1. 访问 https://sct.ftqq.com/
2. 微信扫码登录
3. 复制 SendKey（类似 `SCTxxxxxxxxxxxxx`）

#### 步骤 2: 在 Uptime Robot 添加 Webhook
1. Uptime Robot → My Settings → Alert Contacts → Add Alert Contact
2. 填写：
   - **Friendly Name**: `微信告警`
   - **Type**: Webhook
   - **URL**: `https://sctapi.ftqq.com/[SendKey].send?title=山信黑红榜告警&desp=服务异常`
3. 点击 "Create Alert Contact"

### 5. 验证
- 手动访问 `https://api.sxhh.online/health`
- 应该返回 `{"ok":true,"timestamp":"xxx"}`

---

## 方案二：Better Stack（1 分钟一次，更及时）

### 1. 注册账号
1. 访问 https://betterstack.com/uptime
2. 点击 "Start monitoring for free"
3. 用邮箱注册

### 2. 添加监控
1. 点击 "Add monitor"
2. 填写：
   - **Monitor name**: `山信黑红榜 API`
   - **URL**: `https://api.sxhh.online/health`
   - **Check frequency**: `1 minute`
3. 点击 "Create monitor"

### 3. 设置告警
1. Settings → Incident management → Email notifications
2. 添加你的邮箱
3. 开启 SMS/Phone call（需要绑定手机）

---

## 方案三：腾讯云监控（国内，微信告警）

### 1. 注册腾讯云账号
1. 访问 https://cloud.tencent.com
2. 注册并实名认证

### 2. 开通云监控
1. 进入控制台 → 云监控
2. 点击 "站点监控" → "创建监控点"
3. 填写：
   - **监控名称**: `山信黑红榜 API`
   - **监控类型**: HTTP/HTTPS
   - **监控地址**: `https://api.sxhh.online/health`
   - **监控频率**: `1 分钟`

### 3. 设置告警
1. 告警配置 → 创建告警策略
2. 填写：
   - **策略名称**: `API 不可用告警`
   - **触发条件**: 连续 3 次检测失败
   - **通知对象**: 添加你的微信
3. 保存

---

## 监控指标建议

| 指标 | 阈值 | 告警级别 |
|------|------|---------|
| API 响应失败 | 连续 3 次 | 🔴 严重 |
| 响应时间 > 5 秒 | 连续 5 次 | 🟡 警告 |
| SSL 证书过期 | 剩余 7 天 | 🟡 警告 |
| D1 数据库错误 | 任意次数 | 🔴 严重 |

---

## 快速验证命令

```bash
# 测试 API 是否正常
curl -s https://api.sxhh.online/health

# 测试验证码接口
curl -s https://api.sxhh.online/api/auth/captcha

# 测试登录接口
curl -s -X POST https://api.sxhh.online/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"123456"}'
```

---

## 推荐的完整配置

1. **Uptime Robot**: 每 5 分钟检测 API
2. **微信告警**: 第一时间接收通知
3. **邮件告警**: 作为备份通知方式
4. **定期检查**: 每周查看一次监控报告

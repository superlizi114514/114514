<template>
  <div class="guide-page">
    <div class="header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-text">
          <h1>使用说明</h1>
          <p>快速了解如何使用山信黑红榜</p>
        </div>
      </div>
    </div>

    <!-- 登录注册 -->
    <div class="content-card">
      <h2>📧 登录/注册</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">选择登录方式</div>
            <p class="step-desc">支持密码登录和验证码登录两种方式</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-title">输入邮箱</div>
            <p class="step-desc">输入你的邮箱地址（测试邮箱：admin@admin.admin）</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-title">验证码登录</div>
            <p class="step-desc">输入图形验证码后点击"发送验证码"，收到邮箱验证码后填写</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">4</div>
          <div class="step-content">
            <div class="step-title">设置密码（首次）</div>
            <p class="step-desc">首次登录需要设置密码，下次可使用密码登录</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 人员点评 -->
    <div class="content-card">
      <h2>👤 人员点评</h2>
      <div class="feature-section">
        <h3>添加人员</h3>
        <ol>
          <li>进入"人员列表"页面</li>
          <li>填写姓名（必填）、校区、班级等信息</li>
          <li>选择榜单类型（红榜/黑榜）</li>
          <li>填写备注信息（可选）</li>
          <li>点击"添加人员"</li>
        </ol>

        <h3>进行点评</h3>
        <ol>
          <li>添加人员后会自动弹出点评窗口</li>
          <li>选择点评类型（红榜/黑榜）</li>
          <li>输入点评内容</li>
          <li>可选择匿名发布</li>
          <li>点击"提交点评"</li>
        </ol>

        <van-alert type="info" title="点评限制">
          普通用户每日可点评 3 个不同的人，VIP 用户可点评 5 人，SVIP 用户可点评 10 人
        </van-alert>

        <van-alert type="primary" title="大票/小票机制" style="margin-top: 12px;">
          <template #default>
            <div style="font-size: 13px; line-height: 1.6;">
              <p style="margin: 4px 0;"><strong>大票</strong>：每天对同一目标的第一次点评算大票，权重高</p>
              <p style="margin: 4px 0;"><strong>小票</strong>：当天对同一目标的后续点评算小票，权重低</p>
              <p style="margin: 4px 0;"><strong>权重计算</strong>：排名按权重分计算，权重分 = 大票数 + (小票数 / 10)</p>
              <p style="margin: 8px 4px 4px 4px; font-weight: 600; color: #059669;">💡 设计目的：让榜单更公平</p>
              <p style="margin: 4px 0; color: #6b7280;">大小票机制可以防止恶意刷榜，让每个人的第一票更有分量，同时允许用户表达更细致的评价</p>
            </div>
          </template>
        </van-alert>
      </div>
    </div>

    <!-- 人员榜单 -->
    <div class="content-card">
      <h2>📊 人员榜单</h2>
      <div class="feature-section">
        <p>在"人员榜单"页面可以查看：</p>
        <ul>
          <li><strong>红榜排名</strong> - 获得好评最多的人员</li>
          <li><strong>黑榜排名</strong> - 被曝光最多的人员</li>
          <li><strong>榜单详情</strong> - 点击查看每个人的具体点评</li>
        </ul>
      </div>
    </div>

    <!-- 搜索功能 -->
    <div class="content-card">
      <h2>🔍 搜索功能</h2>
      <div class="feature-section">
        <p>使用搜索功能可以快速找到：</p>
        <ul>
          <li>特定姓名的人员</li>
          <li>特定校区/班级的人员</li>
        </ul>
        <van-alert type="warning" title="搜索提示">
          搜索支持模糊匹配，输入关键词即可
        </van-alert>
      </div>
    </div>

    <!-- VIP 赞助 -->
    <div class="content-card">
      <h2>🌟 VIP 赞助</h2>
      <div class="feature-section">
        <h3>VIP 特权</h3>
        <ul>
          <li><strong>VIP 用户</strong> - 每日点评 5 人（普通用户 3 人）</li>
          <li><strong>SVIP 用户</strong> - 每日点评 10 人 + 专属标识</li>
          <li>赞助者名单展示</li>
          <li>优先客服支持</li>
        </ul>

        <h3>赞助方式</h3>
        <ol>
          <li>进入"支持我们"页面</li>
          <li>选择赞助档位（¥15/月、¥25/学期、¥30/季 SVIP）</li>
          <li>扫码添加管理员微信</li>
          <li>微信转账并备注"山信赞助"</li>
          <li>返回页面填写赞助信息并提交</li>
          <li>等待管理员审核开通（24 小时内）</li>
        </ol>
      </div>
    </div>

    <!-- 最近更新 -->
    <div class="content-card">
      <h2>📝 最近更新</h2>
      <div class="feature-section">
        <div class="changelog-item">
          <div class="changelog-header" @click="toggleChangelog">
            <div class="changelog-version">v1.3 - 2026 年 3 月</div>
            <van-icon :name="showFullChangelog ? 'up' : 'down'" class="expand-icon" />
          </div>
          <ul>
            <li>✨ 新增用户称号系统，管理员可设置自定义称号</li>
            <li>🏷️ 新增 MVIP 等级（¥6/周，每日 8 次点评）</li>
            <li>📋 称号支持开关控制，保护隐私</li>
            <li>🎨 丰富称号池，提供多种趣味称号可选</li>
            <li>🏆 赞助者名单按赞助金额排序展示</li>
            <li>⚙️ 个人设置支持修改密码</li>
            <li>🔙 人员点评页面添加返回键</li>
            <li>📢 新增拉新活动公告</li>
          </ul>
        </div>
        <div class="changelog-item more" v-show="showFullChangelog">
          <div class="changelog-version">v1.2 - 2026 年 3 月</div>
          <ul>
            <li>📊 商家榜单榜分计算跟进大小票机制</li>
            <li>🛡️ 添加人员时自动检测重名，防止重复添加</li>
            <li>🧹 清理人员数据库重复记录</li>
          </ul>
        </div>
        <div class="changelog-item more" v-show="showFullChangelog">
          <div class="changelog-version">v1.1 - 2026 年 3 月</div>
          <ul>
            <li>✨ 新增大小票机制，让榜单更公平</li>
            <li>📱 主页显示 VIP/SVIP/MVIP 剩余时长</li>
            <li>🐛 修复管理员举报管理页面 notfound 问题</li>
          </ul>
        </div>
        <div class="changelog-item more" v-show="showFullChangelog">
          <div class="changelog-version">v1.0 - 2026 年初</div>
          <ul>
            <li>🎉 山信黑红榜正式上线</li>
            <li>👤 人员红黑榜功能</li>
            <li>🏪 商家红黑榜功能</li>
            <li>🔍 搜索功能</li>
          </ul>
        </div>
        <div class="changelog-toggle" v-if="!showFullChangelog" @click="toggleChangelog">
          <van-icon name="down" /> 查看全部更新记录
        </div>
      </div>
    </div>

    <!-- 注意事项 -->
    <div class="content-card">
      <h2>⚠️ 注意事项</h2>
      <div class="feature-section">
        <van-alert type="warning" title="平台规则" show-icon>
          <template #default>
            <div style="font-size: 13px; line-height: 1.6;">
              <p style="margin: 4px 0; color: #dc2626; font-weight: 600;">🚫 严禁开小号刷票，被发现直接 ban 掉</p>
              <p style="margin: 4px 0;">1. 请确保点评内容真实可靠，不得恶意诽谤</p>
              <p style="margin: 4px 0;">2. 禁止发布违法、色情、暴力等不当内容</p>
              <p style="margin: 4px 0;">3. 尊重他人隐私，不得泄露个人信息</p>
              <p style="margin: 4px 0;">4. 违规内容将被删除，严重者永久封号</p>
            </div>
          </template>
        </van-alert>
      </div>
    </div>

    <!-- 常见问题 -->
    <div class="content-card">
      <h2>❓ 常见问题</h2>
      <div class="faq-list">
        <div class="faq-item">
          <div class="faq-question">Q: 忘记账号密码怎么办？</div>
          <div class="faq-answer">A: 使用验证码登录即可，首次登录后可以重新设置密码。</div>
        </div>
        <div class="faq-item">
          <div class="faq-question">Q: 如何成为 VIP？</div>
          <div class="faq-answer">A: 进入"支持我们"页面，选择任意赞助档位完成赞助后，管理员会在 24 小时内开通 VIP。</div>
        </div>
        <div class="faq-item">
          <div class="faq-question">Q: 点评后能删除吗？</div>
          <div class="faq-answer">A: 目前不支持自行删除点评，请谨慎发布。如有需要请联系管理员。</div>
        </div>
        <div class="faq-item">
          <div class="faq-question">Q: 如何联系管理员？</div>
          <div class="faq-answer">A: 可通过"关于作者"页面查看联系方式，或添加管理员微信。</div>
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <div class="footer-card">
      <p>还有其他问题？请联系管理员或查看"关于作者"页面</p>
      <p class="copyright">© 2024 山信黑红榜 - LiziStudio</p>
      <p class="admin-link" @click="$router.push('/admin')">管理后台</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showFullChangelog = ref(false)

const toggleChangelog = () => {
  showFullChangelog.value = !showFullChangelog.value
}
</script>

<style scoped>
.guide-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 24px 16px;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header-with-back {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.back-icon {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: #0284c7;
  cursor: pointer;
  padding: 8px;
  z-index: 10;
}

.header-text {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header h1 {
  font-size: 24px;
  font-weight: 800;
  color: #0c4a6e;
  margin: 0 0 8px 0;
}

.header p {
  font-size: 14px;
  color: #0284c7;
  margin: 0;
}

.content-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);
}

.content-card h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 16px 0;
}

.feature-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: #0c4a6e;
  margin: 16px 0 8px 0;
}

.feature-section h3:first-child {
  margin-top: 0;
}

.feature-section ol,
.feature-section ul {
  margin: 8px 0;
  padding-left: 20px;
  color: #4b5563;
}

.feature-section li {
  font-size: 14px;
  line-height: 1.8;
  margin: 4px 0;
}

.feature-section p {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  margin: 8px 0;
}

.steps {
  padding: 8px 0;
}

.step {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.step:last-child {
  margin-bottom: 0;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.step-desc {
  font-size: 13px;
  color: #6B7280;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.faq-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
  border-left: 3px solid #0ea5e9;
}

.faq-question {
  font-size: 14px;
  font-weight: 600;
  color: #0c4a6e;
  margin-bottom: 8px;
}

.faq-answer {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
}

.footer-card {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  margin-top: 24px;
}

.footer-card p {
  font-size: 14px;
  color: #0c4a6e;
  margin: 8px 0;
}

.copyright {
  font-size: 12px;
  opacity: 0.8;
}

.admin-link {
  font-size: 11px;
  color: rgba(12, 74, 110, 0.3);
  margin-top: 8px;
  cursor: pointer;
}

.admin-link:hover {
  color: rgba(12, 74, 110, 0.6);
}

.van-alert {
  margin-top: 12px;
}

.changelog-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 12px;
  border-left: 3px solid #0ea5e9;
}

.changelog-item:last-child {
  margin-bottom: 0;
}

.changelog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 4px 0;
}

.expand-icon {
  font-size: 16px;
  color: #0ea5e9;
  transition: transform 0.3s;
}

.changelog-version {
  font-size: 14px;
  font-weight: 700;
  color: #0c4a6e;
}

.changelog-item ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.changelog-item.more {
  border-left-color: #9ca3af;
  background: #f3f4f6;
}

.changelog-item li {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.8;
  margin: 4px 0;
}

.changelog-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
  font-size: 13px;
  color: #0ea5e9;
  cursor: pointer;
  background: #f0f9ff;
  border-radius: 8px;
  margin-top: 8px;
}

.changelog-toggle:active {
  background: #e0f2fe;
}
</style>

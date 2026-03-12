<template>
  <div class="support-page">
    <div class="header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-text">
          <h1>💖 支持我们</h1>
          <p>如果这个网站对你有帮助，欢迎赞助支持！</p>
        </div>
      </div>
    </div>

    <!-- 赞助等级 -->
    <div class="content-card">
      <h2>赞助等级</h2>
      <div class="support-levels">
        <div class="level-card" @click="selectAmount(5)">
          <div class="level-icon" style="background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);">
            💝
          </div>
          <div class="level-info">
            <div class="level-name">赞助者</div>
            <div class="level-amount">¥5</div>
            <div class="level-desc">赞助者名单展示 + 感谢</div>
          </div>
        </div>

        <div class="level-card" @click="selectAmount(15)">
          <div class="level-icon" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);">
            🌟
          </div>
          <div class="level-info">
            <div class="level-name">VIP</div>
            <div class="level-amount">¥15/月</div>
            <div class="level-desc">VIP 标识 + 每日点评 5 次</div>
          </div>
        </div>

        <div class="level-card" @click="selectAmount(25)">
          <div class="level-icon" style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);">
            👑
          </div>
          <div class="level-info">
            <div class="level-name">学期 VIP</div>
            <div class="level-amount">¥25/学期</div>
            <div class="level-desc">VIP 标识 + 每日点评 5 次</div>
          </div>
        </div>

        <div class="level-card mvip" @click="selectAmount(6)">
          <div class="level-icon" style="background: linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%);">
            ⭐
          </div>
          <div class="level-info">
            <div class="level-name">MVIP</div>
            <div class="level-amount">¥6/周</div>
            <div class="level-desc">MVIP 标识 + 每日点评 8 次 + 自定义称号</div>
          </div>
        </div>

        <div class="level-card" @click="selectAmount(30)">
          <div class="level-icon" style="background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%);">
            🏆
          </div>
          <div class="level-info">
            <div class="level-name">SVIP</div>
            <div class="level-amount">¥30/季</div>
            <div class="level-desc">SVIP 标识 + 每日点评 10 次 + 专属客服 + 自定义称号</div>
          </div>
        </div>
      </div>
    </div>

    <!-- VIP 特权对比 -->
    <div class="content-card">
      <h2>VIP 特权</h2>
      <div class="vip-compare">
        <div class="compare-row">
          <span class="compare-label">特权</span>
          <span class="compare-item">普通用户</span>
          <span class="compare-item vip">VIP 用户</span>
          <span class="compare-item mvip">MVIP 用户</span>
          <span class="compare-item svip">SVIP 用户</span>
        </div>
        <div class="compare-row">
          <span class="compare-label">每日点评</span>
          <span class="compare-item">3 人</span>
          <span class="compare-item vip">5 人 ✓</span>
          <span class="compare-item mvip">8 人 ✓</span>
          <span class="compare-item svip">10 人 ✓</span>
        </div>
        <div class="compare-row">
          <span class="compare-label">榜单展示</span>
          <span class="compare-item">无</span>
          <span class="compare-item vip">赞助者名单 ✓</span>
          <span class="compare-item mvip">优先展示 ✓</span>
          <span class="compare-item svip">专属展示 ✓</span>
        </div>
        <div class="compare-row">
          <span class="compare-label">客服支持</span>
          <span class="compare-item">普通</span>
          <span class="compare-item vip">优先响应 ✓</span>
          <span class="compare-item mvip">专属通道 ✓</span>
          <span class="compare-item svip">专属客服 ✓</span>
        </div>
        <div class="compare-row">
          <span class="compare-label">自定义称号</span>
          <span class="compare-item">无</span>
          <span class="compare-item vip">-</span>
          <span class="compare-item mvip">支持 ✓</span>
          <span class="compare-item svip">支持 ✓</span>
        </div>
      </div>
    </div>

    <!-- 赞助流程 -->
    <div class="content-card">
      <h2>赞助流程</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">选择赞助金额</div>
            <div class="step-desc">点击上方任意赞助等级</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-title">扫码添加微信</div>
            <div class="step-desc">扫描下方管理员微信二维码</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-title">等待审核</div>
            <div class="step-desc">管理员将在 24 小时内审核开通</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 微信二维码 -->
    <div class="content-card qr-card">
      <h2>管理员微信</h2>
      <div class="qr-wrapper">
        <div class="qr-placeholder">
          <van-image width="160" height="160" src="/p/mmqrcode1773130201157.png" />
          <p>微信号：SiNianNiQWQ</p>
          <p class="hint">添加好友后转账并备注"山信赞助"</p>
        </div>
      </div>
    </div>

    <!-- 赞助者名单 -->
    <div class="content-card">
      <h2>🏆 赞助者名单</h2>
      <div v-if="loading" class="loading-state">
        <van-loading color="#E11D48">加载中...</van-loading>
      </div>
      <div v-else-if="supporters.length === 0" class="empty-state">
        <van-empty description="暂无赞助者，成为第一位吧！" />
      </div>
      <div v-else class="supporter-list">
        <div
          v-for="item in supporters"
          :key="item.id"
          class="supporter-item"
        >
          <div class="supporter-avatar">
            <van-image round width="40" height="40" :src="item.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIwIDIxdi0yYTQgNCAwIDAgMC00LTRIOGE0IDQgMCAwIDAtNCA0djIiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiLz48L3N2Zz4='"/>
          </div>
          <div class="supporter-info">
            <div class="supporter-name">{{ item.sponsorName || item.nickname || '匿名用户' }}</div>
            <div class="supporter-meta">
              <span class="amount">💰 ¥{{ item.amount }}</span>
              <span v-if="item.message" class="message">{{ item.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import http from '../api/http'

const form = ref({
  amount: '',
  message: '',
  wechat: ''
})

const supporters = ref<any[]>([])
const loading = ref(true)

const selectAmount = (amount: number) => {
  form.value.amount = amount.toString()
  showToast(`已选择 ¥${amount} 赞助档位`)
}

const onSubmit = async () => {
  if (!form.value.amount || Number(form.value.amount) < 1) {
    showToast('赞助金额至少 ¥1')
    return
  }

  try {
    const { data } = await http.post('/api/support/submit', form.value)
    if (data.success) {
      showToast('提交成功！管理员将在 24 小时内处理')
      form.value = { amount: '', message: '', wechat: '' }
    } else {
      showToast(data.message || '提交失败')
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      showToast('请先登录')
    } else {
      showToast('提交失败，请稍后重试')
    }
  }
}

const loadSupporters = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/api/support/supporters')
    if (data.success) {
      supporters.value = data.supporters || []
    }
  } catch (e) {
    console.error('加载赞助者名单失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSupporters()
})
</script>

<style scoped>
.support-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%);
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
  color: #881337;
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
  color: #881337;
  margin: 0 0 8px 0;
}

.header p {
  font-size: 14px;
  color: #9F1239;
  margin: 0;
}

.content-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(225, 29, 72, 0.08);
}

.content-card h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 16px 0;
}

.support-levels {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.level-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #f9fafb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  max-width: 100%;
}

.level-card:active {
  transform: scale(0.98);
  background: #f3f4f6;
}

.level-card.selected {
  border-color: #E11D48;
  background: #FFF1F2;
}

.level-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.level-info {
  flex: 1;
  min-width: 0;
}

.level-name {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.level-amount {
  font-size: 16px;
  font-weight: 700;
  color: #E11D48;
  margin: 2px 0;
}

.level-desc {
  font-size: 11px;
  color: #6B7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vip-compare {
  overflow-x: auto;
}

.compare-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  gap: 8px;
}

.compare-row:last-child {
  border-bottom: none;
}

.compare-label {
  font-weight: 500;
  color: #1F2937;
}

.compare-item {
  text-align: center;
  color: #6B7280;
}

.compare-item.vip {
  color: #059669;
  font-weight: 500;
}

.compare-item.mvip {
  color: #7c3aed;
  font-weight: 600;
}

.compare-item.svip {
  color: #4f46e5;
  font-weight: 700;
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
  background: linear-gradient(135deg, #FB7185 0%, #E11D48 100%);
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

.qr-card {
  text-align: center;
}

.qr-wrapper {
  display: flex;
  justify-content: center;
}

.qr-placeholder {
  width: 200px;
  height: 200px;
  border-radius: 16px;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.qr-placeholder p {
  font-size: 14px;
  color: #374151;
  margin: 0;
}

.qr-placeholder .hint {
  font-size: 12px;
  color: #9CA3AF;
}

.submit-btn {
  margin-top: 16px;
}

.empty-state {
  padding: 40px 0;
}

.loading-state {
  padding: 40px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.supporter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.supporter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
}

.supporter-avatar {
  flex-shrink: 0;
}

.supporter-info {
  flex: 1;
}

.supporter-name {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.supporter-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
}

.supporter-meta .amount {
  color: #E11D48;
  font-weight: 500;
}

.supporter-meta .message {
  color: #6B7280;
}
</style>

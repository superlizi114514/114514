<template>
  <div class="home-page">
    <!-- Welcome Dialog -->
    <van-dialog
      v-model:show="showWelcome"
      title="欢迎"
      confirm-button-text="好的"
      :show-confirm-button="true"
      :close-on-click-overlay="false"
    >
      <div class="welcome-content">
        <p>本榜单绝不掺假 请把网站介绍给你的朋友 这是对我最大的支持 谢谢您</p>
        <p class="signature">---lizistudio</p>
      </div>
    </van-dialog>

    <!-- Header -->
    <div class="header">
      <h1 class="app-title">山信黑红榜</h1>
      <p class="app-subtitle">山东信院学生的真实点评社区</p>
      <div v-if="isLoggedIn" class="campus-selector-top" @click="showCampusPicker = true">
        <van-icon name="location-o" />
        <span>{{ selectedCampus || '选择校区' }}</span>
        <van-icon name="arrow" />
      </div>
    </div>

    <!-- 公告栏 -->
    <div class="notice-bar">
      <van-notice-bar
        left-icon="volume-o"
        text="严禁开小号刷票，被发现直接 ban 掉 | 拉新活动：拉 2 名好友且都真实点评后提供 UID，送 5 天 VIP，联系管理微信直接领取"
        mode="closable"
        :scrollable="true"
      />
    </div>

    <!-- Main Navigation Grid -->
    <div class="nav-grid">
      <!-- 立马点评 -->
      <div class="nav-card profile-card" @click="$router.push('/profiles')">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="nav-content">
          <h3>立马点评</h3>
          <p>添加人员并点评</p>
        </div>
        <div class="nav-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- 人员榜单 -->
      <div class="nav-card ranking-card" @click="$router.push('/rankings/profile')">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9V2h12v7"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <path d="M6 14h12v8"/>
          </svg>
        </div>
        <div class="nav-content">
          <h3>人员榜单</h3>
          <p>热门点评排行</p>
        </div>
        <div class="nav-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- 商家黑红榜 -->
      <div class="nav-card merchant-card" @click="$router.push('/merchants')">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 4a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <div class="nav-content">
          <h3>商家黑红榜</h3>
          <p>校园周边商家点评</p>
        </div>
        <div class="nav-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- 商家榜单 -->
      <div class="nav-card ranking-card merchant-ranking-card" @click="$router.push('/rankings/merchant')">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 4a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <div class="nav-content">
          <h3>商家榜单</h3>
          <p>热门商家排行</p>
        </div>
        <div class="nav-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- 搜索 -->
      <div class="nav-card search-card" @click="$router.push('/search')">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <div class="nav-content">
          <h3>搜索</h3>
          <p>查找人员或商家</p>
        </div>
        <div class="nav-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- 山信兼职 -->
      <div class="nav-card part-time-card" @click="$router.push('/part-time-jobs')">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <div class="nav-content">
          <h3>山信兼职</h3>
          <p>校内兼职信息</p>
        </div>
        <div class="nav-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="nav-card guide-card" @click="$router.push('/guide')">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div class="nav-content">
          <h3>使用说明</h3>
          <p>功能介绍与指南</p>
        </div>
        <div class="nav-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- 关于作者 -->
      <div class="nav-card about-card" @click="$router.push('/about')">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="nav-content">
          <h3>关于作者</h3>
          <p>了解开发团队</p>
        </div>
        <div class="nav-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- 赞助支持 -->
      <div class="nav-card support-card" @click="$router.push('/support')">
        <div class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <div class="nav-content">
          <h3>赞助支持</h3>
          <p>帮助持续发展</p>
        </div>
        <div class="nav-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- User Status -->
    <div class="user-section">
      <div class="user-card" v-if="isLoggedIn">
        <div class="user-info">
          <div class="user-detail">
            <span class="user-email">{{ userEmail }}</span>
            <span class="user-uid">UID: {{ userId }}</span>
            <span class="remaining-quota">今日剩余票数：<span class="quota-number">{{ remaining }}/{{ dailyLimit }}</span></span>
            <div class="campus-selector" @click="showCampusPicker = true">
              <van-icon name="location-o" />
              <span>{{ selectedCampus || '选择校区' }}</span>
            </div>
            <div class="current-time">
              <van-icon name="clock-o" />
              <span>{{ currentTime }}</span>
            </div>
          </div>
          <div class="vip-info" v-if="isAdmin || isSvip || isMvip || isVip">
            <van-tag v-if="isAdmin" type="success" size="medium">管理员</van-tag>
            <van-tag v-else-if="isSvip" type="primary" size="medium">SVIP</van-tag>
            <van-tag v-else-if="isMvip" type="success" size="medium">MVIP</van-tag>
            <van-tag v-else-if="isVip" type="warning" size="medium">VIP</van-tag>
            <span v-if="vipExpireText" class="expire-text">{{ vipExpireText }}</span>
          </div>
        </div>
        <div class="user-actions">
          <van-button size="small" plain type="default" @click="$router.push('/settings')">设置</van-button>
          <van-button size="small" plain type="danger" @click="handleLogout">退出</van-button>
        </div>
      </div>
      <van-button v-else type="primary" block round @click="$router.push('/login')">
        邮箱登录
      </van-button>
    </div>

    <!-- Campus Picker -->
    <van-popup v-model:show="showCampusPicker" position="bottom">
      <van-picker
        title="选择校区"
        :columns="campusOptions"
        @confirm="onCampusConfirm"
        @cancel="showCampusPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onActivated } from 'vue'
import { showToast } from 'vant'
import http from '../api/http'

const isLoggedIn = ref(false)
const userEmail = ref('')
const userId = ref('')
const isAdmin = ref(false)
const isVip = ref(false)
const isSvip = ref(false)
const isMvip = ref(false)
const dailyLimit = ref(3)
const remaining = ref(0)
const showWelcome = ref(false)
const showCampusPicker = ref(false)
const selectedCampus = ref('')
const vipExpireText = ref('')
const campusOptions = ref([
  { text: '滨海校区', value: '滨海校区' },
  { text: '奎文校区', value: '奎文校区' }
])
const currentTime = ref('')

const checkLoginStatus = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    isLoggedIn.value = false
    return
  }

  try {
    // 调用 API 验证 token 有效性并获取用户信息
    const { data } = await http.get('/api/auth/me')
    if (data.success && data.user) {
      isLoggedIn.value = true
      userEmail.value = data.user.email || ''
      userId.value = data.user.id?.toString() || '-'
      isAdmin.value = data.user.email === 'admin@admin.admin'
      isSvip.value = data.user.isSvip || false
      isMvip.value = data.user.isMvip || false
      isVip.value = data.user.isVip || false
      dailyLimit.value = data.user.dailyLimit ?? 3
      remaining.value = data.user.remaining ?? 0

      // 计算 VIP 剩余时长
      const expireDate = data.user.svipExpire || data.user.vipExpire || data.user.mvipExpire
      if (expireDate && !data.user.isAdmin && (data.user.isSvip || data.user.isMvip || data.user.isVip)) {
        vipExpireText.value = formatExpireTime(expireDate)
      }

      // 保存用户信息到 localStorage
      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        isVip: data.user.isVip,
        isSvip: data.user.isSvip,
        isMvip: data.user.isMvip,
        isAdmin: data.user.email === 'admin@admin.admin',
        dailyLimit: data.user.dailyLimit,
        remaining: data.user.remaining
      }))
    } else {
      // Token 无效，清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      isLoggedIn.value = false
    }
  } catch (e: any) {
    // Token 无效或网络错误
    if (e.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      isLoggedIn.value = false
    }
  }
}

// 刷新票数（用于从点评页面返回时更新）
const refreshQuota = async () => {
  try {
    const { data } = await http.get('/api/auth/me')
    if (data.success && data.user) {
      remaining.value = data.user.remaining || 0
      dailyLimit.value = data.user.dailyLimit || 3
      isVip.value = data.user.isVip || false
      isSvip.value = data.user.isSvip || false
      isMvip.value = data.user.isMvip || false

      // 计算 VIP 剩余时长
      const expireDate = data.user.svipExpire || data.user.vipExpire || data.user.mvipExpire
      if (expireDate && !data.user.isAdmin && (data.user.isSvip || data.user.isMvip || data.user.isVip)) {
        vipExpireText.value = formatExpireTime(expireDate)
      }

      // 同时更新 localStorage
      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        isVip: data.user.isVip,
        isSvip: data.user.isSvip,
        isMvip: data.user.isMvip,
        isAdmin: data.user.email === 'admin@admin.admin',
        dailyLimit: data.user.dailyLimit,
        remaining: data.user.remaining
      }))
    }
  } catch {
    // 静默失败
  }
}

const showWelcomeDialog = () => {
  const hasShown = localStorage.getItem('welcomeShown')
  if (!hasShown) {
    showWelcome.value = true
    localStorage.setItem('welcomeShown', 'true')
  }
}

const onCampusConfirm = ({ selectedOptions }: { selectedOptions: any[] }) => {
  selectedCampus.value = selectedOptions[0]?.value
  localStorage.setItem('selectedCampus', selectedCampus.value)
  showCampusPicker.value = false
  showToast(`已选择 ${selectedCampus.value}`)
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  isLoggedIn.value = false
  userEmail.value = ''
  userId.value = ''
  isAdmin.value = false
  isVip.value = false
  isSvip.value = false
  isMvip.value = false
  showToast('已退出登录')
}

const formatExpireTime = (expireStr: string) => {
  const expire = new Date(expireStr).getTime()
  const now = Date.now()
  const diff = expire - now

  if (diff <= 0) {
    return '已过期'
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  if (days > 0) {
    return `剩余 ${days}天${remainingHours}小时`
  } else {
    return `剩余 ${hours}小时`
  }
}

// 更新当前时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}

onMounted(() => {
  checkLoginStatus()
  showWelcomeDialog()
  // 加载已选择的校区
  selectedCampus.value = localStorage.getItem('selectedCampus') || ''
  // 启动时间更新
  updateTime()
  setInterval(updateTime, 1000)
})

// 页面激活时刷新票数（从其他页面返回时）
onActivated(() => {
  refreshQuota()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%);
  padding: 16px 12px;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 16px;
}

.app-title {
  font-size: 22px;
  font-weight: 800;
  color: #881337;
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 12px;
  color: #9F1239;
  margin: 0;
  opacity: 0.8;
}

.notice-bar {
  margin-bottom: 12px;
}

.campus-selector {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 12px;
  margin-top: 4px;
  cursor: pointer;
  border: 1px solid rgba(251, 113, 133, 0.1);
}

.campus-selector span {
  font-size: 11px;
  color: #374151;
  font-weight: 500;
}

.campus-selector .van-icon {
  color: #E11D48;
  font-size: 12px;
}

/* Navigation Grid */
.nav-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.nav-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.08);
  border: 1px solid rgba(251, 113, 133, 0.1);
}

.nav-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(225, 29, 72, 0.12);
}

/* Icon Styles */
.nav-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-card .nav-icon {
  background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
  color: #DB2777;
}

.merchant-card .nav-icon {
  background: linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%);
  color: #E11D48;
}

.search-card .nav-icon {
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  color: #2563EB;
}

.part-time-card .nav-icon {
  background: linear-gradient(135deg, #ECFCCB 0%, #D9F99D 100%);
  color: #65A30D;
}

.ranking-card .nav-icon {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  color: #D97706;
}

.merchant-ranking-card .nav-icon {
  background: linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%);
  color: #E11D48;
}

.guide-card .nav-icon {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #059669;
}

.about-card .nav-icon {
  background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
  color: #DB2777;
}

.support-card .nav-icon {
  background: linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%);
  color: #E11D48;
}

.admin-card .nav-icon {
  background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%);
  color: #4F46E5;
}

.nav-icon .icon {
  width: 20px;
  height: 20px;
}

/* Content */
.nav-content {
  flex: 1;
  min-width: 0;
}

.nav-content h3 {
  font-size: 13px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-content p {
  font-size: 10px;
  color: #6B7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Arrow */
.nav-arrow {
  width: 20px;
  height: 20px;
  color: #9CA3AF;
  flex-shrink: 0;
}

.nav-arrow .arrow-icon {
  width: 100%;
  height: 100%;
}

/* User Section */
.user-section {
  margin-top: 12px;
}

.user-card {
  background: white;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.08);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.user-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-email {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.user-uid {
  font-size: 10px;
  color: #9CA3AF;
}

.remaining-quota {
  font-size: 11px;
  color: #059669;
  font-weight: 500;
}

.remaining-quota .quota-number {
  font-weight: 600;
  font-size: 12px;
}

.vip-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.expire-text {
  font-size: 11px;
  color: #EA580C;
  font-weight: 500;
}

.current-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #6B7280;
  margin-top: 4px;
}

.current-time .van-icon {
  font-size: 12px;
}

/* Welcome Dialog */
.welcome-content {
  padding: 12px 8px;
  text-align: center;
}

.welcome-content p {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.welcome-content .signature {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 12px;
  font-style: italic;
}
</style>

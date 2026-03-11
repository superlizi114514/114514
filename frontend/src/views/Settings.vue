<template>
  <div class="settings-page">
    <div class="header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-text">
          <h1>个人设置</h1>
          <p>管理您的个人信息和偏好设置</p>
        </div>
      </div>
    </div>

    <!-- 账号信息 -->
    <div class="content-card">
      <h2>📧 账号信息</h2>
      <div class="info-row">
        <span class="label">绑定邮箱</span>
        <span class="value">{{ userEmail }}</span>
      </div>
      <div class="info-row">
        <span class="label">用户 UID</span>
        <span class="value">{{ userId }}</span>
      </div>
      <div class="info-row">
        <span class="label">权限组</span>
        <div class="role-info">
          <van-tag :type="userRole === 'admin' ? 'danger' : userRole === 'vip' ? 'warning' : userRole === 'svip' ? 'primary' : 'primary'">
            {{ roleLabels[userRole] }}
          </van-tag>
          <span v-if="vipExpireText" class="expire-text">{{ vipExpireText }}</span>
        </div>
      </div>
    </div>

    <!-- 称号管理 -->
    <div class="content-card">
      <h2>🏷️ 称号管理</h2>
      <div class="title-section">
        <div class="title-row">
          <span class="label">当前称号</span>
          <span class="value">{{ currentTitle || '无' }}</span>
        </div>
        <div class="title-row">
          <span class="label">展示称号</span>
          <van-switch v-model="showTitle" size="20px" @change="onToggleTitleDisplay" />
        </div>
        <div class="title-hint">
          <van-icon name="info-o" />
          <span>开启后他人可在点评中看到你的称号</span>
        </div>
        <div v-if="availableTitles.length > 0" class="title-selector">
          <div class="selector-label">选择称号</div>
          <van-cell-group inset>
            <van-cell
              v-for="(title, index) in displayedTitles"
              :key="title"
              :title="title"
              clickable
              @click="selectTitle(title)"
            >
              <template #right-icon>
                <van-icon v-if="title === currentTitle" name="checked" color="#1989fa" />
              </template>
            </van-cell>
          </van-cell-group>
          <div v-if="availableTitles.length > 3" class="expand-toggle" @click="toggleExpand">
            <span>{{ isExpanded ? '收起' : '展开全部' }}</span>
            <van-icon :name="isExpanded ? 'up' : 'down'" />
          </div>
        </div>
      </div>
    </div>

    <!-- 昵称设置 -->
    <div class="content-card">
      <h2>👤 昵称设置</h2>
      <van-form @submit="updateNickname">
        <van-field
          v-model="nickname"
          label="昵称"
          placeholder="请输入您的昵称"
          clearable
        />
        <div class="hint">
          <van-icon name="info-o" />
          <span>方便自我搜索</span>
        </div>
        <van-button round block type="primary" native-type="submit" :loading="updating">
          {{ updating ? '保存中...' : '保存昵称' }}
        </van-button>
      </van-form>
    </div>

    <!-- 更改密码 -->
    <div class="content-card">
      <h2>🔐 更改密码</h2>
      <van-form @submit="changePassword">
        <van-field
          v-model="oldPassword"
          type="password"
          label="原密码"
          placeholder="请输入原密码"
          clearable
          :rules="[{ required: true, message: '请输入原密码' }]"
        />
        <van-field
          v-model="newPassword"
          type="password"
          label="新密码"
          placeholder="请输入新密码（至少 6 位）"
          clearable
          :rules="[{ required: true, message: '请输入新密码' }, { pattern: /^.{6,}$/, message: '密码至少 6 位' }]"
        />
        <van-field
          v-model="confirmNewPassword"
          type="password"
          label="确认密码"
          placeholder="请再次输入新密码"
          clearable
          :rules="[{ required: true, message: '请确认新密码' }]"
        />
        <van-button round block type="primary" native-type="submit" :loading="changingPassword">
          {{ changingPassword ? '更改中...' : '更改密码' }}
        </van-button>
      </van-form>
    </div>

    <!-- 搜索自己 -->
    <div class="content-card">
      <h2>🔍 搜索自己</h2>
      <div v-if="searchResultLoaded" class="search-result">
        <div v-if="searchResults.length === 0" class="empty-state">
          <van-empty description="暂无他人对我的点评" />
        </div>
        <div v-else class="review-list">
          <div v-for="item in searchResults" :key="item.id" class="review-item">
            <van-tag :type="item.type === 'red' ? 'danger' : 'warning'">
              {{ item.type === 'red' ? '红榜' : '黑榜' }}
            </van-tag>
            <span class="review-content">{{ item.content }}</span>
            <span class="review-time">{{ formatDate(item.createdAt) }}</span>
          </div>
        </div>
      </div>
      <van-button v-else plain block type="default" @click="searchSelf">
        查看他人对我的点评
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { showToast } from 'vant'
import http from '../api/http'
import { useRouter } from 'vue-router'

const router = useRouter()
const userEmail = ref('')
const userId = ref('')
const userRole = ref('student')
const nickname = ref('')
const updating = ref(false)
const searchResults = ref<any[]>([])
const searchResultLoaded = ref(false)
const vipExpireText = ref('')

// 称号管理相关
const currentTitle = ref('')
const showTitle = ref(false)
const availableTitles = ref<string[]>([])
const isExpanded = ref(false)

// 显示的称号列表（默认只显示前 3 个）
const displayedTitles = computed(() => {
  if (isExpanded.value) {
    return availableTitles.value
  }
  return availableTitles.value.slice(0, 3)
})

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// 更改密码相关
const oldPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const changingPassword = ref(false)

const roleLabels: Record<string, string> = {
  student: '学生',
  vip: 'VIP',
  svip: 'SVIP',
  mvip: 'MVIP',
  merchant: '商户',
  teacher: '老师',
  admin: '管理员'
}

const checkLoginStatus = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    return
  }

  try {
    const { data } = await http.get('/api/auth/me')
    if (data.success && data.user) {
      userEmail.value = data.user.email || ''
      userId.value = data.user.id?.toString() || '-'
      nickname.value = data.user.nickname || ''

      // 判断角色
      if (data.user.email === 'admin@admin.admin') {
        userRole.value = 'admin'
      } else if (data.user.isSvip) {
        userRole.value = 'svip'
      } else if (data.user.isMvip) {
        userRole.value = 'mvip'
      } else if (data.user.isVip) {
        userRole.value = 'vip'
      } else {
        userRole.value = 'student'
      }

      // 计算 VIP 剩余时长
      const expireDate = data.user.svipExpire || data.user.vipExpire || data.user.mvipExpire
      if (expireDate && userRole.value !== 'student' && userRole.value !== 'admin') {
        vipExpireText.value = formatExpireTime(expireDate)
      }

      // 加载称号信息
      currentTitle.value = data.user.title || ''
      showTitle.value = data.user.showTitle === 1
      loadAvailableTitles()
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }
}

// 加载可用称号列表
const loadAvailableTitles = async () => {
  try {
    const { data } = await http.get('/api/settings/available-titles')
    if (data.success) {
      availableTitles.value = data.titles || []
    }
  } catch (e) {
    console.error('加载可用称号失败', e)
  }
}

// 选择称号
const selectTitle = async (title: string) => {
  try {
    const { data } = await http.post('/api/settings/set-title', { title })
    if (data.success) {
      currentTitle.value = title
      showToast('称号已更新')
      loadAvailableTitles()
    } else {
      showToast(data.message || '更新失败')
    }
  } catch {
    showToast('更新失败，请重试')
  }
}

// 切换称号显示状态
const onToggleTitleDisplay = async () => {
  try {
    const { data } = await http.post('/api/settings/toggle-title-display', {
      showTitle: showTitle.value
    })
    if (data.success) {
      showToast(showTitle.value ? '已开启称号展示' : '已关闭称号展示')
    } else {
      showTitle.value = !showTitle.value
      showToast(data.message || '操作失败')
    }
  } catch {
    showTitle.value = !showTitle.value
    showToast('操作失败，请重试')
  }
}

const updateNickname = async () => {
  if (!nickname.value?.trim()) {
    showToast('昵称不能为空')
    return
  }

  updating.value = true
  try {
    const { data } = await http.post('/api/settings/nickname', {
      nickname: nickname.value.trim()
    })
    if (data.success) {
      showToast('昵称已更新')
      // 更新本地用户信息
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        user.nickname = nickname.value
        localStorage.setItem('user', JSON.stringify(user))
      }
    } else {
      showToast(data.message || '更新失败')
    }
  } catch {
    showToast('更新失败，请稍后重试')
  } finally {
    updating.value = false
  }
}

const changePassword = async () => {
  if (!oldPassword.value) {
    showToast('请输入原密码')
    return
  }
  if (!newPassword.value || newPassword.value.length < 6) {
    showToast('新密码至少 6 位')
    return
  }
  if (newPassword.value !== confirmNewPassword.value) {
    showToast('两次输入的新密码不一致')
    return
  }

  changingPassword.value = true
  try {
    const { data } = await http.post('/api/auth/change-password', {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
      confirmNewPassword: confirmNewPassword.value
    })
    if (data.success) {
      showToast('密码已更新')
      // 清空密码字段
      oldPassword.value = ''
      newPassword.value = ''
      confirmNewPassword.value = ''
    } else {
      showToast(data.message || '更改失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '更改失败，请重试')
  } finally {
    changingPassword.value = false
  }
}

const searchSelf = async () => {
  if (!nickname.value) {
    showToast('请先设置昵称')
    return
  }

  try {
    const { data } = await http.get('/api/search', {
      params: {
        keyword: nickname.value.trim(),
        sort: 'latest'
      }
    })

    if (data.success) {
      // 合并人员和商家的点评
      const allReviews: any[] = []

      // 获取人员的点评
      if (data.data.profiles && data.data.profiles.length > 0) {
        for (const profile of data.data.profiles) {
          const { data: reviewData } = await http.get(`/api/profiles/${profile.id}/reviews`)
          if (reviewData.success && reviewData.data) {
            reviewData.data.forEach((review: any) => {
              allReviews.push({
                id: review.id,
                type: review.type,
                content: review.content,
                createdAt: review.createdAt,
                targetName: profile.name
              })
            })
          }
        }
      }

      searchResults.value = allReviews.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      searchResultLoaded.value = true
    } else {
      showToast(data.message || '搜索失败')
    }
  } catch {
    showToast('搜索失败，请重试')
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
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

onMounted(() => {
  checkLoginStatus()
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
  padding: 16px 12px;
}

.header {
  text-align: center;
  margin-bottom: 16px;
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
  color: #1e3a5f;
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
  font-size: 20px;
  font-weight: 800;
  color: #1e3a5f;
  margin: 0 0 6px 0;
}

.header p {
  font-size: 12px;
  color: #3b82f6;
  margin: 0;
}

.content-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
}

.content-card h2 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-size: 14px;
  color: #6b7280;
}

.info-row .value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.role-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expire-text {
  font-size: 12px;
  color: #EA580C;
  font-weight: 500;
}

/* 称号管理样式 */
.title-section {
  padding: 8px 0;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.title-row:last-child {
  border-bottom: none;
}

.title-row .label {
  font-size: 14px;
  color: #6b7280;
}

.title-row .value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.title-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
  margin: 12px 0;
}

.title-hint .van-icon {
  font-size: 12px;
}

.title-selector {
  margin-top: 16px;
}

.selector-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.expand-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 12px;
  color: #1989fa;
  font-size: 13px;
  cursor: pointer;
  margin-top: 8px;
}

.expand-toggle:active {
  opacity: 0.7;
}

.hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
  margin: 8px 0 16px 0;
}

.hint .van-icon {
  font-size: 12px;
}

.empty-state {
  padding: 30px 0;
}

.search-result {
  margin-top: 12px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
}

.review-content {
  flex: 1;
  min-width: 120px;
  font-size: 13px;
  color: #374151;
}

.review-target {
  font-size: 12px;
  color: #9ca3af;
}

.review-time {
  font-size: 11px;
  color: #9ca3af;
}

.tabs {
  margin-top: 8px;
}
</style>

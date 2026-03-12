<template>
  <div class="profiles-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-text">
          <h1 class="page-title">人员列表</h1>
          <p class="page-subtitle">添加并点评校园人员</p>
        </div>
      </div>
      <div class="quota-tip" v-if="isLoggedIn">
        <van-icon name="ticket" />
        <span>今日剩余额度：<strong>{{ remaining }}/{{ dailyLimit }}</strong> 次</span>
      </div>
    </div>

    <!-- Add Form Card -->
    <div class="form-card">
      <div class="form-header">
        <van-icon name="plus-circle-o" class="form-icon" />
        <span class="form-title">添加人员</span>
      </div>
      <van-form @submit="createProfile">
        <van-field
          v-model="form.name"
          label="姓名"
          placeholder="请输入姓名（必填）"
          :rules="[{ required: true, message: '请输入姓名' }]"
          clearable
        >
          <template #button>
            <van-button size="small" type="primary" @click="searchExistingProfile">
              查询
            </van-button>
          </template>
        </van-field>
        <!-- 显示已有人员信息 -->
        <div v-if="existingProfiles.length > 0" class="existing-profiles-tip">
          <van-icon name="info-o" class="tip-icon" />
          <span class="tip-text">名为 <strong>{{ form.name }}</strong> 的人员已存在，点击选择：</span>
          <div class="existing-list">
            <div
              v-for="(profile, index) in existingProfiles"
              :key="index"
              class="existing-item"
              @click="selectExistingProfile(index)"
            >
              <div class="existing-info">
                <span class="existing-name">{{ profile.name }}</span>
                <span v-if="profile.campus" class="existing-campus">{{ profile.campus }}</span>
                <span v-if="profile.className" class="existing-class">{{ profile.className }}</span>
                <span class="existing-id">ID: {{ profile.id }}</span>
              </div>
              <van-icon name="checked" class="check-icon" v-if="selectedExistingIndex === index" />
            </div>
          </div>
        </div>
        <van-field
          v-model="form.campus"
          label="校区"
          placeholder="请选择校区（可选）"
          readonly
          @click="showCampusPicker = true"
        />
        <div class="class-input-row">
          <van-field
            v-model="form.grade"
            label="年级"
            placeholder="25"
            type="number"
            maxlength="2"
            required
          />
          <span class="class-label">级</span>
          <van-field
            v-model="form.department"
            label="系"
            placeholder="电子"
            maxlength="4"
            tip="系名必填，前两个字即可"
            required
          />
          <span class="class-label">系</span>
        </div>
        <p class="class-tip">年级和系必填 · 年级填后两个年份即可，系填前两个字即可</p>
        <div class="submit-section">
          <van-button
            class="submit-btn"
            type="primary"
            block
            round
            native-type="submit"
            :loading="submitting"
          >
            {{ submitting ? '创建中...' : '添加人员' }}
          </van-button>
        </div>
      </van-form>
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

    <!-- Review Dialog -->
    <van-dialog
      v-model:show="showReviewDialog"
      title="立即点评"
      :show-confirm-button="false"
      :close-on-click-overlay="false"
    >
      <div class="review-dialog-content">
        <p class="review-hint">已成功添加 <strong>{{ newlyCreatedProfile?.name }}</strong> 到人员库</p>
        <p class="review-hint-sub">现在可以对他/她进行点评（也可跳过）</p>

        <div class="review-form">
          <div class="review-type-selector">
            <span class="type-label">点评类型：</span>
            <div class="type-options">
              <div
                :class="['type-option', 'red', reviewForm.type === 'red' ? 'active' : '']"
                @click="reviewForm.type = 'red'"
              >
                <van-icon name="star" /> 红榜
              </div>
              <div
                :class="['type-option', 'black', reviewForm.type === 'black' ? 'active' : '']"
                @click="reviewForm.type = 'black'"
              >
                <van-icon name="warning-o" /> 黑榜
              </div>
            </div>
          </div>
          <van-field
            v-model="reviewForm.content"
            rows="3"
            type="textarea"
            placeholder="请输入点评内容（必填）"
          />
          <div class="review-count-selector">
            <span class="count-label">点评次数：</span>
            <div class="count-buttons">
              <van-button
                v-for="n in 5"
                :key="n"
                size="small"
                :type="reviewForm.count === n ? 'primary' : 'default'"
                :disabled="!canSelectCount(n)"
                @click="reviewForm.count = n"
              >
                {{ n }}次
              </van-button>
              <van-button
                size="small"
                :type="reviewForm.count === 10 ? 'primary' : 'default'"
                :disabled="!canSelectCount(10)"
                @click="reviewForm.count = 10"
              >
                10 次
              </van-button>
            </div>
            <div v-if="remaining === 0" class="no-quota-tip">
              <van-icon name="warning-o" />
              <span>今日票数已用完，请明日再来</span>
            </div>
          </div>
          <div class="review-actions">
            <van-button plain type="default" block round @click="skipReview">跳过</van-button>
            <van-button type="primary" block round @click="submitReview" :loading="reviewSubmitting">
              {{ reviewSubmitting ? '提交中...' : `提交点评 (${reviewForm.count}次)` }}
            </van-button>
          </div>
        </div>
      </div>
    </van-dialog>

    <!-- List Section -->
    <div class="list-section">
      <div v-if="loading" class="loading-state">
        <van-loading color="#E11D48">加载中...</van-loading>
      </div>
      <div v-else>
        <div class="list-header">
          <van-icon name="friends-o" class="list-icon" />
          <span class="list-title">人员列表</span>
          <span class="list-count" v-if="list.length > 0">{{ list.length }} 人</span>
        </div>

        <div v-if="list.length === 0" class="empty-state">
          <van-empty description="暂无人员，点击上方表单添加" />
        </div>

        <div v-else class="list">
        <div
          v-for="item in list"
          :key="item.name"
          class="profile-card"
          @click="openProfile(item.name)"
        >
          <div class="profile-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="profile-content">
            <div class="profile-name">{{ item.name }}</div>
            <div class="profile-meta">
              <span v-if="item.campusDisplay || item.allCampuses?.length > 0" class="meta-item">
                <van-icon name="location-o" />
                {{ item.campusDisplay || item.allCampuses?.join('/') }}
              </span>
              <span v-if="item.classNameDisplay || item.allClassNames?.length > 0" class="meta-item">
                <van-icon name="cluster-o" />
                {{ item.classNameDisplay || item.allClassNames?.join('/') }}
              </span>
              <span v-if="!item.campusDisplay && !item.classNameDisplay && (!item.allCampuses || item.allCampuses.length === 0) && (!item.allClassNames || item.allClassNames.length === 0)" class="meta-placeholder">
                暂无详细信息
              </span>
            </div>
          </div>
          <div class="profile-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onActivated } from 'vue'
import { showToast, showDialog } from 'vant'
import http from '../api/http'
import { useRouter } from 'vue-router'

const router = useRouter()
const list = ref<any[]>([])
const loading = ref(false)
const isLoggedIn = ref(false)
const dailyLimit = ref(3)
const remaining = ref(0)
const form = ref<{ name: string; campus: string; grade: string; department: string }>({
  name: '',
  campus: localStorage.getItem('selectedCampus') || '',
  grade: '',
  department: ''
})
const submitting = ref(false)
const showReviewDialog = ref(false)
const newlyCreatedProfile = ref<any>(null)
const reviewForm = ref<{ type: 'red' | 'black'; content: string; count: number }>({
  type: 'red',
  content: '',
  count: 1
})

// 已有人员相关
const existingProfiles = ref<any[]>([])
const selectedExistingIndex = ref<number | null>(null)

// 查询已有人员
const searchExistingProfile = async () => {
  if (!form.value.name?.trim()) {
    showToast('请输入姓名')
    return
  }

  try {
    const { data } = await http.get(`/api/profiles/search/by-name?name=${form.value.name.trim()}`)
    if (data.success && data.data.count > 0) {
      existingProfiles.value = data.data.profiles || []
      selectedExistingIndex.value = null
      showToast(`找到 ${existingProfiles.value.length} 条记录`)
    } else {
      existingProfiles.value = []
      showToast('未找到同名人员')
    }
  } catch {
    existingProfiles.value = []
    showToast('查询失败')
  }
}

// 选择已有人员
const selectExistingProfile = (index: number) => {
  if (index >= 0 && existingProfiles.value[index]) {
    const profile = existingProfiles.value[index]
    selectedExistingIndex.value = index
    form.value.campus = profile.campus
    // 解析 className，如 "25 级电子系" -> grade="25", department="电子"
    if (profile.className) {
      const match = profile.className.match(/^(\d{2,4}) 级 ([\u4e00-\u9fa5]{2,4}) 系$/)
      if (match) {
        form.value.grade = match[1]
        form.value.department = match[2]
      }
    }
    showToast('已选择已有人员，可直接提交点评')
  }
}

// 计算当前可选择的票数（不能超过剩余额度）
const getAvailableVotes = () => {
  return Math.min(10, remaining.value)
}

// 检查是否可以选择某个次数
const canSelectCount = (n: number) => {
  return n <= remaining.value
}
const reviewSubmitting = ref(false)
const showCampusPicker = ref(false)
const campusOptions = ref([
  { text: '滨海校区', value: '滨海校区' },
  { text: '奎文校区', value: '奎文校区' }
])

const onCampusConfirm = ({ selectedOptions }: { selectedOptions: any[] }) => {
  form.value.campus = selectedOptions[0]?.value
  showCampusPicker.value = false
}

const load = async () => {
  loading.value = true
  try {
    // 并行加载列表和用户信息
    const [listRes, userRes] = await Promise.all([
      http.get('/api/profiles'),
      http.get('/api/auth/me')
    ])

    if (listRes.data.success) {
      list.value = listRes.data.data || []
    } else {
      showToast(listRes.data.message || '加载失败')
    }

    // 加载剩余额度
    if (userRes.data.success && userRes.data.user) {
      isLoggedIn.value = true
      remaining.value = userRes.data.user.remaining ?? 0
      dailyLimit.value = userRes.data.user.dailyLimit ?? 3
    } else {
      // 如果获取用户信息失败，设置为 0
      remaining.value = 0
      dailyLimit.value = 3
    }
  } catch (err: any) {
    showToast('加载失败，请重试')
    // 发生错误时也重置为默认值
    remaining.value = 0
    dailyLimit.value = 3
  } finally {
    loading.value = false
  }
}

// 刷新用户额度
const refreshUserQuota = async () => {
  try {
    const { data } = await http.get('/api/auth/me')
    if (data.success && data.user) {
      remaining.value = data.user.remaining ?? 0
      dailyLimit.value = data.user.dailyLimit ?? 3
    }
  } catch {
    // 静默失败
  }
}

const createProfile = async () => {
  if (!form.value.name?.trim()) {
    showToast('请输入姓名')
    return
  }

  // 如果选择了已有人员，直接弹出点评对话框
  if (selectedExistingIndex.value !== null && selectedExistingIndex.value >= 0 && existingProfiles.value[selectedExistingIndex.value]) {
    const profile = existingProfiles.value[selectedExistingIndex.value]
    newlyCreatedProfile.value = profile
    showReviewDialog.value = true
    return
  }

  // 验证：必须填写年级和系
  if (!form.value.grade?.trim()) {
    showToast('请输入年级')
    return
  }
  if (!form.value.department?.trim()) {
    showToast('请输入系')
    return
  }

  // 组合班级：年级 + 级 + 系名 + 系
  const className = `${form.value.grade.trim()}级${form.value.department.trim()}系`

  submitting.value = true
  try {
    const { data } = await http.post('/api/profiles', {
      name: form.value.name.trim(),
      campus: form.value.campus.trim() || null,
      className,
      isPublic: true
    })

    if (data.success) {
      newlyCreatedProfile.value = data.data
      showReviewDialog.value = true
      // 清空已有人员信息
      existingProfiles.value = []
      selectedExistingIndex.value = null
    } else {
      showToast(data.message || '创建失败')
    }
  } catch {
    showToast('创建失败，请重试')
  } finally {
    submitting.value = false
  }
}

const skipReview = () => {
  showReviewDialog.value = false
  form.value = { name: '', campus: null, grade: '', department: '' }
  newlyCreatedProfile.value = null
  existingProfiles.value = []
  selectedExistingIndex.value = null
  load()
  showToast('已跳过点评')
}

const submitReview = async () => {
  if (!reviewForm.value.content?.trim()) {
    showToast('请输入点评内容')
    return
  }

  if (!newlyCreatedProfile.value) {
    showToast('人员信息丢失，请重试')
    return
  }

  // 检查剩余票数
  if (reviewForm.value.count > remaining.value) {
    showToast(`票数不足，当前剩余${remaining.value}票`)
    return
  }

  reviewSubmitting.value = true
  try {
    const { data } = await http.post(`/api/profiles/${newlyCreatedProfile.value.id}/reviews`, {
      type: reviewForm.value.type,
      content: reviewForm.value.content.trim(),
      count: reviewForm.value.count
    })

    if (data.success) {
      showReviewDialog.value = false
      form.value = { name: '', campus: null, className: null }
      newlyCreatedProfile.value = null
      // 刷新额度和列表
      await refreshUserQuota()
      await load()
      showToast(`点评成功（${data.count || 1}次）`)
    } else {
      showToast(data.message || '点评失败')
    }
  } catch (err: any) {
    showToast(err?.response?.data?.message || '点评失败，请重试')
  } finally {
    reviewSubmitting.value = false
  }
}

const openProfile = (name: string) => {
  // 通过 name 访问人员详情页，不传 id
  router.push({ path: '/profiles/0', query: { name } })
}

onMounted(() => {
  load()
})

// 页面激活时刷新票数
onActivated(() => {
  load()
})
</script>

<style scoped>
.profiles-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%);
  padding: 16px 12px;
}

/* Page Header */
.page-header {
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

.page-title {
  font-size: 20px;
  font-weight: 800;
  color: #881337;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 12px;
  color: #9F1239;
  margin: 0;
  opacity: 0.8;
}

.quota-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #059669;
  background: #ECFDF5;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px solid #A7F3D0;
}

.quota-tip .van-icon {
  font-size: 16px;
}

.quota-tip strong {
  font-weight: 700;
  font-size: 14px;
}

/* Form Card */
.form-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 16px rgba(225, 29, 72, 0.08);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.form-icon {
  font-size: 20px;
  color: #E11D48;
}

.class-input-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.class-input-row .van-field {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.class-label {
  font-size: 13px;
  color: #666;
  padding: 0 4px;
}

.class-tip {
  font-size: 11px;
  color: #999;
  margin: 0 0 12px 16px;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

/* Existing Profiles Tip */
.existing-profiles-tip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: #FFF7ED;
  border-radius: 8px;
  border: 1px solid #FED7AA;
}

.existing-profiles-tip .tip-icon {
  font-size: 14px;
  color: #EA580C;
}

.existing-profiles-tip .tip-text {
  font-size: 13px;
  color: #9A3412;
}

.existing-profiles-tip .tip-text strong {
  color: #C2410C;
  font-weight: 600;
}

.existing-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.existing-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #FDBA74;
  cursor: pointer;
  transition: all 0.2s;
}

.existing-item:active {
  background: #FFEDD5;
  transform: scale(0.98);
}

.existing-item.selected {
  background: #DCFCE7;
  border-color: #22C55E;
}

.existing-item .check-icon {
  font-size: 16px;
  color: #22C55E;
  flex-shrink: 0;
}

.existing-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.existing-name {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.existing-campus {
  background: #DBEAFE;
  color: #1E40AF;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.existing-class {
  background: #FCE7F3;
  color: #9D174D;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.field-tip {
  font-size: 11px;
  color: #9CA3AF;
  margin-top: -12px;
  margin-bottom: 12px;
  padding-left: 16px;
}

.submit-section {
  margin-top: 16px;
}

.submit-btn {
  height: 44px;
  font-weight: 600;
  background: linear-gradient(135deg, #FB7185 0%, #E11D48 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);
}

/* List Section */
.list-section {
  background: white;
  border-radius: 20px;
  padding: 20px 16px;
  box-shadow: 0 4px 16px rgba(225, 29, 72, 0.08);
}

.list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.list-icon {
  font-size: 20px;
  color: #E11D48;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

.list-count {
  margin-left: auto;
  font-size: 12px;
  color: #6B7280;
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 12px;
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

/* Profile Card */
.list .profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  background: #fafafa;
  border-radius: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.profile-card:last-child {
  margin-bottom: 0;
}

.profile-card:active {
  background: #f3f4f6;
  transform: scale(0.99);
}

.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-avatar svg {
  width: 26px;
  height: 26px;
  color: #DB2777;
}

.profile-content {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #6B7280;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.meta-placeholder {
  color: #9CA3AF;
}

.profile-arrow {
  width: 20px;
  height: 20px;
  color: #9CA3AF;
  flex-shrink: 0;
}

.profile-arrow svg {
  width: 100%;
  height: 100%;
}

/* Review Dialog */
.review-dialog-content {
  padding: 16px;
  text-align: left;
}

.review-hint {
  font-size: 15px;
  color: #374151;
  margin: 0 0 4px 0;
  line-height: 1.5;
}

.review-hint strong {
  color: #E11D48;
  font-weight: 600;
}

.review-hint-sub {
  font-size: 13px;
  color: #6B7280;
  margin: 0 0 16px 0;
}

.review-form {
  margin-top: 16px;
}

.review-type-selector {
  margin-bottom: 12px;
}

.type-options {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.type-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
}

.type-option:active {
  transform: scale(0.98);
}

.type-option.red {
  border-color: #fda4af;
}

.type-option.red.active {
  background: linear-gradient(135deg, #fda4af 0%, #e11d48 100%);
  color: white;
  border-color: #e11d48;
}

.type-option.black {
  border-color: #fcd34d;
}

.type-option.black.active {
  background: linear-gradient(135deg, #fcd34d 0%, #d97706 100%);
  color: white;
  border-color: #d97706;
}

.type-option .van-icon {
  font-size: 16px;
}

.review-count-selector {
  margin-top: 12px;
  margin-bottom: 12px;
}

.count-label {
  font-size: 14px;
  color: #6B7280;
  display: block;
  margin-bottom: 8px;
}

.count-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.count-buttons .van-button {
  min-width: 50px;
  height: 32px;
  font-size: 13px;
  padding: 0 12px;
}

.count-buttons .van-button--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.no-quota-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
  padding: 10px;
  background: #FEF2F2;
  border-radius: 8px;
  font-size: 13px;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.no-quota-tip .van-icon {
  font-size: 16px;
}

.review-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.review-actions .van-button {
  flex: 1;
  height: 40px;
  font-weight: 600;
}

.review-actions .van-button--primary {
  background: linear-gradient(135deg, #FB7185 0%, #E11D48 100%);
  border: none;
}
</style>

<template>
  <div class="profile-reviews-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-content">
          <h1 class="page-title">人员点评</h1>
          <p class="page-subtitle">分享你的真实看法</p>
        </div>
      </div>

      <!-- 人员信息卡片 -->
      <div class="profile-info-card" v-if="profileInfo">
        <div class="profile-info-main">
          <div class="profile-name-large">{{ profileInfo.name }}</div>
          <!-- 年级和系显示在名字右边 -->
          <div class="profile-identity" v-if="profileInfo.allClassNames?.length > 0">
            <span class="identity-label">身份信息：</span>
            <span class="identity-value">{{ profileInfo.allClassNames.join(' / ') }}</span>
          </div>
          <div class="profile-identity" v-else>
            <span class="identity-value empty">未填写班级信息</span>
          </div>
        </div>
        <div class="profile-details" v-if="profileInfo.allCampuses?.length > 0">
          <div class="detail-item">
            <van-icon name="location-o" />
            <span>{{ profileInfo.allCampuses.join(' / ') }}</span>
          </div>
        </div>
        <div class="profile-stats">
          <span>累计点评：<strong>{{ profileInfo.reviewCount || 0 }}</strong> 次</span>
        </div>
      </div>

      <div class="quota-tip" v-if="isLoggedIn">
        <van-icon name="ticket" />
        <span>今日可点评：<strong>{{ remaining }}/{{ dailyLimit }}</strong> 人</span>
      </div>
      <div class="vote-rule-tip">
        <van-icon name="info-o" />
        <span>每次点评消耗 1 次机会。每天对同一目标的第一次点评算「大票」权重高，后续点评算「小票」权重低。</span>
      </div>
    </div>

    <!-- Review Form Card -->
    <div class="form-card" v-if="!isReadOnly">
      <div class="form-header">
        <van-icon name="edit" class="form-icon" />
        <span class="form-title">提交点评</span>
      </div>
      <van-form @submit="createReview">
        <div class="radio-group-wrapper">
          <span class="group-label">点评类型：</span>
          <van-radio-group v-model="form.type" direction="horizontal">
            <van-radio name="red" checked-color="#e11d48">
              <template #icon="props">
                <div :class="['custom-radio', props.checked ? 'checked-red' : '']">
                  <van-icon :name="props.checked ? 'checked' : 'circle'" />
                </div>
              </template>
              <span class="radio-label red-label">红榜</span>
            </van-radio>
            <van-radio name="black" checked-color="#dc2626">
              <template #icon="props">
                <div :class="['custom-radio', props.checked ? 'checked-black' : '']">
                  <van-icon :name="props.checked ? 'checked' : 'circle'" />
                </div>
              </template>
              <span class="radio-label black-label">黑榜</span>
            </van-radio>
          </van-radio-group>
        </div>

        <van-field
          v-model="form.content"
          label="点评内容"
          type="textarea"
          rows="4"
          placeholder="请写下你的真实评价（0-200 字，可为空）"
          maxlength="200"
          show-word-limit
        />

        <div class="vote-selector">
          <span class="vote-label">投票数：</span>
          <div class="vote-options">
            <van-button
              v-for="n in 10"
              :key="n"
              size="small"
              :type="form.count === n ? 'primary' : 'default'"
              @click="form.count = n"
            >
              {{ n }}票
            </van-button>
          </div>
          <p class="vote-tip">💡 说明：每次点评消耗 1 次机会。每天对同一目标的第一次点评算「大票」权重高，后续点评算「小票」权重低。</p>
        </div>

        <div class="submit-section">
          <van-button
            class="submit-btn"
            type="primary"
            block
            round
            native-type="submit"
            :loading="submitting"
          >
            {{ submitting ? '提交中...' : `提交点评（${form.count}票）` }}
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- Reviews List -->
    <div class="list-section">
      <div v-if="loading" class="loading-state">
        <van-loading color="#E11D48">加载中...</van-loading>
      </div>

      <div v-else-if="hasLoaded">
        <div class="search-tip" v-if="isReadOnly">
          <van-icon name="info-o" class="tip-icon" />
          <span class="tip-text">当前为搜索浏览模式，如需点评请前往 <router-link to="/profiles">立马点评</router-link> 页面</span>
        </div>
        <div class="list-header">
        <van-icon name="comment-circle-o" class="list-icon" />
        <span class="list-title">点评列表</span>
        <div class="list-actions" v-if="totalBigVotes !== undefined || totalSmallVotes !== undefined">
          <span class="total-votes">
            <van-icon name="star-o" class="votes-icon" />
            总票数：<span class="votes-number">{{ totalBigVotes || 0 }}大票 + {{ totalSmallVotes || 0 }}小票</span>
          </span>
        </div>
        <span class="list-count" v-if="list.length > 0">{{ list.length }} 条</span>
      </div>

      <div v-if="list.length === 0" class="empty-state">
        <van-empty description="暂无点评，快来抢沙发吧" />
      </div>

      <div v-else class="list">
        <div v-for="item in list" :key="item.id" class="review-card">
          <div class="review-header">
            <div class="review-type-wrapper">
              <van-tag :type="item.type === 'red' ? 'danger' : 'warning'">
                {{ item.type === 'red' ? '红榜' : '黑榜' }}
              </van-tag>
              <!-- 显示点评者的称号 -->
              <van-tag v-if="item.reviewerTitle" type="primary" size="medium" class="title-tag">
                {{ item.reviewerTitle }}
              </van-tag>
            </div>
            <span class="review-meta">匿名发布</span>
          </div>
          <div class="review-content">
            {{ item.content }}
          </div>
          <div class="review-footer">
            <span class="review-time">{{ formatDate(item.createdAt) }}</span>
            <van-button
              class="report-btn"
              size="mini"
              plain
              icon="warning-o"
              @click="report(item.id)"
            >
              举报
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import http from '../api/http'

const route = useRoute()
// 支持通过 id 或 name 访问
const profileId = Number(route.params.id)
const profileName = String(route.query.name || '')
// 判断是否为只读模式：从搜索、榜单或人员列表点击过来时只读（不能直接点评，因为人员列表点击过来的需要去 Profiles 页面添加）
const isReadOnly = computed(() =>
  route.query.fromSearch === 'true' ||
  route.query.fromRanking === 'true' ||
  (profileName && !profileId) // 从人员列表点击过来（只传了 name）
)
const isLoggedIn = ref(false)
const remaining = ref(0)
const dailyLimit = ref(3)

const list = ref<any[]>([])
const totalBigVotes = ref<number>(0)
const totalSmallVotes = ref<number>(0)
const form = ref({ type: 'red', content: '', count: 1 })
const submitting = ref(false)
const loading = ref(true)
const hasLoaded = ref(false)

// 人员信息（包含所有班级和校区）
const profileInfo = ref<{
  name: string
  allClassNames: string[]
  allCampuses: string[]
  reviewCount: number
  ids?: number[]
} | null>(null)

const load = async () => {
  loading.value = true
  try {
    let reviewsRes: any
    let profileRes: any

    // 如果是通过 name 访问（从人员列表点击同名人员）
    if (profileName && !profileId) {
      // 先通过 name 搜索获取所有同名人员信息
      profileRes = await http.get(`/api/profiles/search/by-name?name=${profileName}`)
      if (profileRes.data.success && profileRes.data.data.ids?.length > 0) {
        // 获取所有同名人员的点评（并行请求）
        const reviewPromises = profileRes.data.data.ids.map((id: number) =>
          http.get(`/api/profiles/${id}/reviews`)
        )
        const reviewResults = await Promise.all(reviewPromises)

        // 合并所有点评
        const allReviews: any[] = []
        reviewResults.forEach(res => {
          if (res.data.success && res.data.data) {
            allReviews.push(...res.data.data)
          }
        })

        // 按时间排序
        allReviews.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

        reviewsRes = { data: { success: true, data: allReviews } }
      } else {
        reviewsRes = { data: { success: true, data: [] } }
      }
    } else {
      // 通过 id 访问（从榜单或搜索进入）
      reviewsRes = await http.get(`/api/profiles/${profileId}/reviews`)
      profileRes = await http.get(`/api/profiles/search/by-name?name=${route.query.name || ''}`)
    }

    if (reviewsRes.data.success) {
      list.value = reviewsRes.data.data || []

      // 计算总票数
      let bigVotes = 0
      let smallVotes = 0
      list.value.forEach(item => {
        bigVotes += item.bigVotes || 0
        smallVotes += item.smallVotes || 0
      })
      totalBigVotes.value = bigVotes
      totalSmallVotes.value = smallVotes
    } else {
      showToast(reviewsRes.data.message || '加载失败')
    }

    // 加载人员信息（包含所有班级和校区）
    if (profileRes.data.success) {
      profileInfo.value = {
        name: profileRes.data.data.name,
        allClassNames: profileRes.data.data.allClassNames || [],
        allCampuses: profileRes.data.data.allCampuses || [],
        reviewCount: profileRes.data.data.count || 1,
        ids: profileRes.data.data.ids || []
      }
    }

    // 加载剩余额度
    const { data: userData } = await http.get('/api/auth/me')
    if (userData.success && userData.user) {
      remaining.value = userData.user.remaining ?? 0
      dailyLimit.value = userData.user.dailyLimit ?? 3
      console.log('[load] remaining:', remaining.value, 'dailyLimit:', dailyLimit.value)
    }
  } catch (err: any) {
    console.error('加载失败:', err)
    showToast('加载失败，请重试')
  } finally {
    hasLoaded.value = true
    loading.value = false
  }
}

const createReview = async () => {
  const totalVotes = form.value.count
  if (totalVotes < 1) {
    showToast('请选择投票数')
    return
  }
  if (totalVotes > 10) {
    showToast('最多 10 票')
    return
  }

  // 确定要点评的人员 id
  let targetId = profileId
  if (!targetId && profileInfo.value?.ids?.length > 0) {
    // 通过 name 访问时，使用第一个 id
    targetId = profileInfo.value.ids[0]
  }
  if (!targetId) {
    showToast('人员信息不存在')
    return
  }

  submitting.value = true
  try {
    const { data } = await http.post(`/api/profiles/${targetId}/reviews`, {
      type: form.value.type,
      content: form.value.content,
      count: totalVotes
    })

    if (data.success) {
      showToast(`点评已提交（${data.bigVotes || 0}大票 + ${data.smallVotes || 0}小票）`)
      form.value.content = ''
      form.value.count = 1
      // 刷新列表和额度
      await load()
      // 额外刷新一次用户额度，确保显示最新
      await loadUserQuota()
    } else {
      showToast(data.message || '提交失败')
    }
  } catch (e: any) {
    console.error('点评提交失败:', e)
    const errorMsg = e.response?.data?.message || '提交失败，请重试'
    showToast(errorMsg)
  } finally {
    submitting.value = false
  }
}

// 加载用户剩余额度
const loadUserQuota = async () => {
  try {
    const { data } = await http.get('/api/auth/me')
    if (data.success && data.user) {
      remaining.value = data.user.remaining ?? 0
      dailyLimit.value = data.user.dailyLimit ?? 3
      console.log('[loadUserQuota] remaining:', remaining.value, 'dailyLimit:', dailyLimit.value)
    }
  } catch (e: any) {
    console.error('加载用户额度失败:', e)
  }
}

const report = async (reviewId: number) => {
  try {
    // 使用 showInputDialog 替代 window.prompt，兼容 iOS
    const { showInputDialog } = await import('vant')

    const reason = await showInputDialog({
      title: '举报点评',
      placeholder: '请输入举报原因',
      type: 'textarea',
      cancelButtonText: '取消',
      confirmButtonText: '提交'
    })

    if (!reason || !reason.trim()) {
      return
    }

    const { data } = await http.post('/api/reports/profile', {
      reviewId,
      reason: reason.trim()
    })

    if (data.success) {
      showToast('举报已提交')
    } else {
      showToast(data.message || '提交失败')
    }
  } catch (e: any) {
    if (e.message !== '取消') {
      showToast('提交失败，请重试')
    }
  }
}

const formatDate = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

onMounted(load)
</script>

<style scoped>
.profile-reviews-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%);
  padding: 24px 16px;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: 20px;
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

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #881337;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #9F1239;
  margin: 0;
  opacity: 0.8;
}

/* Profile Info Card */
.profile-info-card {
  background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
  border: 1px solid #F9A8D4;
}

.profile-info-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.profile-name-large {
  font-size: 18px;
  font-weight: 700;
  color: #881337;
}

.profile-identity {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #9F1239;
  background: rgba(255, 255, 255, 0.6);
  padding: 6px 12px;
  border-radius: 8px;
}

.identity-label {
  font-weight: 500;
  opacity: 0.8;
}

.identity-value {
  font-weight: 600;
  color: #881337;
}

.identity-value.empty {
  color: #9CA3AF;
  font-weight: 400;
}

.profile-details {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9F1239;
}

.detail-item .van-icon {
  font-size: 14px;
}

.profile-stats {
  text-align: center;
  font-size: 12px;
  color: #9F1239;
  opacity: 0.8;
}

.profile-stats strong {
  color: #881337;
  font-weight: 600;
}

.vote-rule-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #DC2626;
  background: #FEF2F2;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px solid #FECACA;
}

.vote-rule-tip .van-icon {
  font-size: 14px;
}

/* Form Card */
.form-card {
  background: white;
  border-radius: 20px;
  padding: 20px 16px;
  margin-bottom: 16px;
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

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

/* Radio Group */
.radio-group-wrapper {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
}

.group-label {
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 8px;
  display: block;
}

.radio-label {
  font-size: 14px;
  margin-left: 4px;
}

.red-label {
  color: #E11D48;
  font-weight: 500;
}

.black-label {
  color: #DC2626;
  font-weight: 500;
}

.custom-radio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  transition: all 0.2s;
}

.custom-radio.checked-red {
  background: #E11D48;
  border-color: #E11D48;
  color: white;
}

.custom-radio.checked-black {
  background: #DC2626;
  border-color: #DC2626;
  color: white;
}

.custom-radio .van-icon {
  font-size: 14px;
}

/* Vote Selector */
.vote-selector {
  margin: 16px 0;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
}

.vote-label {
  font-size: 13px;
  color: #6B7280;
  display: block;
  margin-bottom: 8px;
}

.vote-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.vote-options .van-button {
  min-width: 60px;
}

.vote-tip {
  font-size: 12px;
  color: #6B7280;
  margin-top: 8px;
  margin-bottom: 0;
  line-height: 1.5;
}

/* Submit Button */
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
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.list-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-votes {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6B7280;
}

.total-votes .votes-icon {
  font-size: 14px;
  color: #F59E0B;
}

.total-votes .votes-number {
  font-weight: 600;
  color: #F59E0B;
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

/* Review Card */
.list .review-card {
  background: #fafafa;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
  border: 1px solid #f3f4f6;
}

.review-card:last-child {
  margin-bottom: 0;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.review-type-wrapper {
  display: flex;
  gap: 6px;
}

.title-tag {
  font-weight: 600;
}

.review-meta {
  font-size: 12px;
  color: #9CA3AF;
  margin-left: auto;
}

.review-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 10px;
  word-break: break-word;
}

.review-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.review-time {
  font-size: 12px;
  color: #9CA3AF;
}

.report-btn {
  border-color: #fecdd3;
  color: #E11D48;
  font-size: 11px;
  padding: 4px 10px;
}

/* Search Tip */
.search-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #DC2626;
  background: #FEF2F2;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #FECACA;
}

.search-tip .tip-icon {
  font-size: 14px;
}

.search-tip a {
  color: #E11D48;
  font-weight: 600;
  text-decoration: underline;
}
</style>

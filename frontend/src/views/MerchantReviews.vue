<template>
  <div class="merchant-reviews-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-text">
          <h1 class="page-title">商家点评</h1>
          <p class="page-subtitle">分享你的消费体验</p>
        </div>
      </div>
      <div class="vote-rule-tip">
        <van-icon name="info-o" />
        <span>每天对同一目标的第一次点评算「大票」权重高，后续点评算「小票」权重低。每次点评消耗 1 次机会。</span>
      </div>
    </div>

    <!-- Review Form Card -->
    <div class="form-card" v-if="!isReadOnly">
      <div class="form-header">
        <van-icon name="edit" class="form-icon" />
        <span class="form-title">提交点评</span>
      </div>
      <van-form @submit="createReview">
        <div class="rating-section">
          <span class="rating-label">评分（可选）：</span>
          <van-rate v-model="form.rating" size="18" color="#FBBF24" void-color="#E5E7EB" />
        </div>

        <div class="radio-group-wrapper">
          <span class="group-label">点评类型：</span>
          <van-radio-group v-model="form.type" direction="horizontal">
            <van-radio name="red" checked-color="#10b981">
              <template #icon="props">
                <div :class="['custom-radio', props.checked ? 'checked-red' : '']">
                  <van-icon :name="props.checked ? 'checked' : 'circle'" />
                </div>
              </template>
              <span class="radio-label red-label">红榜</span>
            </van-radio>
            <van-radio name="black" checked-color="#f59e0b">
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
          placeholder="请写下你的真实评价（10-200 字）"
          maxlength="200"
          show-word-limit
          :rules="[{ required: true, message: '请输入点评内容' }]"
        />

        <div class="vote-selector">
          <span class="vote-label">投票数：</span>
          <div class="vote-options">
            <van-button
              v-for="n in 10"
              :key="n"
              size="small"
              :type="form.count === n ? 'primary' : 'default'"
              :disabled="!canSelectCount(n)"
              @click="form.count = n"
            >
              {{ n }}票
            </van-button>
          </div>
          <p v-if="remaining === 0" class="no-quota-tip">
            <van-icon name="warning-o" />
            <span>今日票数已用完，请明日再来</span>
          </p>
          <p v-else class="vote-tip">💡 说明：每次点评消耗 1 次机会。每天对同一目标的第一次点评算「大票」权重高，后续点评算「小票」权重低。</p>
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
        <van-loading color="#2563EB">加载中...</van-loading>
      </div>

      <div v-else-if="hasLoaded && list.length === 0" class="empty-state">
        <van-empty description="暂无点评，快来抢沙发吧" />
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

      <div v-else class="empty-state" />

      <div v-else class="list">
        <div v-for="item in list" :key="item.id" class="review-card">
          <div class="review-header">
            <div class="review-type-wrapper">
              <van-tag :type="item.type === 'red' ? 'success' : 'warning'">
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
          <div class="review-footer" v-if="item.rating">
            <div class="review-rating">
              <van-rate v-model="item.rating" size="14" color="#FBBF24" void-color="#E5E7EB" readonly />
            </div>
          </div>
          <div class="review-footer">
            <span class="review-time">{{ formatDate(item.createdAt) }}</span>
            <van-icon
              name="warning-o"
              class="report-icon"
              @click="showReportDialog(item)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Report Dialog -->
    <van-dialog
      v-model:show="reportDialogShow"
      title="举报点评"
      show-cancel-button
      @confirm="submitReport"
    >
      <van-field
        v-model="reportReason"
        rows="3"
        autosize
        type="textarea"
        maxlength="200"
        placeholder="请输入举报原因"
        show-word-limit
      />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import http from '../api/http'

const route = useRoute()
const merchantId = Number(route.params.id)
const isReadOnly = computed(() => route.query.fromSearch === 'true' || route.query.fromRanking === 'true')

const list = ref<any[]>([])
const totalBigVotes = ref<number>(0)
const totalSmallVotes = ref<number>(0)
const form = ref({ type: 'red', content: '', rating: 0, count: 1 })
const submitting = ref(false)
const remaining = ref(0)
const loading = ref(true)
const hasLoaded = ref(false)

// 检查是否可以选择某个票数
const canSelectCount = (n: number) => {
  return n <= remaining.value
}

// 举报相关
const reportDialogShow = ref(false)
const reportReason = ref('')
const currentReviewId = ref<number | null>(null)

const load = async () => {
  loading.value = true
  try {
    // 并行加载列表和用户信息
    const [listRes, userRes] = await Promise.all([
      http.get(`/api/merchants/${merchantId}/reviews`),
      http.get('/api/auth/me')
    ])

    if (listRes.data.success) {
      list.value = listRes.data.data || []

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
      showToast(listRes.data.message || '加载失败')
    }

    // 加载用户剩余额度
    if (userRes.data.success && userRes.data.user) {
      remaining.value = userRes.data.user.remaining ?? 0
    } else {
      remaining.value = 0
    }
  } catch (err: any) {
    showToast('加载失败，请重试')
    remaining.value = 0
  } finally {
    hasLoaded.value = true
    loading.value = false
  }
}

const createReview = async () => {
  if (!form.value.content) {
    showToast('请输入点评内容')
    return
  }

  const totalVotes = form.value.count
  if (totalVotes < 1) {
    showToast('请选择投票数')
    return
  }
  if (totalVotes > 10) {
    showToast('最多 10 票')
    return
  }

  // 检查剩余票数
  if (totalVotes > remaining.value) {
    showToast(`票数不足，当前剩余${remaining.value}票`)
    return
  }

  submitting.value = true
  try {
    const { data } = await http.post(`/api/merchants/${merchantId}/reviews`, {
      type: form.value.type,
      content: form.value.content,
      rating: form.value.rating > 0 ? form.value.rating : undefined,
      count: totalVotes
    })

    if (data.success) {
      showToast(`点评已提交（${data.bigVotes || 0}大票 + ${data.smallVotes || 0}小票）`)
      form.value.content = ''
      form.value.rating = 0
      form.value.count = 1
      // 刷新额度和列表
      await loadUserQuota()
      await load()
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
    }
  } catch {
    // 静默失败
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

const showReportDialog = (item: any) => {
  currentReviewId.value = item.id
  reportReason.value = ''
  reportDialogShow.value = true
}

const submitReport = async () => {
  if (!reportReason.value.trim()) {
    showToast('请输入举报原因')
    return
  }

  try {
    const { data } = await http.post(
      `/api/merchants/${merchantId}/reviews/${currentReviewId.value}/report`,
      { reason: reportReason.value.trim() }
    )

    if (data.success) {
      showToast('举报已提交')
      reportDialogShow.value = false
    } else {
      showToast(data.message || '举报失败')
    }
  } catch {
    showToast('提交失败，请重试')
  }
}

onMounted(load)
</script>

<style scoped>
.merchant-reviews-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
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
  color: #2563EB;
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
  font-size: 24px;
  font-weight: 800;
  color: #1E3A5F;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #3B82F6;
  margin: 0;
  opacity: 0.8;
}

.vote-rule-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #2563EB;
  background: #EFF6FF;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px solid #DBEAFE;
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
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.form-icon {
  font-size: 20px;
  color: #2563EB;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

/* Rating Section */
.rating-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
}

.rating-label {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
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
  color: #10b981;
  font-weight: 500;
}

.black-label {
  color: #f59e0b;
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
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.custom-radio.checked-black {
  background: #f59e0b;
  border-color: #f59e0b;
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

.vote-options .van-button--disabled {
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
  background: linear-gradient(135deg, #60A5FA 0%, #2563EB 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

/* List Section */
.list-section {
  background: white;
  border-radius: 20px;
  padding: 20px 16px;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
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
  color: #2563EB;
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

.report-icon {
  font-size: 16px;
  color: #9CA3AF;
  margin-left: 12px;
  cursor: pointer;
}

.review-rating {
  margin-top: 6px;
}

/* Search Tip */
.search-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #2563EB;
  background: #EFF6FF;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #DBEAFE;
}

.search-tip .tip-icon {
  font-size: 14px;
}

.search-tip a {
  color: #2563EB;
  font-weight: 600;
  text-decoration: underline;
}
</style>

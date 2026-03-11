<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">举报处理</h1>
      <p class="page-subtitle">管理后台 - 审核举报内容</p>
    </div>

    <!-- Tab Switcher -->
    <div class="tab-wrapper">
      <div class="tab-container">
        <div class="tab-item" :class="{ active: tab === 'pending' }" @click="setTab('pending')">
          待处理
        </div>
        <div class="tab-item" :class="{ active: tab === 'history' }" @click="setTab('history')">
          处理记录
        </div>
      </div>
    </div>

    <!-- List Section -->
    <div class="list-section">
      <div v-if="!listLoaded" class="loading-state">
        <van-loading size="24px" vertical>加载中...</van-loading>
      </div>
      <div v-else-if="list.length === 0" class="empty-state">
        <van-empty :description="tab === 'pending' ? '暂无待处理举报' : '暂无处理记录'" />
      </div>
      <div v-else>
        <div class="list">
          <div v-for="item in list" :key="item.id" class="report-card">
            <div class="report-header">
              <span class="report-id">举报 #{{ item.id }}</span>
              <van-tag :type="getStatusType(item.status)">{{ getStatusText(item.status) }}</van-tag>
            </div>

            <div class="report-content">
              <div class="report-row">
                <span class="label">举报类型：</span>
                <span class="value">{{ item.reviewType === 'profile' ? '人员点评' : '商家点评' }}</span>
              </div>
              <div class="report-row">
                <span class="label">点评 ID：</span>
                <span class="value">{{ item.review?.id || item.reviewId || '-' }}</span>
              </div>
              <div class="report-row">
                <span class="label">被举报 UID：</span>
                <span class="value">{{ item.review?.reviewerId || item.reviewUserId || '-' }}</span>
              </div>
              <div class="report-row" v-if="item.profile">
                <span class="label">被举报人员：</span>
                <span class="value">{{ item.profile.name }} (ID: {{ item.profile.id }})</span>
              </div>
              <div class="report-row">
                <span class="label">点评内容：</span>
                <span class="value">{{ getReviewContent(item) }}</span>
              </div>
              <div class="report-row" v-if="item.review?.totalCount">
                <span class="label">票数：</span>
                <span class="value">{{ item.review.totalCount }} (大票 + 小票)</span>
              </div>
              <div class="report-row" v-if="getMerchantName(item)">
                <span class="label">商家名称：</span>
                <span class="value">{{ getMerchantName(item) }}</span>
              </div>
              <div class="report-row">
                <span class="label">举报人：</span>
                <span class="value">{{ item.reporter?.email || `用户 #${item.reporterId}` }}</span>
              </div>
              <div class="report-row" v-if="item.handledAt">
                <span class="label">处理时间：</span>
                <span class="value">{{ formatDate(item.handledAt) }}</span>
              </div>
            </div>

            <div v-if="item.status === 'pending'" class="report-actions">
              <van-button
                class="action-btn"
                type="danger"
                size="small"
                round
                @click="approve(item.id)"
              >
                通过并删除
              </van-button>
              <van-button
                class="action-btn"
                plain
                size="small"
                round
                @click="reject(item.id)"
              >
                驳回
              </van-button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="list.length > 0" class="pagination">
          <van-button
            size="small"
            plain
            :disabled="page === 1"
            @click="prev"
          >
            上一页
          </van-button>
          <span class="page-info">第 {{ page }} / {{ totalPages }} 页</span>
          <van-button
            size="small"
            plain
            :disabled="page >= totalPages"
            @click="next"
          >
            下一页
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { showToast } from 'vant'
import http from '../api/http'
import { useRouter } from 'vue-router'

const router = useRouter()
const list = ref<any[]>([])
const tab = ref<'pending' | 'history'>('pending')
const page = ref(1)
const pageSize = 20
const total = ref(0)
const listLoaded = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

// 检查是否已验证（仅限 admin@admin.admin 用户）
const checkAuth = async () => {
  try {
    const { data } = await http.get('/api/auth/me')
    if (data.success && data.user && data.user.email === 'admin@admin.admin') {
      return true
    }
  } catch {}
  // 不是 admin 用户，跳转到管理后台验证页
  router.push('/admin')
  return false
}

onMounted(async () => {
  const authorized = await checkAuth()
  if (authorized) {
    load()
  }
})

const getStatusType = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'default'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '待处理'
    case 'approved': return '已通过'
    case 'rejected': return '已驳回'
    default: return status
  }
}

const load = async () => {
  listLoaded.value = false
  const url = tab.value === 'pending' ? '/api/admin' : '/api/admin/reports/history'
  try {
    const { data } = await http.get(url)
    if (data.success) {
      list.value = data.data || []
      total.value = data.pagination?.total || 0
    } else {
      showToast(data.message || '加载失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '加载失败，请重试')
  } finally {
    listLoaded.value = true
  }
}

const approve = async (id: number) => {
  try {
    const { data } = await http.post(`/api/admin/reports/${id}/approve`)
    if (data.success) {
      showToast('已通过并删除')
      load()
    } else {
      showToast(data.message || '处理失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '处理失败，请重试')
  }
}

const reject = async (id: number) => {
  try {
    const { data } = await http.post(`/api/admin/reports/${id}/reject`)
    if (data.success) {
      showToast('已驳回')
      load()
    } else {
      showToast(data.message || '处理失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '处理失败，请重试')
  }
}

const setTab = (value: 'pending' | 'history') => {
  tab.value = value
  page.value = 1
  load()
}

const prev = () => {
  if (page.value <= 1) return
  page.value -= 1
  load()
}

const next = () => {
  if (page.value >= totalPages.value) return
  page.value += 1
  load()
}

const formatDate = (value: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

const getReviewContent = (item: any) => {
  // 优先使用 review 对象中的 content
  const content = item.review?.content || item.reviewContent
  return content || '-'
}

const getMerchantName = (item: any) => {
  const name = item.merchant?.name || item.merchantName
  return name || null
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #F5F3FF 0%, #DDD6FE 100%);
  padding: 24px 16px;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #5B21B6;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #7C3AED;
  margin: 0;
  opacity: 0.8;
}

/* Tab Wrapper */
.tab-wrapper {
  margin-bottom: 16px;
}

.tab-container {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab-item.active {
  background: linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%);
  color: white;
  font-weight: 600;
}

/* List Section */
.list-section {
  background: white;
  border-radius: 20px;
  padding: 20px 16px;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
}

.loading-state {
  padding: 40px 0;
  text-align: center;
}

.empty-state {
  padding: 40px 0;
}

/* Report Card */
.list .report-card {
  background: #fafafa;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
  border: 1px solid #f3f4f6;
}

.report-card:last-child {
  margin-bottom: 0;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.report-id {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.report-content {
  margin-bottom: 12px;
}

.report-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
}

.report-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #6B7280;
  min-width: 70px;
}

.value {
  color: #374151;
  flex: 1;
}

.report-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.page-info {
  font-size: 13px;
  color: #6B7280;
}
</style>

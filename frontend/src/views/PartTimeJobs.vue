<template>
  <div class="part-time-jobs-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-content">
          <h1 class="page-title">山信兼职</h1>
          <p class="page-subtitle">校内兼职信息平台</p>
        </div>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-bar">
      <van-field
        v-model="keyword"
        placeholder="搜索兼职名称/介绍/类型"
        clearable
        @keyup.enter="search"
      >
        <template #button>
          <van-button size="small" type="primary" @click="search">
            搜索
          </van-button>
        </template>
      </van-field>
    </div>

    <!-- 性别筛选 -->
    <div class="gender-filter">
      <van-radio-group v-model="filterGender" direction="horizontal" @change="loadJobs">
        <van-radio name="" checked-color="#65A30D">全部</van-radio>
        <van-radio name="不限" checked-color="#65A30D">不限</van-radio>
        <van-radio name="男" checked-color="#65A30D">男</van-radio>
        <van-radio name="女" checked-color="#65A30D">女</van-radio>
      </van-radio-group>
    </div>

    <!-- 兼职提示 -->
    <div class="notice-card">
      <van-icon name="bullhorn" class="notice-icon" />
      <div class="notice-content">
        <p class="notice-text">如有兼职发布需求，请联系管理员</p>
        <p class="notice-desc">费用：¥10/月，展示在兼职分区</p>
      </div>
    </div>

    <!-- 兼职列表 -->
    <div class="jobs-section">
      <div v-if="loading" class="loading-state">
        <van-loading color="#EA580C">加载中...</van-loading>
      </div>

      <div v-else-if="jobs.length === 0" class="empty-state">
        <van-empty description="暂无兼职信息" />
      </div>

      <div v-else class="jobs-list">
        <div
          v-for="item in jobs"
          :key="item.id"
          class="job-card"
        >
          <div class="job-header">
            <div class="job-name">{{ item.name }}</div>
            <van-tag :type="item.gender === '不限' ? 'primary' : (item.gender === '男' ? 'success' : 'danger')" size="medium">
              {{ item.gender }}
            </van-tag>
          </div>

          <div class="job-meta">
            <span class="meta-item">
              <van-icon name="label-o" />
              {{ item.type }}
            </span>
            <span class="meta-item" v-if="item.expireAt">
              <van-icon name="clock-o" />
              有效期至 {{ formatDate(item.expireAt) }}
            </span>
          </div>

          <div v-if="item.description" class="job-description">
            {{ item.description }}
          </div>

          <div v-if="item.priceList" class="job-pricelist">
            <div class="pricelist-title">价格表：</div>
            <div class="pricelist-content">{{ item.priceList }}</div>
          </div>

          <div class="job-contact">
            <van-icon name="phone" />
            <span>联系方式：{{ item.contact }}</span>
          </div>

          <div class="job-footer">
            <span class="publish-time">发布于 {{ formatDate(item.createdAt) }}</span>
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

const jobs = ref<any[]>([])
const loading = ref(false)
const keyword = ref('')
const filterGender = ref('')

const loadJobs = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (keyword.value) params.keyword = keyword.value
    if (filterGender.value) params.gender = filterGender.value

    const { data } = await http.get('/api/part-time-jobs/list', { params })
    if (data.success) {
      jobs.value = data.jobs || []
    } else {
      showToast(data.message || '加载失败')
    }
  } catch {
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

const search = () => {
  loadJobs()
}

const formatDate = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString('zh-CN')
}

onMounted(loadJobs)
</script>

<style scoped>
.part-time-jobs-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ECFCCB 0%, #D9F99D 100%);
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
  color: #365314;
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
  color: #365314;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #4D7C0F;
  margin: 0;
  opacity: 0.8;
}

/* Search Bar */
.search-bar {
  margin-bottom: 12px;
  background: white;
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(77, 124, 15, 0.1);
}

/* Gender Filter */
.gender-filter {
  margin-bottom: 16px;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(77, 124, 15, 0.1);
}

.gender-filter .van-radio-group {
  justify-content: space-around;
}

.gender-filter .van-radio {
  font-size: 13px;
}

/* Notice Card */
.notice-card {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #FCD34D;
}

.notice-icon {
  font-size: 24px;
  color: #B45309;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-text {
  font-size: 14px;
  font-weight: 600;
  color: #92400E;
  margin: 0 0 4px 0;
}

.notice-desc {
  font-size: 12px;
  color: #B45309;
  margin: 0;
}

/* Jobs Section */
.jobs-section {
  background: white;
  border-radius: 20px;
  padding: 20px 16px;
  box-shadow: 0 4px 16px rgba(77, 124, 15, 0.08);
}

.loading-state {
  padding: 40px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-state {
  padding: 40px 0;
}

.jobs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Job Card */
.job-card {
  background: #f9fafb;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid #e5e7eb;
}

.job-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.job-name {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

.job-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6B7280;
}

.job-description {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 10px;
  background: white;
  padding: 8px 10px;
  border-radius: 8px;
}

.job-pricelist {
  margin-bottom: 10px;
  background: white;
  padding: 8px 10px;
  border-radius: 8px;
}

.pricelist-title {
  font-size: 12px;
  font-weight: 600;
  color: #059669;
  margin-bottom: 4px;
}

.pricelist-content {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.job-contact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #059669;
  background: #ECFDF5;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.job-contact .van-icon {
  font-size: 16px;
}

.job-footer {
  text-align: right;
}

.publish-time {
  font-size: 12px;
  color: #9CA3AF;
}
</style>

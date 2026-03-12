<template>
  <div class="rankings-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-text">
          <h1 class="page-title">人员榜单</h1>
          <p class="page-subtitle">热门点评排行榜</p>
        </div>
      </div>
    </div>

    <!-- Time Filter Tabs -->
    <div class="filter-tabs">
      <div
        v-for="tab in timeTabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: timeRange === tab.value }"
        @click="timeRange = tab.value; load()"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- Type Filter Tabs -->
    <div class="type-tabs">
      <div
        class="type-tab"
        :class="{ active: listType === 'red' }"
        @click="listType = 'red'; load()"
      >
        <van-icon name="like-o" /> 红榜
      </div>
      <div
        class="type-tab"
        :class="{ active: listType === 'black' }"
        @click="listType = 'black'; load()"
      >
        <van-icon name="dislike-o" /> 黑榜
      </div>
    </div>

    <!-- Rankings List -->
    <div class="list-section">
      <div v-if="loading" class="loading-state">
        <van-loading color="#EA580C">加载中...</van-loading>
      </div>

      <div v-else-if="sortedList.length === 0" class="empty-state">
        <van-empty description="暂无榜单数据" />
      </div>

      <!-- 红黑榜排行榜 -->
      <div class="sub-list" v-else>
        <div class="sub-list-header">
          <van-icon :name="listType === 'red' ? 'like-o' : 'dislike-o'" class="sub-list-icon" :class="listType" />
          <span class="sub-list-title">{{ listType === 'red' ? '红榜' : '黑榜' }}排行榜</span>
          <span class="sub-list-time">{{ timeRangeLabel }}</span>
        </div>
        <div class="rankings-list">
          <div
            v-for="(item, index) in sortedList"
            :key="`profile-${item.id}`"
            class="ranking-card"
            @click="openProfile(item.id, item.name || '')"
          >
            <div class="rank-number" :class="getRankClass(index)">
              {{ getRankDisplay(index) }}
            </div>
            <div class="ranking-content">
              <div class="ranking-header">
                <span class="ranking-name">{{ item.name || '未知' }}</span>
                <span class="ranking-class" v-if="item.className">{{ item.className }}</span>
              </div>
              <div class="ranking-meta">
                <van-icon name="star" :class="['star-icon', listType]" />
                <span class="count">{{ item.reviewCount || 0 }} 次点评</span>
              </div>
              <div class="ranking-votes">
                <span class="vote-item big" v-if="listType === 'red'">🔴 大票：{{ item.redBigVotes || 0 }}</span>
                <span class="vote-item small" v-if="listType === 'red'">🔴 小票：{{ item.redSmallVotes || 0 }}</span>
                <span class="vote-item big" v-if="listType === 'black'">⚫ 大票：{{ item.blackBigVotes || 0 }}</span>
                <span class="vote-item small" v-if="listType === 'black'">⚫ 小票：{{ item.blackSmallVotes || 0 }}</span>
                <span class="vote-item score">榜分：{{ (listType === 'red' ? item.redScore : item.blackScore) || 0 }}</span>
              </div>
            </div>
            <div class="ranking-trend">
              <van-icon :name="listType === 'red' ? 'like-o' : 'dislike-o'" :class="['trend-icon', listType]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onActivated, computed } from 'vue'
import { showToast } from 'vant'
import http from '../api/http'
import { useRouter } from 'vue-router'

const router = useRouter()

const listType = ref<'red' | 'black'>('red')
const timeRange = ref<'all' | 'week' | 'day'>('all')
const list = ref<any[]>([])
const loading = ref(false)

const timeTabs = [
  { label: '总榜', value: 'all' },
  { label: '周榜', value: 'week' },
  { label: '日榜', value: 'day' }
]

const timeRangeLabel = computed(() => {
  return timeTabs.find(t => t.value === timeRange.value)?.label || ''
})

const sortedList = computed(() => {
  return list.value
})

const load = async () => {
  loading.value = true
  try {
    const response = await http.get(`/api/rankings/profile?type=${listType.value}&timeRange=${timeRange.value}`)
    if (response.data.success) {
      list.value = response.data.profiles || []
    } else {
      showToast(response.data.message || '加载失败')
    }
  } catch (err) {
    console.error('Load error:', err)
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

const getRankClass = (index: number) => {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}

const getRankDisplay = (index: number) => {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return `${index + 1}`
}

const openProfile = (id: number, name: string) => {
  router.push(`/profiles/${id}?fromRanking=true&name=${encodeURIComponent(name)}`)
}

onMounted(load)

// 页面激活时刷新数据（从其他页面返回时）
onActivated(load)
</script>

<style scoped>
.rankings-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%);
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
  color: #9A3412;
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
  color: #9A3412;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #EA580C;
  margin: 0;
  opacity: 0.8;
}

/* Time Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-tab {
  flex: 1;
  text-align: center;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #EA580C;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.08);
}

.filter-tab.active {
  color: white;
  background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
}

/* Type Filter Tabs */
.type-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  background: white;
  padding: 6px;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(234, 88, 12, 0.08);
}

.type-tab {
  flex: 1;
  text-align: center;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #6B7280;
  background: #f9fafb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.type-tab.active {
  color: white;
}

.type-tab.active:first-child {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.type-tab.active:last-child {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

/* List Section */
.list-section {
  background: white;
  border-radius: 20px;
  padding: 20px 16px;
  box-shadow: 0 4px 16px rgba(234, 88, 12, 0.08);
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

.sub-list {
  margin-bottom: 24px;
}

.sub-list:last-child {
  margin-bottom: 0;
}

.sub-list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f3f4f6;
}

.sub-list-icon {
  font-size: 18px;
}

.sub-list-icon.red {
  color: #10b981;
}

.sub-list-icon.black {
  color: #f59e0b;
}

.sub-list-title {
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
}

.sub-list-time {
  margin-left: auto;
  font-size: 12px;
  color: #6B7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 6px;
}

/* Rankings List */
.rankings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%);
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  transition: all 0.2s;
}

.ranking-card:active {
  transform: scale(0.98);
}

.rank-number {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #6B7280;
  flex-shrink: 0;
}

.rank-1 {
  background: linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%);
  color: #92400E;
  box-shadow: 0 2px 8px rgba(252, 211, 77, 0.4);
}

.rank-2 {
  background: linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%);
  color: #374151;
  box-shadow: 0 2px 8px rgba(209, 213, 219, 0.4);
}

.rank-3 {
  background: linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%);
  color: #9A3412;
  box-shadow: 0 2px 8px rgba(253, 186, 116, 0.4);
}

.ranking-content {
  flex: 1;
  min-width: 0;
}

.ranking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.ranking-name {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
}

.ranking-class {
  font-size: 12px;
  color: #6B7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 6px;
}

.ranking-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6B7280;
}

.star-icon {
  font-size: 14px;
}

.star-icon.red {
  color: #E11D48;
}

.star-icon.black {
  color: #EA580C;
}

.count {
  font-weight: 500;
}

.ranking-votes {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.vote-item {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f3f4f6;
}

.vote-item.big {
  color: #dc2626;
  background: #fef2f2;
}

.vote-item.small {
  color: #d97706;
  background: #fffbeb;
}

.vote-item.score {
  color: #059669;
  background: #ecfdf5;
  font-weight: 600;
}

.ranking-trend {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trend-icon {
  font-size: 20px;
}

.trend-icon.red {
  color: #10b981;
}

.trend-icon.black {
  color: #f59e0b;
}
</style>

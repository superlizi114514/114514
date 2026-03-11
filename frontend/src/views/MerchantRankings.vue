<template>
  <div class="merchant-rankings-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-text">
          <h1 class="page-title">商家榜单</h1>
          <p class="page-subtitle">热门商家排行榜</p>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <div
        class="filter-tab"
        :class="{ active: currentTab === '' }"
        @click="setCurrentTab('')"
      >
        全部
      </div>
      <div
        class="filter-tab red-tab"
        :class="{ active: currentTab === 'red' }"
        @click="setCurrentTab('red')"
      >
        红榜
      </div>
      <div
        class="filter-tab black-tab"
        :class="{ active: currentTab === 'black' }"
        @click="setCurrentTab('black')"
      >
        黑榜
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <van-loading color="#10b981">加载中...</van-loading>
    </div>

    <!-- Rankings List -->
    <div class="list-section" v-else>
      <div v-if="redList.length === 0 && blackList.length === 0" class="empty-state">
        <van-empty description="暂无榜单数据" />
      </div>

      <!-- 红榜 -->
      <div v-if="currentTab !== 'black' && redList.length > 0" class="sub-list">
        <div class="sub-list-header">
          <van-icon name="star" class="sub-list-icon red" />
          <span class="sub-list-title">红榜商家排行榜</span>
        </div>
        <div class="rankings-list">
          <div
            v-for="(item, index) in redList"
            :key="`red-merchant-${item.id}`"
            class="ranking-card"
            @click="openMerchant(item.id)"
          >
            <div class="rank-number" :class="getRankClass(index)">
              {{ getRankDisplay(index) }}
            </div>
            <div class="ranking-content">
              <div class="ranking-header">
                <span class="ranking-name">{{ item.name || '未知商家' }}</span>
                <van-tag type="success" size="medium">
                  红榜
                </van-tag>
              </div>
              <div class="ranking-meta">
                <van-icon name="star" class="star-icon red" />
                <span class="count">{{ item.reviewCount }} 次点评</span>
              </div>
              <div class="ranking-votes">
                <span class="vote-item">🔴 大票：{{ item.redBigVotes || 0 }}</span>
                <span class="vote-item">🔴 小票：{{ item.redSmallVotes || 0 }}</span>
                <span class="vote-item total" style="margin-left:auto">红榜分：{{ (item.redScore || 0).toFixed(1) }}</span>
              </div>
              <div class="ranking-category" v-if="item.category">{{ item.category }}</div>
            </div>
            <div class="ranking-trend">
              <van-icon name="like-o" class="trend-icon red" />
            </div>
          </div>
        </div>
      </div>

      <!-- 黑榜 -->
      <div v-if="currentTab !== 'red' && blackList.length > 0" class="sub-list">
        <div class="sub-list-header">
          <van-icon name="warning-o" class="sub-list-icon black" />
          <span class="sub-list-title">黑榜商家排行榜</span>
        </div>
        <div class="rankings-list">
          <div
            v-for="(item, index) in blackList"
            :key="`black-merchant-${item.id}`"
            class="ranking-card"
            @click="openMerchant(item.id)"
          >
            <div class="rank-number" :class="getRankClass(index)">
              {{ getRankDisplay(index) }}
            </div>
            <div class="ranking-content">
              <div class="ranking-header">
                <span class="ranking-name">{{ item.name || '未知商家' }}</span>
                <van-tag type="warning" size="medium">
                  黑榜
                </van-tag>
              </div>
              <div class="ranking-meta">
                <van-icon name="star" class="star-icon black" />
                <span class="count">{{ item.reviewCount }} 次点评</span>
              </div>
              <div class="ranking-votes">
                <span class="vote-item">⚫ 大票：{{ item.blackBigVotes || 0 }}</span>
                <span class="vote-item">⚫ 小票：{{ item.blackSmallVotes || 0 }}</span>
                <span class="vote-item total" style="margin-left:auto">黑榜分：{{ (item.blackScore || 0).toFixed(1) }}</span>
              </div>
              <div class="ranking-category" v-if="item.category">{{ item.category }}</div>
            </div>
            <div class="ranking-trend">
              <van-icon name="dislike-o" class="trend-icon black" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onActivated } from 'vue'
import { showToast } from 'vant'
import http from '../api/http'
import { useRouter } from 'vue-router'

const router = useRouter()

const redList = ref<any[]>([])
const blackList = ref<any[]>([])
const currentTab = ref('')
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    // 同时请求红榜和黑榜数据
    const [redRes, blackRes] = await Promise.all([
      http.get('/api/rankings/merchant?type=red'),
      http.get('/api/rankings/merchant?type=black')
    ])

    console.log('红榜响应:', redRes.data)
    console.log('黑榜响应:', blackRes.data)

    if (redRes.data.success) {
      redList.value = redRes.data.merchants || []
      console.log('红榜列表:', redList.value)
    }

    if (blackRes.data.success) {
      blackList.value = blackRes.data.merchants || []
      console.log('黑榜列表:', blackList.value)
    }

    if (redList.value.length === 0 && blackList.value.length === 0) {
      showToast('暂无商家点评数据')
    }
  } catch (e: any) {
    console.error('加载商家榜单失败:', e)
    const errorMsg = e.response?.data?.message || e.message || '加载失败，请重试'
    showToast(errorMsg)
  } finally {
    loading.value = false
  }
}

const setCurrentTab = (value: string) => {
  currentTab.value = value
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

const openMerchant = (id: number) => {
  router.push(`/merchants/${id}?fromRanking=true`)
}

onMounted(load)

// 页面激活时刷新数据（从其他页面返回时）
onActivated(load)
</script>

<style scoped>
.merchant-rankings-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ECFDF5 0%, #A7F3D0 100%);
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
  color: #065F46;
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
  color: #065F46;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #059669;
  margin: 0;
  opacity: 0.8;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  background: white;
  padding: 6px;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(5, 150, 105, 0.08);
}

.filter-tab {
  flex: 1;
  text-align: center;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
  background: #f9fafb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab.active {
  color: white;
  font-weight: 600;
}

.filter-tab.red-tab.active {
  background: linear-gradient(135deg, #34D399 0%, #059669 100%);
}

.filter-tab.black-tab.active {
  background: linear-gradient(135deg, #FBBF24 0%, #D97706 100%);
}

/* List Section */
.list-section {
  background: white;
  border-radius: 20px;
  padding: 20px 16px;
  box-shadow: 0 4px 16px rgba(5, 150, 105, 0.08);
}

.empty-state {
  padding: 40px 0;
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
  color: #059669;
}

.sub-list-icon.black {
  color: #D97706;
}

.sub-list-title {
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
}

.loading-state {
  padding: 40px 0;
  display: flex;
  justify-content: center;
  align-items: center;
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
  cursor: pointer;
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
  background: linear-gradient(135deg, #A7F3D0 0%, #34D399 100%);
  color: #065F46;
  box-shadow: 0 2px 8px rgba(52, 211, 153, 0.4);
}

.rank-2 {
  background: linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%);
  color: #374151;
  box-shadow: 0 2px 8px rgba(209, 213, 219, 0.4);
}

.rank-3 {
  background: linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%);
  color: #92400E;
  box-shadow: 0 2px 8px rgba(252, 211, 77, 0.4);
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
}

.ranking-name {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
}

.ranking-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 4px;
}

.star-icon {
  font-size: 14px;
}

.star-icon.red {
  color: #059669;
}

.star-icon.black {
  color: #D97706;
}

.count {
  font-weight: 500;
}

.ranking-votes {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-top: 4px;
}

.ranking-votes .vote-item {
  font-weight: 500;
}

.ranking-votes .vote-item.big {
  color: #DC2626;
}

.ranking-votes .vote-item.small {
  color: #D97706;
}

.ranking-votes .vote-item.total {
  color: #7C3AED;
  margin-left: auto;
}

.ranking-category {
  display: inline-block;
  font-size: 12px;
  color: #059669;
  background: #ECFDF5;
  padding: 2px 8px;
  border-radius: 6px;
}

.ranking-trend {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trend-icon {
  font-size: 18px;
}

.trend-icon.red {
  color: #059669;
}

.trend-icon.black {
  color: #D97706;
}
</style>

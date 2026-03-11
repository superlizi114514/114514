<template>
  <div class="search-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-text">
          <h1 class="page-title">搜索</h1>
          <p class="page-subtitle">查找人员或商家</p>
        </div>
      </div>
    </div>

    <!-- Search Box -->
    <div class="search-card">
      <van-form @submit="search">
        <van-field
          v-model="keyword"
          center
          clearable
          placeholder="输入姓名、商家名称搜索"
          left-icon="search"
        />
        <div class="search-filters">
          <div class="filter-group">
            <span class="filter-label">类型：</span>
            <van-button
              size="small"
              :type="type === '' ? 'primary' : 'default'"
              @click="setType('')"
            >
              全部
            </van-button>
            <van-button
              size="small"
              :type="type === 'red' ? 'danger' : 'default'"
              @click="setType('red')"
            >
              红榜
            </van-button>
            <van-button
              size="small"
              :type="type === 'black' ? 'warning' : 'default'"
              @click="setType('black')"
            >
              黑榜
            </van-button>
          </div>
          <div class="filter-group">
            <span class="filter-label">排序：</span>
            <van-button
              size="small"
              :type="sort === 'latest' ? 'primary' : 'default'"
              @click="setSort('latest')"
            >
              最新
            </van-button>
            <van-button
              size="small"
              :type="sort === 'hot' ? 'primary' : 'default'"
              @click="setSort('hot')"
            >
              最热
            </van-button>
          </div>
        </div>
        <div class="search-btn-wrapper">
          <van-button
            class="search-btn"
            type="primary"
            block
            round
            native-type="submit"
            :loading="searching"
          >
            {{ searching ? '搜索中...' : '搜索' }}
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- Results -->
    <div class="results-section" v-if="searched">
      <!-- Profiles -->
      <div class="result-block" v-if="profiles.length > 0">
        <div class="result-header">
          <van-icon name="friends-o" class="result-icon" />
          <span class="result-title">人员</span>
          <span class="result-count">{{ profiles.length }} 人</span>
        </div>
        <div class="result-list">
          <div
            v-for="item in profiles"
            :key="item.name"
            class="result-card"
            @click="openProfile(item.name)"
          >
            <div class="result-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="result-content">
              <div class="result-name">{{ item.name }}</div>
              <div class="result-meta">
                <span v-if="item.campusDisplay || item.allCampuses?.length > 0" class="meta-tag">{{ item.campusDisplay || item.allCampuses?.join('/') }}</span>
                <span v-if="item.classNameDisplay || item.allClassNames?.length > 0" class="meta-tag">{{ item.classNameDisplay || item.allClassNames?.join('/') }}</span>
                <span class="vote-count">
                  <van-icon name="star-o" />
                  {{ item.totalBigVotes || 0 }}大票 + {{ item.totalSmallVotes || 0 }}小票
                </span>
              </div>
            </div>
            <div class="result-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Merchants -->
      <div class="result-block" v-if="merchants.length > 0">
        <div class="result-header">
          <van-icon name="shop-o" class="result-icon" />
          <span class="result-title">商家</span>
          <span class="result-count">{{ merchants.length }} 家</span>
        </div>
        <div class="result-list">
          <div
            v-for="item in merchants"
            :key="item.id"
            class="result-card merchant-card"
            @click="openMerchant(item.id)"
          >
            <div class="result-avatar merchant-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 4a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div class="result-content">
              <div class="result-name">{{ item.name }}</div>
              <div class="result-meta">
                <span v-if="item.category" class="meta-tag category-tag">{{ item.category }}</span>
                <span class="vote-count">
                  <van-icon name="star-o" />
                  {{ item.totalBigVotes || 0 }}大票 + {{ item.totalSmallVotes || 0 }}小票
                </span>
              </div>
            </div>
            <div class="result-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="profiles.length === 0 && merchants.length === 0" class="empty-state">
        <van-empty image="search" description="没有匹配结果" />
      </div>
    </div>

    <!-- Initial State -->
    <div v-if="!searched" class="initial-state">
      <van-icon name="search" class="initial-icon" />
      <p class="initial-text">输入关键词开始搜索</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'
import http from '../api/http'
import { useRouter } from 'vue-router'

const router = useRouter()
const keyword = ref('')
const type = ref('')
const sort = ref<'latest' | 'hot'>('latest')
const profiles = ref<any[]>([])
const merchants = ref<any[]>([])
const searched = ref(false)
const searching = ref(false)

const setType = (value: string) => {
  type.value = value
}

const setSort = (value: 'latest' | 'hot') => {
  sort.value = value
}

const search = async () => {
  if (!keyword.value.trim()) {
    showToast('请输入关键词')
    return
  }

  searching.value = true
  try {
    const { data } = await http.get('/api/search', {
      params: {
        q: keyword.value.trim(),
        type: type.value || undefined,
        sort: sort.value
      }
    })
    if (data.success) {
      profiles.value = data.data.profiles || []
      merchants.value = data.data.merchants || []
      searched.value = true
    } else {
      showToast(data.message || '搜索失败')
    }
  } catch {
    showToast('搜索失败，请重试')
  } finally {
    searching.value = false
  }
}

const openProfile = (name: string) => {
  router.push({ path: '/profiles/0', query: { name } })
}

const openMerchant = (id: number) => {
  router.push(`/merchants/${id}?fromSearch=true`)
}
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
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
  color: #0284c7;
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
  color: #075985;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #0284C7;
  margin: 0;
  opacity: 0.8;
}

/* Search Card */
.search-card {
  background: white;
  border-radius: 20px;
  padding: 20px 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);
}

.search-filters {
  padding: 12px 0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

.search-btn-wrapper {
  margin-top: 16px;
}

.search-btn {
  height: 44px;
  font-weight: 600;
  background: linear-gradient(135deg, #38BDF8 0%, #0284C7 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
}

/* Results Section */
.results-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-block {
  background: white;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}

.result-icon {
  font-size: 18px;
  color: #0284C7;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
}

.result-count {
  margin-left: auto;
  font-size: 12px;
  color: #6B7280;
  background: #f3f4f6;
  padding: 3px 8px;
  border-radius: 8px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-card:active {
  background: #f3f4f6;
  transform: scale(0.99);
}

.result-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-avatar svg {
  width: 24px;
  height: 24px;
  color: #DB2777;
}

.merchant-avatar {
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
}

.merchant-avatar svg {
  color: #2563EB;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #6B7280;
}

.meta-tag {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.category-tag {
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  color: #1E40AF;
}

.review-count {
  display: flex;
  align-items: center;
  gap: 2px;
}

.review-count .van-icon {
  font-size: 11px;
}

.vote-count {
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
  color: #F59E0B;
}

.vote-count .van-icon {
  font-size: 11px;
  color: #F59E0B;
}

.result-arrow {
  width: 20px;
  height: 20px;
  color: #9CA3AF;
  flex-shrink: 0;
}

.result-arrow svg {
  width: 100%;
  height: 100%;
}

/* Empty State */
.empty-state {
  background: white;
  border-radius: 20px;
  padding: 40px 16px;
  box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);
}

/* Initial State */
.initial-state {
  text-align: center;
  padding: 60px 16px;
}

.initial-icon {
  font-size: 64px;
  color: #BAE6FD;
  margin-bottom: 16px;
}

.initial-text {
  font-size: 14px;
  color: #9CA3AF;
}
</style>

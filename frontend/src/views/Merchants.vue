<template>
  <div class="merchants-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-text">
          <h1 class="page-title">商家列表</h1>
          <p class="page-subtitle">发现校园周边好去处</p>
        </div>
      </div>
    </div>

    <!-- Add Form Card -->
    <div class="form-card">
      <div class="form-header">
        <van-icon name="shop-o" class="form-icon" />
        <span class="form-title">添加商家</span>
      </div>
      <van-form @submit="createMerchant">
        <van-field
          v-model="form.name"
          label="商家名称"
          placeholder="请输入商家名称（必填）"
          :rules="[{ required: true, message: '请输入商家名称' }]"
        />
        <van-field
          v-model="form.category"
          label="分类"
          placeholder="例如：餐饮、购物、娱乐（可选）"
        />
        <van-field
          v-model="form.address"
          label="地址"
          placeholder="请输入商家地址（可选）"
        />
        <van-field
          v-model="form.phone"
          label="电话"
          placeholder="请输入联系电话（可选）"
          type="tel"
        />
        <div class="submit-section">
          <van-button
            class="submit-btn"
            type="primary"
            block
            round
            native-type="submit"
            :loading="submitting"
          >
            {{ submitting ? '创建中...' : '添加商家' }}
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- List Section -->
    <div class="list-section">
      <div v-if="loading" class="loading-state">
        <van-loading color="#2563EB">加载中...</van-loading>
      </div>
      <div v-else>
        <div class="list-header">
          <van-icon name="bag-o" class="list-icon" />
          <span class="list-title">商家列表</span>
          <span class="list-count" v-if="list.length > 0">{{ list.length }} 家</span>
        </div>

        <div v-if="list.length === 0" class="empty-state">
          <van-empty description="暂无商家，点击上方表单添加" />
        </div>

        <div v-else class="list">
          <div
            v-for="item in list"
            :key="item.id"
            class="merchant-card"
            @click="openMerchant(item.id)"
          >
            <div class="merchant-icon-wrapper">
              <div class="merchant-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 4a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
            </div>
            <div class="merchant-content">
              <div class="merchant-name">{{ item.name }}</div>
              <div class="merchant-meta">
                <span v-if="item.category" class="category-tag">{{ item.category }}</span>
                <span v-if="item.address" class="meta-item">
                  <van-icon name="location-o" />
                  {{ item.address }}
                </span>
                <span v-if="item.phone" class="meta-item">
                  <van-icon name="phone-o" />
                  {{ item.phone }}
                </span>
                <span v-if="!item.category && !item.address && !item.phone" class="meta-placeholder">
                  暂无详细信息
                </span>
              </div>
            </div>
            <div class="merchant-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
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
const list = ref<any[]>([])
const loading = ref(true)
const form = ref({ name: '', category: '', address: '', phone: '' })
const submitting = ref(false)

const load = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/api/merchants')
    if (data.success) {
      list.value = data.data || []
    } else {
      showToast(data.message || '加载失败')
    }
  } catch {
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

const createMerchant = async () => {
  if (!form.value.name?.trim()) {
    showToast('请输入商家名称')
    return
  }

  submitting.value = true
  try {
    const { data } = await http.post('/api/merchants', {
      name: form.value.name.trim(),
      category: form.value.category?.trim() || null,
      address: form.value.address?.trim() || null,
      phone: form.value.phone?.trim() || null
    })

    if (data.success) {
      showToast('创建成功')
      form.value = { name: '', category: '', address: '', phone: '' }
      load()
    } else {
      showToast(data.message || '创建失败')
    }
  } catch {
    showToast('创建失败，请重试')
  } finally {
    submitting.value = false
  }
}

const openMerchant = (id: number) => {
  router.push(`/merchants/${id}`)
}

onMounted(load)

// 页面激活时刷新数据
onActivated(load)
</script>

<style scoped>
.merchants-page {
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
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
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

/* Merchant Card */
.list .merchant-card {
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

.merchant-card:last-child {
  margin-bottom: 0;
}

.merchant-card:active {
  background: #f3f4f6;
  transform: scale(0.99);
}

.merchant-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.merchant-icon {
  width: 28px;
  height: 28px;
  color: #2563EB;
}

.merchant-icon svg {
  width: 100%;
  height: 100%;
}

.merchant-content {
  flex: 1;
  min-width: 0;
}

.merchant-name {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 6px;
}

.merchant-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #6B7280;
}

.category-tag {
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  color: #1E40AF;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.meta-placeholder {
  color: #9CA3AF;
}

.merchant-arrow {
  width: 20px;
  height: 20px;
  color: #9CA3AF;
  flex-shrink: 0;
}

.merchant-arrow svg {
  width: 100%;
  height: 100%;
}
</style>

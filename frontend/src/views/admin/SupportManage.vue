<template>
  <div class="support-manage-page">
    <div class="page-header">
      <h1 class="page-title">赞助管理</h1>
      <p class="page-subtitle">管理赞助记录和金额</p>
    </div>

    <!-- 赞助记录列表 -->
    <div class="list-section">
      <div class="list-header">
        <van-icon name="gift" class="list-icon" />
        <span class="list-title">赞助记录</span>
        <span class="list-count" v-if="records.length > 0">{{ records.length }} 条</span>
      </div>

      <div v-if="loading" class="loading-state">
        <van-loading color="#EA580C">加载中...</van-loading>
      </div>

      <div v-else-if="records.length === 0" class="empty-state">
        <van-empty description="暂无赞助记录" />
      </div>

      <div v-else class="list">
        <div
          v-for="item in records"
          :key="item.id"
          class="record-card"
        >
          <div class="record-header">
            <div class="record-info">
              <span class="user-email">{{ item.user?.email || '未知用户' }}</span>
              <span class="user-nickname" v-if="item.user?.nickname">（{{ item.user?.nickname }}）</span>
              <span class="record-amount">¥{{ item.amount }}</span>
            </div>
            <van-tag :type="getStatusType(item.status)">
              {{ getStatusText(item.status) }}
            </van-tag>
          </div>

          <div class="record-meta">
            <span class="meta-item">
              <van-icon name="user-o" />
              {{ item.user?.phone || '未绑定手机' }}
            </span>
            <span class="meta-item">
              <van-icon name="clock-o" />
              {{ formatDate(item.createdAt) }}
            </span>
          </div>

          <!-- 赞助人名称显示 -->
          <div v-if="item.sponsorName" class="sponsor-name-display">
            <van-icon name="star" />
            <span>赞助榜单显示：{{ item.sponsorName }}</span>
          </div>

          <div v-if="item.message" class="record-message">
            {{ item.message }}
          </div>

          <div class="record-actions">
            <van-button
              size="mini"
              plain
              type="warning"
              @click="openEditNicknameDialog(item)"
            >
              设置赞助人名称
            </van-button>
            <van-button
              size="mini"
              plain
              type="primary"
              @click="openEditDialog(item)"
            >
              修改金额
            </van-button>
            <van-button
              size="mini"
              plain
              type="danger"
              @click="deleteRecord(item.id)"
            >
              删除
            </van-button>
            <van-button
              v-if="item.status !== 'approved'"
              size="mini"
              type="success"
              @click="approveRecord(item)"
            >
              通过
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改金额弹窗 -->
    <van-dialog
      v-model:show="showEditDialog"
      title="修改赞助金额"
      :show-confirm-button="false"
    >
      <div class="edit-dialog">
        <van-field
          v-model="editForm.amount"
          type="number"
          label="金额"
          placeholder="请输入新金额"
        />
        <div class="edit-actions">
          <van-button plain block round @click="showEditDialog = false">取消</van-button>
          <van-button type="primary" block round @click="confirmEdit" :loading="updating">
            {{ updating ? '更新中...' : '确认修改' }}
          </van-button>
        </div>
      </div>
    </van-dialog>

    <!-- 设置赞助人名称弹窗 -->
    <van-dialog
      v-model:show="showEditNicknameDialog"
      title="设置赞助人名称"
      :show-confirm-button="false"
    >
      <div class="edit-dialog">
        <van-field
          v-model="editNicknameForm.nickname"
          type="text"
          label="名称"
          placeholder="请输入在赞助榜单显示的名称"
          clearable
        />
        <div class="edit-actions">
          <van-button plain block round @click="showEditNicknameDialog = false">取消</van-button>
          <van-button type="primary" block round @click="confirmEditNickname" :loading="updatingNickname">
            {{ updatingNickname ? '更新中...' : '确认设置' }}
          </van-button>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import http from '../../api/http'

const records = ref<any[]>([])
const loading = ref(false)
const showEditDialog = ref(false)
const showEditNicknameDialog = ref(false)
const updating = ref(false)
const updatingNickname = ref(false)
const editForm = ref({ recordId: '', amount: '' })
const editNicknameForm = ref({ recordId: '', nickname: '' })

const loadRecords = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/api/support/admin/records')
    if (data.success) {
      records.value = data.records || []
    } else {
      showToast(data.message || '加载失败')
    }
  } catch {
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'primary'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    default: return '待审核'
  }
}

const openEditDialog = (record: any) => {
  editForm.value = {
    recordId: record.id,
    amount: String(record.amount)
  }
  showEditDialog.value = true
}

const openEditNicknameDialog = (record: any) => {
  editNicknameForm.value = {
    recordId: record.id,
    nickname: record.sponsorName || ''
  }
  showEditNicknameDialog.value = true
}

const confirmEditNickname = async () => {
  updatingNickname.value = true
  try {
    const { data } = await http.post('/api/support/admin/update-nickname', {
      recordId: Number(editNicknameForm.value.recordId),
      nickname: editNicknameForm.value.nickname
    })

    if (data.success) {
      showToast('赞助人名称已更新')
      showEditNicknameDialog.value = false
      loadRecords()
    } else {
      showToast(data.message || '修改失败')
    }
  } catch {
    showToast('修改失败，请重试')
  } finally {
    updatingNickname.value = false
  }
}

const confirmEdit = async () => {
  if (!editForm.value.amount || Number(editForm.value.amount) < 1) {
    showToast('金额必须大于 0')
    return
  }

  updating.value = true
  try {
    const { data } = await http.post('/api/support/admin/update', {
      recordId: editForm.value.recordId,
      amount: editForm.value.amount
    })

    if (data.success) {
      showToast('修改成功')
      showEditDialog.value = false
      loadRecords()
    } else {
      showToast(data.message || '修改失败')
    }
  } catch {
    showToast('修改失败，请重试')
  } finally {
    updating.value = false
  }
}

const deleteRecord = async (recordId: number) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      content: '确定要删除这条赞助记录吗？此操作不可恢复。'
    })

    const { data } = await http.post('/api/support/admin/delete', { recordId })
    if (data.success) {
      showToast('删除成功')
      loadRecords()
    } else {
      showToast(data.message || '删除失败')
    }
  } catch (e: any) {
    if (e?.message !== 'cancel') {
      showToast('删除失败，请重试')
    }
  }
}

const approveRecord = async (record: any) => {
  const vipDays = prompt('请输入 VIP 天数（输入 0 表示只赞助，不开通 VIP）', '0')
  if (vipDays === null) return
  if (vipDays === '') {
    showToast('请输入 VIP 天数')
    return
  }

  const days = Number(vipDays)
  if (isNaN(days) || days < 0) {
    showToast('VIP 天数必须是非负整数')
    return
  }

  try {
    const { data } = await http.post('/api/support/admin/approve', {
      recordId: record.id,
      vipDays: days
    })

    if (data.success) {
      showToast(days > 0 ? `审核通过，VIP 已开通 ${days} 天` : '审核通过，赞助已记录（未开通 VIP）')
      loadRecords()
    } else {
      showToast(data.message || '操作失败')
    }
  } catch {
    showToast('操作失败，请重试')
  }
}

const formatDate = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString('zh-CN')
}

onMounted(loadRecords)
</script>

<style scoped>
.support-manage-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%);
  padding: 24px 16px;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
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

.list-section {
  background: white;
  border-radius: 20px;
  padding: 20px 16px;
  box-shadow: 0 4px 16px rgba(234, 88, 12, 0.08);
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
  color: #EA580C;
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

.loading-state {
  padding: 40px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-state {
  padding: 40px 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-card {
  background: #f9fafb;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid #f3f4f6;
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.record-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.user-email {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.user-nickname {
  font-size: 13px;
  color: #6B7280;
}

.record-amount {
  font-size: 16px;
  font-weight: 700;
  color: #EA580C;
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6B7280;
}

.sponsor-name-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #EA580C;
  background: #FFF7ED;
  padding: 6px 10px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.sponsor-name-display .van-icon {
  font-size: 14px;
  color: #EA580C;
}

.record-message {
  font-size: 13px;
  color: #4B5563;
  background: white;
  padding: 8px 10px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.record-actions {
  display: flex;
  gap: 8px;
}

.record-actions .van-button {
  flex: 1;
  height: 32px;
  font-size: 12px;
}

.edit-dialog {
  padding: 16px;
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.edit-actions .van-button {
  flex: 1;
  height: 40px;
}
</style>

<template>
  <div class="part-time-manage-page">
    <div class="page-header">
      <h1 class="page-title">兼职管理</h1>
      <p class="page-subtitle">管理兼职信息发布时间</p>
    </div>

    <!-- 发布兼职按钮 -->
    <div class="action-section">
      <van-button type="primary" block round @click="openCreateDialog">
        <van-icon name="plus" />
        发布兼职
      </van-button>
    </div>

    <!-- 兼职列表 -->
    <div class="list-section">
      <div class="list-header">
        <van-icon name="bag-o" class="list-icon" />
        <span class="list-title">兼职信息</span>
        <span class="list-count" v-if="jobs.length > 0">{{ jobs.length }} 条</span>
      </div>

      <div v-if="loading" class="loading-state">
        <van-loading color="#059669">加载中...</van-loading>
      </div>

      <div v-else-if="jobs.length === 0" class="empty-state">
        <van-empty description="暂无兼职信息" />
      </div>

      <div v-else class="list">
        <div
          v-for="item in jobs"
          :key="item.id"
          class="job-card"
        >
          <div class="job-header">
            <div class="job-info">
              <span class="job-name">{{ item.name }}</span>
              <van-tag :type="item.isActive ? 'success' : 'danger'" size="medium">
                {{ item.isActive ? '展示中' : '已下架' }}
              </van-tag>
            </div>
          </div>

          <div class="job-meta">
            <span class="meta-item">
              <van-icon name="gender-male-female" />
              {{ item.gender }}
            </span>
            <span class="meta-item">
              <van-icon name="label-o" />
              {{ item.type }}
            </span>
            <span class="meta-item">
              <van-icon name="clock-o" />
              {{ item.expireAt ? '有效期至 ' + formatDate(item.expireAt) : '长期有效' }}
            </span>
          </div>

          <div v-if="item.contact" class="job-contact">
            <van-icon name="phone" />
            <span>{{ item.contact }}</span>
          </div>

          <div class="job-actions">
            <van-button
              size="mini"
              :type="item.isActive ? 'warning' : 'success'"
              @click="toggleJobStatus(item)"
            >
              {{ item.isActive ? '下架' : '上架' }}
            </van-button>
            <van-button
              size="mini"
              type="primary"
              @click="openEditDialog(item)"
            >
              编辑
            </van-button>
            <van-button
              size="mini"
              type="danger"
              @click="deleteJob(item.id)"
            >
              删除
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑/创建弹窗 -->
    <van-dialog
      v-model:show="showEditDialog"
      :title="isEdit ? '编辑兼职' : '发布兼职'"
      :show-confirm-button="false"
    >
      <div class="edit-dialog">
        <van-field
          v-model="form.name"
          label="名称"
          placeholder="请输入兼职名称"
          clearable
        />
        <van-field
          v-model="form.gender"
          label="性别"
          placeholder="请选择性别要求"
          readonly
          @click="showGenderPicker = true"
        />
        <van-popup v-model:show="showGenderPicker" position="bottom" round>
          <van-picker
            :columns="genderOptions"
            :default-index="0"
            @confirm="onGenderConfirm"
            @cancel="showGenderPicker = false"
          />
        </van-popup>
        <van-field
          v-model="form.type"
          label="种类"
          placeholder="例如：家教/促销/服务员"
          clearable
        />
        <van-field
          v-model="form.description"
          type="textarea"
          rows="2"
          label="介绍"
          placeholder="兼职详细介绍"
          clearable
        />
        <van-field
          v-model="form.priceList"
          type="textarea"
          rows="2"
          label="价格表"
          placeholder="兼职价格表"
          clearable
        />
        <van-field
          v-model="form.contact"
          label="联系方式"
          placeholder="手机号/微信号"
          clearable
        />
        <van-field
          v-model="form.expireAt"
          type="datetime-local"
          label="到期时间"
          placeholder="选择到期时间（留空表示长期）"
        />
        <van-field
          v-if="isEdit"
          :value="form.isActive ? '是' : '否'"
          label="状态"
          readonly
        />
        <div class="edit-actions">
          <van-button plain block round @click="showEditDialog = false">取消</van-button>
          <van-button type="primary" block round @click="confirmEdit" :loading="submitting">
            {{ submitting ? '提交中...' : (isEdit ? '确认修改' : '确认发布') }}
          </van-button>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import http from '../../api/http'

const jobs = ref<any[]>([])
const loading = ref(false)
const showEditDialog = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const showGenderPicker = ref(false)

const genderOptions = [
  { text: '不限', value: '不限' },
  { text: '男', value: '男' },
  { text: '女', value: '女' }
]

const form = ref({
  id: null as number | null,
  name: '',
  gender: '不限',
  type: '',
  description: '',
  priceList: '',
  contact: '',
  expireAt: '',
  isActive: true
})

const loadJobs = async () => {
  loading.value = true
  try {
    const { data } = await http.get('/api/part-time-jobs/admin/list')
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

const openCreateDialog = () => {
  isEdit.value = false
  form.value = {
    id: null,
    name: '',
    gender: '不限',
    type: '',
    description: '',
    priceList: '',
    contact: '',
    expireAt: '',
    isActive: true
  }
  showEditDialog.value = true
}

const openEditDialog = (job: any) => {
  isEdit.value = true
  form.value = {
    id: job.id,
    name: job.name,
    gender: job.gender || '不限',
    type: job.type,
    description: job.description || '',
    priceList: job.priceList || '',
    contact: job.contact,
    expireAt: job.expireAt ? new Date(job.expireAt).toISOString().slice(0, 16) : '',
    isActive: job.isActive === 1
  }
  showEditDialog.value = true
}

const onGenderConfirm = (value: any) => {
  form.value.gender = value
  showGenderPicker.value = false
}

const confirmEdit = async () => {
  if (!form.value.name || !form.value.contact) {
    showToast('名称和联系方式必填')
    return
  }

  submitting.value = true
  try {
    const { data } = await http.post(
      isEdit.value ? '/api/part-time-jobs/admin/update' : '/api/part-time-jobs/admin/create',
      {
        ...form.value,
        expireAt: form.value.expireAt || null
      }
    )

    if (data.success) {
      showToast(isEdit.value ? '修改成功' : '发布成功')
      showEditDialog.value = false
      loadJobs()
    } else {
      showToast(data.message || '操作失败')
    }
  } catch {
    showToast('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

const toggleJobStatus = async (job: any) => {
  submitting.value = true
  try {
    const { data } = await http.post('/api/part-time-jobs/admin/update', {
      id: job.id,
      isActive: !job.isActive
    })

    if (data.success) {
      showToast(job.isActive ? '已下架' : '已上架')
      loadJobs()
    } else {
      showToast(data.message || '操作失败')
    }
  } catch {
    showToast('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

const deleteJob = async (jobId: number) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      content: '确定要删除这条兼职信息吗？此操作不可恢复。'
    })

    const { data } = await http.post('/api/part-time-jobs/admin/delete', { id: jobId })
    if (data.success) {
      showToast('删除成功')
      loadJobs()
    } else {
      showToast(data.message || '删除失败')
    }
  } catch (e: any) {
    if (e?.message !== 'cancel') {
      showToast('删除失败，请重试')
    }
  }
}

const formatDate = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString('zh-CN')
}

onMounted(loadJobs)
</script>

<style scoped>
.part-time-manage-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ECFCCB 0%, #D9F99D 100%);
  padding: 24px 16px;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
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

.action-section {
  margin-bottom: 16px;
}

.action-section .van-button {
  height: 44px;
  font-size: 15px;
  background: linear-gradient(135deg, #84CC16 0%, #65A30D 100%);
  border: none;
}

.list-section {
  background: white;
  border-radius: 20px;
  padding: 20px 16px;
  box-shadow: 0 4px 16px rgba(77, 124, 15, 0.08);
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
  color: #059669;
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

.job-card {
  background: #f9fafb;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid #e5e7eb;
}

.job-header {
  margin-bottom: 10px;
}

.job-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  margin-bottom: 10px;
}

.job-contact .van-icon {
  font-size: 16px;
}

.job-actions {
  display: flex;
  gap: 8px;
}

.job-actions .van-button {
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

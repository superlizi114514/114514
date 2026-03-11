<template>
  <div class="set-password-page">
    <!-- Header -->
    <div class="page-header">
      <div class="icon-wrapper">
        <van-icon name="lock" class="header-icon" />
      </div>
      <h1 class="page-title">设置密码</h1>
      <p class="page-subtitle">首次登录请设置登录密码</p>
    </div>

    <!-- Form Card -->
    <div class="form-card">
      <div class="form-header">
        <van-icon name="shield-check" class="form-icon" />
        <span class="form-title">设置密码</span>
      </div>
      <van-form @submit="onSubmit">
        <van-field
          v-model="form.password"
          type="password"
          label="密码"
          placeholder="请输入 6 位以上密码"
          :rules="[{ required: true, message: '请输入密码' }, { minLength: 6, message: '密码至少 6 位' }]"
        />

        <van-field
          v-model="form.confirmPassword"
          type="password"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="[{ required: true, message: '请确认密码' }]"
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
            {{ submitting ? '设置中...' : '设置密码' }}
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- Tips -->
    <div class="tips-section">
      <van-icon name="information-o" class="tips-icon" />
      <div class="tips-content">
        <p class="tips-text">密码设置后可用于：</p>
        <ul class="tips-list">
          <li>快速登录账号</li>
          <li>提升账号安全性</li>
          <li>忘记密码时可找回</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'
import http from '../api/http'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref({
  password: '',
  confirmPassword: ''
})

const submitting = ref(false)

const onSubmit = async () => {
  if (!form.value.password || form.value.password.length < 6) {
    showToast('密码至少 6 位')
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    showToast('两次输入的密码不一致')
    return
  }

  submitting.value = true
  try {
    const { data } = await http.post('/api/auth/set-password', {
      password: form.value.password,
      confirmPassword: form.value.confirmPassword
    })

    if (data.success) {
      showToast('密码设置成功')
      setTimeout(() => {
        router.push('/')
      }, 500)
    } else {
      showToast(data.message || '设置失败')
    }
  } catch {
    showToast('设置失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.set-password-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #F0FDF4 0%, #BBF7D0 100%);
  padding: 40px 20px 24px;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.icon-wrapper {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
}

.header-icon {
  font-size: 36px;
  color: white;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #166534;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #15803D;
  margin: 0;
  opacity: 0.8;
}

/* Form Card */
.form-card {
  background: white;
  border-radius: 20px;
  padding: 24px 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.08);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.form-icon {
  font-size: 20px;
  color: #22C55E;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

.submit-section {
  margin-top: 20px;
}

.submit-btn {
  height: 48px;
  font-weight: 600;
  background: linear-gradient(135deg, #4ADE80 0%, #22C55E 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
}

/* Tips Section */
.tips-section {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.08);
}

.tips-icon {
  font-size: 20px;
  color: #22C55E;
  flex-shrink: 0;
}

.tips-content {
  flex: 1;
}

.tips-text {
  font-size: 13px;
  color: #374151;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.tips-list {
  margin: 0;
  padding-left: 16px;
}

.tips-list li {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}
</style>

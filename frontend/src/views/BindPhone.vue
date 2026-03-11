<template>
  <div class="bind-phone-page">
    <!-- Header -->
    <div class="page-header">
      <div class="icon-wrapper">
        <van-icon name="phone-circle-o" class="header-icon" />
      </div>
      <h1 class="page-title">绑定手机号</h1>
      <p class="page-subtitle">用于账号找回和安全验证</p>
    </div>

    <!-- Form Card -->
    <div class="form-card">
      <div class="form-header">
        <van-icon name="shield-check" class="form-icon" />
        <span class="form-title">验证手机号</span>
      </div>
      <van-form @submit="onSubmit">
        <van-field
          v-model="form.phone"
          type="tel"
          label="手机号"
          placeholder="请输入 11 位手机号"
          maxlength="11"
          :rules="[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]"
        />

        <van-field
          v-model="form.code"
          label="验证码"
          placeholder="输入 6 位短信验证码"
          maxlength="6"
          :rules="[{ required: true, message: '请输入验证码' }]"
        >
          <template #button>
            <van-button
              class="send-code-btn"
              size="small"
              type="primary"
              :disabled="countdown > 0"
              :loading="sending"
            >
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </van-button>
          </template>
        </van-field>

        <div class="submit-section">
          <van-button
            class="submit-btn"
            type="primary"
            block
            round
            native-type="submit"
            :loading="submitting"
          >
            {{ submitting ? '绑定中...' : '绑定手机号' }}
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- Tips -->
    <div class="tips-section">
      <van-icon name="information-o" class="tips-icon" />
      <div class="tips-content">
        <p class="tips-text">绑定手机号可以帮助您：</p>
        <ul class="tips-list">
          <li>快速找回账号</li>
          <li>接收重要通知</li>
          <li>提升账号安全性</li>
        </ul>
      </div>
    </div>

    <!-- Skip Button -->
    <div class="skip-section">
      <van-button class="skip-btn" plain block round @click="$router.push('/')">
        暂不绑定，返回首页
      </van-button>
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
  phone: '',
  code: ''
})

const countdown = ref(0)
const sending = ref(false)
const submitting = ref(false)

const sendCode = async () => {
  if (!form.value.phone || form.value.phone.length !== 11) {
    showToast('请输入正确的手机号')
    return
  }

  sending.value = true
  try {
    const { data } = await http.post('/api/auth/send-phone-code', {
      phone: form.value.phone,
      type: 'bind'
    })

    if (data.success) {
      showToast('验证码已发送')
      startCountdown()
    } else {
      showToast(data.message || '发送失败')
    }
  } catch {
    showToast('发送失败，请重试')
  } finally {
    sending.value = false
  }
}

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const onSubmit = async () => {
  if (!form.value.code || form.value.code.length !== 6) {
    showToast('请输入 6 位验证码')
    return
  }

  submitting.value = true
  try {
    const { data } = await http.post('/api/auth/bind-phone', {
      phone: form.value.phone,
      code: form.value.code
    })

    if (data.success) {
      showToast('绑定成功')
      setTimeout(() => {
        router.push('/')
      }, 500)
    } else {
      showToast(data.message || '绑定失败')
    }
  } catch {
    showToast('绑定失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.bind-phone-page {
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

.send-code-btn {
  background: linear-gradient(135deg, #4ADE80 0%, #22C55E 100%);
  border: none;
  height: 32px;
  font-weight: 500;
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

/* Skip Section */
.skip-section {
  padding-top: 8px;
}

.skip-btn {
  height: 44px;
  border-color: #86EFAC;
  color: #166534;
  font-weight: 500;
}
</style>

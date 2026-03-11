<template>
  <div class="invite-login-page">
    <div class="header">
      <h1>邀请码登录</h1>
      <p>使用邀请码快速注册登录</p>
    </div>

    <div class="content-card">
      <van-form @submit="onSubmit">
        <van-field
          v-model="form.code"
          name="code"
          label="邀请码"
          type="text"
          placeholder="请输入邀请码"
          clearable
          :rules="[{ required: true, message: '请填写邀请码' }]"
        />

        <div v-if="inviteInfo" class="invite-info">
          <van-icon name="checked" style="color: #07c160;" />
          <span>有效邀请码，创建者：{{ inviteInfo }}</span>
        </div>

        <van-field
          v-model="form.password"
          name="password"
          type="password"
          label="密码"
          placeholder="请设置登录密码"
          :rules="[{ required: true, message: '请填写密码' }, { pattern: /^.{6,}$/, message: '密码至少 6 位' }]"
        />

        <van-field
          v-model="form.confirmPassword"
          name="confirmPassword"
          type="password"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="[{ required: true, message: '请确认密码' }, { validator: validatePasswordMatch, message: '两次密码不一致' }]"
        />

        <div class="hint">
          <van-icon name="info-o" />
          <span>使用邀请码注册后，可使用邀请码@形式登录</span>
        </div>

        <van-button round block type="primary" native-type="submit" :loading="loading">
          {{ loading ? '处理中...' : '登录/注册' }}
        </van-button>

        <van-button round block type="default" @click="$router.push('/login')" style="margin-top: 12px;">
          返回普通登录
        </van-button>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'
import http from '../api/http'

const router = useRouter()

const form = ref({
  code: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const inviteInfo = ref('')

const validatePasswordMatch = (val: string) => val === form.value.password

const verifyInviteCode = async () => {
  if (!form.value.code) return

  try {
    const { data } = await http.post('/api/invite-codes/verify', {
      code: form.value.code
    })
    if (data.success) {
      inviteInfo.value = data.creatorName
      return true
    } else {
      inviteInfo.value = ''
      showToast(data.message || '邀请码无效')
      return false
    }
  } catch {
    inviteInfo.value = ''
    showToast('邀请码验证失败')
    return false
  }
}

const onSubmit = async () => {
  // 先验证邀请码
  const verified = await verifyInviteCode()
  if (!verified) return

  if (form.value.password !== form.value.confirmPassword) {
    showToast('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const { data } = await http.post('/api/invite-codes/use', {
      code: form.value.code,
      password: form.value.password
    })

    if (data.success) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      showToast('登录成功')
      setTimeout(() => {
        router.push('/')
      }, 500)
    } else {
      showToast(data.message || '登录失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.invite-login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 24px 16px;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 24px;
  font-weight: 800;
  color: #0c4a6e;
  margin: 0 0 8px 0;
}

.header p {
  font-size: 14px;
  color: #0284c7;
  margin: 0;
}

.content-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);
}

.invite-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #ecfdf5;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #047857;
}

.hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
  margin: 16px 0;
}

.hint .van-icon {
  font-size: 12px;
}
</style>

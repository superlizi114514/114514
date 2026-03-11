<template>
  <div class="login-page">
    <!-- Logo & Title -->
    <div class="brand-section">
      <div class="logo-wrapper">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      </div>
      <h1 class="page-title">欢迎回来</h1>
      <p class="page-subtitle">{{ loginType === 'password' ? '使用密码登录山信黑红榜' : '使用邮箱验证码登录/注册' }}</p>
    </div>

    <!-- Login Type Switcher -->
    <div class="login-type-switcher">
      <div
        class="switch-btn"
        :class="{ active: loginType === 'password' }"
        @click="loginType = 'password'"
      >
        密码登录
      </div>
      <div
        class="switch-btn"
        :class="{ active: loginType === 'code' }"
        @click="loginType = 'code'"
      >
        验证码登录
      </div>
      <div
        class="switch-btn"
        :class="{ active: loginType === 'invite' }"
        @click="loginType = 'invite'"
      >
        邀请码登录
      </div>
    </div>

    <!-- 邀请码登录提示 -->
    <div v-if="loginType === 'invite'" class="invite-tips">
      <van-icon name="bullhorn" class="tips-icon" />
      <span class="tips-text">没有邀请码？加 V: </span>
      <a class="wechat-link" href="javascript:;" @click="copyWechat">SiNianNiQWQ</a>
      <span class="tips-text"> 免费获取</span>
    </div>

    <!-- Login Form -->
    <div class="form-card">
      <!-- 邀请码登录表单 -->
      <template v-if="loginType === 'invite'">
        <van-form @submit="onInviteSubmit">
          <van-field
            v-model="inviteForm.code"
            label="邀请码"
            placeholder="请输入邀请码"
            clearable
            :rules="[{ required: true, message: '请填写邀请码' }]"
            left-icon="gift-o"
          />

          <van-field
            v-model="inviteForm.password"
            type="password"
            label="密码"
            placeholder="请设置登录密码（6-20 位）"
            :rules="[{ required: true, message: '请填写密码' }, { pattern: /^.{6,20}$/, message: '密码 6-20 位' }]"
            left-icon="lock-o"
          />

          <van-field
            v-model="inviteForm.confirmPassword"
            type="password"
            label="确认密码"
            placeholder="请再次输入密码"
            :rules="[{ required: true, message: '请确认密码' }, { validator: validatePasswordMatch, message: '两次密码不一致' }]"
            left-icon="lock-o"
          />

          <div class="invite-hint">
            <van-icon name="info-o" />
            <span>使用邀请码注册后，可使用 <strong>邀请码@invite</strong> 形式登录</span>
          </div>

          <div class="submit-section">
            <van-button
              class="submit-btn"
              type="primary"
              block
              round
              native-type="submit"
              :loading="submitting"
            >
              {{ submitting ? '处理中...' : '登录/注册' }}
            </van-button>
          </div>
        </van-form>
      </template>

      <!-- 密码/验证码登录表单 -->
      <template v-else>
        <van-form @submit="onSubmit">
          <van-field
            v-model="form.email"
            type="text"
            label="邮箱"
            placeholder="请输入邮箱地址"
            :rules="emailRules"
            left-icon="envelop-o"
          />

          <!-- 密码输入框（密码登录模式） -->
          <van-field
            v-if="loginType === 'password'"
            v-model="form.password"
            type="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
            left-icon="lock-o"
          />

          <!-- 图形验证码（验证码登录模式） -->
          <van-field
            v-if="loginType === 'code'"
            v-model="form.captcha"
            label="验证码"
            placeholder="输入图形验证码"
            :rules="[{ required: true, message: '请输入验证码' }]"
            left-icon="shield-o"
          >
            <template #button>
              <div class="captcha-wrapper">
                <img class="captcha-image" :src="captchaImage" alt="captcha" @click="loadCaptcha" />
              </div>
            </template>
          </van-field>

          <!-- 邮箱验证码（验证码登录模式） -->
          <van-field
            v-if="loginType === 'code'"
            v-model="form.code"
            label="验证码"
            type="text"
            placeholder="输入 6 位邮箱验证码"
            maxlength="6"
            :rules="[{ required: true, message: '请输入邮箱验证码' }]"
            left-icon="mail-o"
          >
            <template #button>
              <van-button
                class="send-code-btn"
                size="small"
                type="primary"
                :disabled="countdown > 0"
                :loading="sending"
                @click="sendCode"
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
              {{ submitting ? (loginType === 'password' ? '登录中...' : '验证中...') : (loginType === 'password' ? '立即登录' : '获取验证码') }}
            </van-button>
          </div>
        </van-form>
      </template>
    </div>

    <!-- Tips -->
    <div class="tips-section">
      <van-icon name="information-o" class="tips-icon" />
      <span class="tips-text">
        <template v-if="loginType === 'password'">忘记密码请使用验证码登录</template>
        <template v-else-if="loginType === 'code'">首次登录将自动注册，需设置密码</template>
        <template v-else>推荐使用邮箱验证登录，无需邀请码</template>
      </span>
    </div>

    <!-- Back to Home -->
    <div class="back-section">
      <van-button class="back-btn" size="small" plain block @click="$router.push('/')">
        返回首页
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showToast, showNotify } from 'vant'
import http from '../api/http'
import { useRouter } from 'vue-router'

const router = useRouter()

// 登录类型：'password' - 密码登录，'code' - 验证码登录，'invite' - 邀请码登录
const loginType = ref<'password' | 'code' | 'invite'>('code')

const form = ref({
  email: '',
  password: '',
  captcha: '',
  code: ''
})

const inviteForm = ref({
  code: '',
  password: '',
  confirmPassword: ''
})

const emailRules = [
  { required: true, message: '请输入邮箱' },
  {
    message: '邮箱格式不正确',
    validator: (value: string) => {
      // 允许特殊邮箱格式：admin@admin
      if (value === 'admin@admin') return true
      // 允许邀请码格式：xxx@yyy@invite
      if (value.endsWith('@invite')) return true
      // 标准邮箱格式验证
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }
  }
]

const captchaImage = ref('')
const captchaSession = ref('')
const countdown = ref(0)
const sending = ref(false)
const submitting = ref(false)

const loadCaptcha = async () => {
  try {
    const { data } = await http.get('/api/auth/captcha')
    if (data.success) {
      captchaImage.value = data.image
      captchaSession.value = data.sessionId
    }
  } catch {
    showToast('验证码加载失败')
  }
}

const sendCode = async () => {
  if (!form.value.email || !form.value.captcha) {
    showToast('请先填写邮箱和图形验证码')
    return
  }

  sending.value = true
  try {
    const { data } = await http.post('/api/auth/send-email-code', {
      email: form.value.email,
      captchaCode: form.value.captcha,
      captchaSession: captchaSession.value
    })

    if (data.success) {
      showToast('验证码已发送到邮箱')
      startCountdown()
    } else {
      showToast(data.message || '发送失败')
      await loadCaptcha()
    }
  } catch {
    showToast('发送失败，请重试')
    await loadCaptcha()
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

const copyWechat = () => {
  const wechat = 'SiNianNiQWQ'
  navigator.clipboard.writeText(wechat).then(() => {
    showNotify({ type: 'success', message: '已复制微信号', duration: 2000 })
  }).catch(() => {
    showToast('复制失败，请手动复制')
  })
}

// 邀请码密码验证函数
const validatePasswordMatch = (val: string): boolean => {
  return val === inviteForm.value.password
}

const onInviteSubmit = async () => {
  if (!inviteForm.value.code || !inviteForm.value.password) {
    showToast('请填写邀请码和密码')
    return
  }

  if (inviteForm.value.password !== inviteForm.value.confirmPassword) {
    showToast('两次输入的密码不一致')
    return
  }

  submitting.value = true
  try {
    const { data } = await http.post('/api/invite-codes/use', {
      code: inviteForm.value.code,
      password: inviteForm.value.password
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
    submitting.value = false
  }
}

const onSubmit = async () => {
  if (loginType.value === 'password') {
    // 密码登录
    if (!form.value.password) {
      showToast('请输入密码')
      return
    }

    submitting.value = true
    try {
      const { data } = await http.post('/api/auth/login', {
        email: form.value.email,
        password: form.value.password
      })

      if (data.success) {
        // 清除旧的缓存
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        // 保存新的 token 和用户信息
        localStorage.setItem('token', data.token)
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        showToast('登录成功')
        setTimeout(() => {
          router.push('/')
        }, 500)
      } else {
        showToast(data.message || '登录失败')
      }
    } catch {
      showToast('登录失败，请重试')
    } finally {
      submitting.value = false
    }
  } else {
    // 验证码登录/注册
    const codeLen = form.value.code.length

    if (!form.value.code || codeLen !== 6) {
      showToast('请输入 6 位邮箱验证码')
      return
    }

    submitting.value = true
    try {
      const { data } = await http.post('/api/auth/login', {
        email: form.value.email,
        code: form.value.code
      })

      if (data.success) {
        // 清除旧的缓存
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        // 保存新的 token 和用户信息
        localStorage.setItem('token', data.token)
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        showToast('登录成功')

        // 检查是否需要设置密码
        if (data.needSetPassword) {
          setTimeout(() => {
            router.push('/set-password')
          }, 500)
        } else {
          setTimeout(() => {
            router.push('/')
          }, 500)
        }
      } else {
        showToast(data.message || '登录失败')
        await loadCaptcha()
      }
    } catch {
      showToast('登录失败，请重试')
      await loadCaptcha()
    } finally {
      submitting.value = false
    }
  }
}

onMounted(() => {
  loadCaptcha()
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%);
  padding: 40px 20px 24px;
  display: flex;
  flex-direction: column;
}

/* Brand Section */
.brand-section {
  text-align: center;
  margin-bottom: 24px;
}

.logo-wrapper {
  margin-bottom: 20px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background: linear-gradient(135deg, #FB7185 0%, #E11D48 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(225, 29, 72, 0.3);
}

.logo-icon svg {
  width: 44px;
  height: 44px;
  color: white;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #881337;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: #9F1239;
  margin: 0;
  opacity: 0.8;
}

/* Login Type Switcher */
.login-type-switcher {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.08);
}

.switch-btn {
  flex: 1;
  text-align: center;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.switch-btn.active {
  background: linear-gradient(135deg, #FB7185 0%, #E11D48 100%);
  color: white;
  font-weight: 600;
}

/* Invite Tips */
.invite-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  font-size: 13px;
}

.tips-icon {
  font-size: 16px;
  color: #FB7185;
}

.tips-text {
  color: #9F1239;
}

.wechat-link {
  color: #E11D48;
  font-weight: 600;
  text-decoration: underline;
}

/* Form Card */
.form-card {
  background: white;
  border-radius: 24px;
  padding: 24px 20px;
  box-shadow: 0 8px 32px rgba(225, 29, 72, 0.12);
}

.send-code-btn {
  background: linear-gradient(135deg, #FB7185 0%, #E11D48 100%);
  border: none;
  height: 32px;
  font-weight: 500;
}

.captcha-wrapper {
  display: flex;
  align-items: center;
}

.captcha-image {
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid #f3f4f6;
  transition: border-color 0.2s;
}

.captcha-image:hover {
  border-color: #FB7185;
}

.submit-section {
  margin-top: 24px;
}

.submit-btn {
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #FB7185 0%, #E11D48 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(225, 29, 72, 0.3);
}

/* Tips Section */
.tips-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
}

.tips-icon {
  font-size: 16px;
  color: #FB7185;
}

.tips-text {
  font-size: 12px;
  color: #9F1239;
}

/* Back Section */
.back-section {
  margin-top: auto;
  padding-top: 20px;
}

.back-btn {
  height: 40px;
  border-color: #FECDD3;
  color: #9F1239;
  font-weight: 500;
}

/* Invite Link Section */
.invite-link-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.invite-text {
  font-size: 13px;
  color: #9F1239;
}

.invite-link {
  font-size: 13px;
  color: #E11D48;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.invite-link:hover {
  color: #FB7185;
}

/* Invite Form Styles */
.invite-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9F1239;
  background: rgba(251, 113, 133, 0.1);
  padding: 10px 12px;
  border-radius: 8px;
  margin: 16px 0;
}

.invite-hint .van-icon {
  font-size: 12px;
  color: #FB7185;
}

.invite-hint strong {
  color: #E11D48;
}
</style>

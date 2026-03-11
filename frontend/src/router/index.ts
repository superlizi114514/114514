import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import BindPhone from '../views/BindPhone.vue'
import SetPassword from '../views/SetPassword.vue'
import Profiles from '../views/Profiles.vue'
import ProfileReviews from '../views/ProfileReviews.vue'
import ProfileRankings from '../views/ProfileRankings.vue'
import Search from '../views/Search.vue'
import AdminReports from '../views/AdminReports.vue'
import About from '../views/About.vue'
import Support from '../views/Support.vue'
import Guide from '../views/Guide.vue'
import Merchants from '../views/Merchants.vue'
import MerchantReviews from '../views/MerchantReviews.vue'
import Settings from '../views/Settings.vue'
import InviteLogin from '../views/InviteLogin.vue'
import AdminHome from '../views/AdminHome.vue'
import SupportManage from '../views/admin/SupportManage.vue'
import MerchantRankings from '../views/MerchantRankings.vue'
import PartTimeJobs from '../views/PartTimeJobs.vue'
import PartTimeJobManage from '../views/admin/PartTimeJobManage.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/login', name: 'login', component: Login },
  { path: '/set-password', name: 'set-password', component: SetPassword },
  { path: '/bind-phone', name: 'bind-phone', component: BindPhone },
  { path: '/profiles', name: 'profiles', component: Profiles },
  { path: '/profiles/:id', name: 'profile-reviews', component: ProfileReviews },
  { path: '/rankings/profile', name: 'profile-rankings', component: ProfileRankings },
  { path: '/search', name: 'search', component: Search },
  { path: '/admin/reports', name: 'admin-reports', component: AdminReports },
  { path: '/merchants', name: 'merchants', component: Merchants },
  { path: '/merchants/:id', name: 'merchant-reviews', component: MerchantReviews },
  { path: '/about', name: 'about', component: About },
  { path: '/support', name: 'support', component: Support },
  { path: '/guide', name: 'guide', component: Guide },
  { path: '/settings', name: 'settings', component: Settings },
  { path: '/invite-login', name: 'invite-login', component: InviteLogin },
  { path: '/admin', name: 'admin-home', component: AdminHome },
  { path: '/admin/reports', name: 'admin-reports', component: AdminReports },
  { path: '/admin/support', name: 'admin-support', component: SupportManage },
  { path: '/admin/part-time-jobs', name: 'admin-part-time-jobs', component: PartTimeJobManage },
  { path: '/part-time-jobs', name: 'part-time-jobs', component: PartTimeJobs },
  { path: '/rankings/merchant', name: 'merchant-rankings', component: MerchantRankings }
]

// 需要登录验证的路由
const requiresAuth = [
  'profiles',
  'profile-reviews',
  'profile-rankings',
  'merchants',
  'merchant-reviews',
  'merchant-rankings',
  'admin-reports',
  'set-password',
  'settings'
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')

  // 如果需要登录的路由
  if (requiresAuth.includes(to.name as string)) {
    if (!token) {
      // 没有 token，跳转到登录页，并记录跳转来源
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    // 检查是否有完整的用户信息
    if (!userStr) {
      // 只有 token 没有用户信息，可能是异常退出，跳转到登录页
      localStorage.removeItem('token')
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    // token 和用户信息都存在，放行
    next()
  } else {
    next()
  }
})

export default router

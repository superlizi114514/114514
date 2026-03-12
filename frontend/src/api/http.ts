import axios from 'axios'

// 生产环境使用 Vercel 后端，本地开发使用 localhost
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://backend-9uazn52h9-superlizi114514s-projects.vercel.app' : 'http://localhost:8787')

const http = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: false
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default http

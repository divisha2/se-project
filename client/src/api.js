import axios from 'axios'

// All requests go through the Vite proxy (/api -> http://localhost:5000, see vite.config.js).
const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Expired / invalid token: drop the session and go back to the login page.
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.assign('/login')
    }
    return Promise.reject(err)
  },
)

export const errMsg = (err, fallback = 'Something went wrong') => err?.response?.data?.error || err?.message || fallback

export const ROLES = { ADMIN: 'ADMIN', FACULTY: 'FACULTY', COORDINATOR: 'COURSE_COORDINATOR' }
export const roleLabel = (r) => ({ ADMIN: 'Admin', FACULTY: 'Faculty', COURSE_COORDINATOR: 'Course Coordinator' }[r] || r)

export default api

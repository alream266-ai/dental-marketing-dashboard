import axios from 'axios'

// In production (Vercel), API is on same domain at /api
// In development, API runs on localhost:8000
const BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:8000')

const api = axios.create({ baseURL: BASE_URL })
export default api

import { createBrowserRouter } from 'react-router-dom'
import { routes } from 'router/routes'

// FIN 里挂载路径是 /pod/<podName>/index.html，本地 npm start 时是 /index.html（basename 为空）
// 用当前页面路径动态算，不写死 podName，方便以后复制模板改名
const basename = window.location.pathname.replace(/\/[^/]*$/, '') || '/'

export const router = createBrowserRouter(routes, { basename })


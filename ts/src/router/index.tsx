import { createHashRouter } from 'react-router-dom'
import { routes } from '@/router/routes'

// /pod/ 是纯静态文件服务，没有 SPA fallback/rewrite：用 createBrowserRouter 时，
// 跳到子路由后地址栏会变成 /pod/<podName>/<route>（丢了 index.html），刷新直接 404。
// 换成 hash 路由后，请求路径永远固定在 /pod/<podName>/index.html，路由信息只在 #/xxx 里变化，
// 不需要服务端配合 rewrite。
export const router = createHashRouter(routes)

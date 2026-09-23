// FIN 平台启动脚本，按需注入（不再写死在 index.html 里）。
// 原因：finstack.js 自己在脚本执行时就会自动探测 project/host 并尝试鉴权，
// 未登录时会弹出它自带的登录弹窗（跟 fin5Top 判断 window.top.finstack 是否存在的逻辑绑在一起）。
// 内嵌在 FIN 里时 window.top 是 FIN 自己已登录的外层窗口，不受影响，照旧立即加载；
// 外部直接访问（window.top === window）时必须等我们自己的登录流程先建立 session，
// 再加载它，否则它会自己弹出登录弹窗盖住自建的 Login 页面。
const FINSTACK_SRC = '/finWebApp/finstack'

let loadPromise: Promise<void> | null = null

export function loadFinstack(): Promise<void> {
	if (!loadPromise) {
		loadPromise = new Promise((resolve, reject) => {
			const script = document.createElement('script')
			script.src = FINSTACK_SRC
			script.onload = () => resolve()
			script.onerror = () => reject(new Error('finstack 加载失败'))
			document.head.appendChild(script)
		})
	}
	return loadPromise
}

export const isEmbeddedInFin = () => window.top !== window

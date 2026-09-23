import React, { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ClientContext } from 'haystack-react'
import { I18NProvider } from '@j2inn/utils'
import { fin5Top } from '@j2inn/fin5-ui-utils/dist/fin5Top/fin5Top'
import { client } from '@/client'
import { router } from '@/router'
import { checkSession, AuthState } from '@/auth/authService'
import { loadFinstack, isEmbeddedInFin } from '@/finstack'
import Login from '@/views/Login'

// 内嵌在 FIN 里时 fin5Top 读的是 window.top（FIN 自己已登录的外层窗口），
// 立即加载不受影响；外部直接访问时必须等确认已登录（session 已建立）再加载，
// 否则 finstack.js 自己会弹出它内置的登录弹窗，见 src/finstack.ts 的注释。
const loadFinstackIfStandaloneAuthed = () => {
	if (!isEmbeddedInFin()) loadFinstack()
}

// 已登录时渲染的完整应用树。未登录时不能挂这一棵（ClientContext 下的业务组件一取数据就会因为
// 没有 session 直接报错/一直转圈），所以拆成独立组件，跟 GuestApp 二选一渲染，
// 避免同一组件按状态渲染不同数量的 hooks（React #310）。
const MainApp = () => (
	<ClientContext.Provider value={client}>
		{/* 语言跟随 FIN 界面；在 FIN 外（npm start）取不到时，退回浏览器语言 */}
		<I18NProvider locale={fin5Top?.languageManager?.currentLang}>
			<RouterProvider router={router}></RouterProvider>
		</I18NProvider>
	</ClientContext.Provider>
)

const GuestApp = ({ onAuthed }: { onAuthed: () => void }) => (
	<Login
		onAuthed={() => {
			loadFinstackIfStandaloneAuthed()
			onAuthed()
		}}
	/>
)

export const App = () => {
	const [authState, setAuthState] = useState<AuthState>('unknown')

	useEffect(() => {
		if (isEmbeddedInFin()) loadFinstack()
		checkSession().then((authed) => {
			if (authed) loadFinstackIfStandaloneAuthed()
			setAuthState(authed ? 'authed' : 'guest')
		})
	}, [])

	if (authState === 'unknown') return null
	if (authState === 'guest')
		return <GuestApp onAuthed={() => setAuthState('authed')} />
	return <MainApp />
}

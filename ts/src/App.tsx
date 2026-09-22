import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { ClientContext } from 'haystack-react'
import { I18NProvider } from '@j2inn/utils'
import { fin5Top } from '@j2inn/fin5-ui-utils/dist/fin5Top/fin5Top'
import { client } from 'client'
import { router } from 'router'

export const App = () => {
	return (
		<ClientContext.Provider value={client}>
			{/* 语言跟随 FIN 界面；在 FIN 外（npm start）取不到时，退回浏览器语言 */}
			<I18NProvider locale={fin5Top?.languageManager?.currentLang}>
				<RouterProvider router={router}></RouterProvider>
			</I18NProvider>
		</ClientContext.Provider>
	)
}

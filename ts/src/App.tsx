import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { ClientContext } from 'haystack-react'
import { client } from 'client'
import { router } from 'router'

export const App = () => {
	return (
		<ClientContext.Provider value={client}>
			<RouterProvider router={router}></RouterProvider>
		</ClientContext.Provider>
	)
}

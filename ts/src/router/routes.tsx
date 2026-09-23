import React, { Suspense } from 'react'
import { RouteObject } from 'react-router-dom'
import { Spin } from 'antd'
import MainLayout from 'layouts/MainLayout'
import menuList from 'router/menuList'
import { loadView, loadViewByName } from 'router/loadView'

const NotFound = loadViewByName('NotFound')

const fallback = (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			height: '100%',
			minHeight: 200,
		}}>
		<Spin size='large' />
	</div>
)

export const routes: RouteObject[] = [
	{
		path: '/',
		element: <MainLayout />,
		children: [
			...menuList.map(({ path }) => {
				const View = loadView(path)
				const element = (
					<Suspense fallback={fallback}>
						<View />
					</Suspense>
				)
				return path === '/'
					? { index: true, element }
					: { path, element }
			}),
			{
				path: '*',
				element: (
					<Suspense fallback={fallback}>
						<NotFound />
					</Suspense>
				),
			},
		],
	},
]

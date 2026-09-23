import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Dropdown } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useClient } from 'haystack-react'
import logo from 'images/logo.png'
import menuList from 'router/menuList'
import { logout } from 'auth/authService'
import styles from 'layouts/MainLayout.module.less'

const { Header, Sider, Content } = Layout

const menuItems = menuList.map((item) => ({
	key: item.path,
	label: item.name,
	icon: <span className={item.icon} />,
}))

const MainLayout = () => {
	const location = useLocation()
	const navigate = useNavigate()
	const client = useClient()
	const [userName, setUserName] = useState('')

	useEffect(() => {
		client.ext.eval('userCur()').then((grid) => {
			setUserName(grid.get(0)?.get('dis')?.toString() ?? '')
		})
	}, [client])

	const items: MenuProps['items'] = [
		{
			key: '1',
			label: '退出登录',
		},
		{
			key: '2',
			label: '重置密码',
		},
	]

	const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
		if (key === '1') {
			// App.tsx 的登录态是内存里的 useState，退出后没有渠道通知它；
			// 直接整页刷新最简单可靠，刷新后 App 会重新 checkSession，拿到 guest 态回登录页。
			logout().finally(() => window.location.reload())
		}
	}

	return (
		<Layout className={styles.layoutRoot}>
			<Sider>
				<div
					className={styles.logo}
					style={{ backgroundImage: `url(${logo})` }}
				/>
				<Menu
					theme='dark'
					mode='inline'
					selectedKeys={[location.pathname]}
					items={menuItems}
					onClick={({ key }) =>
						navigate({ pathname: key, hash: location.hash })
					}
				/>
			</Sider>
			<Layout>
				<Header className={styles.header}>
					<Dropdown menu={{ items, onClick: handleMenuClick }}>
						<div className={styles.userDropdown}>
							{' '}
							<UserOutlined />
							{userName}
						</div>
					</Dropdown>
				</Header>
				<Content>
					<Outlet />
				</Content>
			</Layout>
		</Layout>
	)
}

export default MainLayout

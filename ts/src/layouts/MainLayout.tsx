import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Dropdown} from 'antd'
import {UserOutlined} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useClient } from 'haystack-react'
import logo from 'images/logo.png'
import menuList from 'router/menuList'

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
			setUserName(grid.get(0)?.get('dis')?.toString()??'');
		})
	}, [client])

	const items: MenuProps['items'] = [
  {
    key: '1',
    label:'退出登录',
  }, {
    key: '2',
    label:'重置密码',
  }
];


	return (
		<Layout style={{ minHeight: '100vh' }}>
			<Sider>
				<div
					style={{
						height: 64,
						background:`url(${logo}) no-repeat center center`,
						backgroundSize:'90% 75%'
					}}>
					{/* <img src={logo} alt="logo" style={{ height: 32 }} /> */}
				</div>
				<Menu
					theme="dark"
					mode="inline"
					selectedKeys={[location.pathname]}
					items={menuItems}
					onClick={({ key }) => navigate({ pathname: key, hash: location.hash })}
				/>
			</Sider>
			<Layout>
				<Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px',justifyContent:'flex-end' }}>
					<Dropdown menu={{ items }}>
							<div style={{width:'40px',color:'white'}}> <UserOutlined />{userName}</div>
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

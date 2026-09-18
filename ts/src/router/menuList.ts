//菜单数据列表
export type MenuItem = {
	id: number
	name: string
	path: string
	icon: string
}

const menuList: MenuItem[] = [
	{ id: 10001, name: 'Home', path: '/', icon: 'iconfont jf-home' },
	{ id: 10002, name: 'Test', path: '/test', icon: 'iconfont jf-set' },
]

export default menuList

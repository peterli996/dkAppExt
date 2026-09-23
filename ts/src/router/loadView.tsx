//根据path首字母大写转换后，懒加载自动匹配对应的view
import { lazy, ComponentType } from 'react'

// 构建时扫描 views/ 下所有 .tsx 文件，每个文件各自分包（import.meta.glob 天然懒加载，等价于逐个 import()）
const viewModules = import.meta.glob<{ default: ComponentType }>(
	'../views/**/*.tsx'
)

// '../views/Home/index.tsx' -> 'Home'，'../views/User/List/index.tsx' -> 'User/List'
const keyToViewName = (key: string) =>
	key.replace(/^\.\.\/views\//, '').replace(/(\/index)?\.tsx$/, '')

const viewNameToKey = new Map(
	Object.keys(viewModules).map((key) => [keyToViewName(key), key])
)

// '/' -> 'Home', '/test' -> 'Test', '/user/list' -> 'User/List'
const pathToViewName = (path: string) => {
	return path === '/'
		? 'Home'
		: path
				.split('/')
				.filter(Boolean)
				.map(
					(segment) =>
						segment.charAt(0).toUpperCase() + segment.slice(1)
				)
				.join('/')
}

export const loadViewByName = (name: string) =>
	lazy(() => viewModules[viewNameToKey.get(name)!]())

export const loadView = (path: string) => loadViewByName(pathToViewName(path))

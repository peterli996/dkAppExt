//根据path首字母大写转换后，懒加载自动匹配对应的view
import { lazy, ComponentType } from 'react'

// 构建时扫描 views/ 下所有 .tsx 文件，'lazy' 模式让每个文件仍然各自分包（等价于逐个 import()）
const viewsContext = require.context('../views', true, /\.tsx$/, 'lazy')

// './Home/index.tsx' -> 'Home'，'./NotFound/index.tsx' -> 'NotFound'，'./User/List/index.tsx' -> 'User/List'
const keyToViewName = (key: string) =>
	key.replace(/^\.\//, '').replace(/(\/index)?\.tsx$/, '')

const viewNameToKey = new Map(viewsContext.keys().map((key) => [keyToViewName(key), key]))

// '/' -> 'Home', '/test' -> 'Test', '/user/list' -> 'User/List'
const pathToViewName = (path: string) =>{
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
	lazy(() => viewsContext(viewNameToKey.get(name)!) as Promise<{ default: ComponentType }>)

export const loadView = (path: string) => loadViewByName(pathToViewName(path))

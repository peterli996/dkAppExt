import { App } from '@/App'
import React from 'react'
import { createRoot } from 'react-dom/client'
import '@/style/index.less'
import '@/assets/iconfont/iconfont.css'

const container = document.querySelector('app')

if (container) {
	createRoot(container).render(<App />)
}

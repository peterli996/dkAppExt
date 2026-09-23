/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { patchCssModules } from 'vite-css-modules'
import fs from 'fs'
import path from 'path'

const env = process.env

function getLessVars(filePath?: string): Record<string, string> {
	if (!filePath || !fs.existsSync(filePath)) return {}
	return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }))
}

export default defineConfig({
	// 双入口部署（/api/{proj}/ext/dkAppExt/ 内嵌受保护 + /pod/dkAppExt/res/app/ 外部匿名访问）
	// 共用同一份产物，资源路径必须相对当前脚本地址解析，对应 webpack 时代的 publicPath: 'auto'。
	base: './',
	plugins: [
		react(),
		// Vite 原生 CSS Modules 不生成 .d.ts，这个插件补上（对齐 webpack 时代
		// css-modules-typescript-loader 的行为：per-file 生成，提交进 git）。
		patchCssModules({ generateSourceTypes: true }),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	css: {
		preprocessorOptions: {
			less: {
				javascriptEnabled: true,
				modifyVars: getLessVars(env.THEME_PATH),
			},
		},
	},
	build: {
		outDir: 'build',
		emptyOutDir: true,
		sourcemap: true,
	},
	server: {
		port: 8081,
		host: '0.0.0.0',
		proxy: {
			'/auth': env.FINSTACK_HOST ?? 'http://localhost:8080',
			'/api': env.FINSTACK_HOST ?? 'http://localhost:8080',
			'/fin5Lang': env.FINSTACK_HOST ?? 'http://localhost:8080',
			'/finStackAuth': env.FINSTACK_HOST ?? 'http://localhost:8080',
			'/finWebApp/finstack': env.FINSTACK_HOST ?? 'http://localhost:8080',
			'/finGetFile': env.FINSTACK_HOST ?? 'http://localhost:8080',
			'/user': env.FINSTACK_HOST ?? 'http://localhost:8080',
			'/fin5': env.FINSTACK_HOST ?? 'http://localhost:8080',
			'/finPod': env.FINSTACK_HOST ?? 'http://localhost:8080',
			'/pod': env.FINSTACK_HOST ?? 'http://localhost:8080',
		},
	},
	test: {
		environment: 'node',
		globals: true,
		include: ['test/**/*.test.ts'],
	},
})

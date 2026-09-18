import { Client } from 'haystack-nclient'
import { fin5Top } from '@j2inn/fin5-ui-utils/dist/fin5Top/fin5Top'
import { getHashParameters } from '@j2inn/fin5-ui-utils/dist/fin5Top/useFin5AppURLHashParameter'

// 官方（@j2inn/fin5-ui-utils）：项目名从平台注入的fin5Top.finstack.projectName 拿；
// 本地`npm start` 调试，修改从 URL hash 读 projectName（地址形如 .../index.html#projectName=xxx）
const projectName =
	fin5Top?.finstack?.projectName ??
	getHashParameters().get('projectName') ??
	undefined


// console.log('projectName')
// console.log(getHashParameters().toString())
// console.log(getHashParameters().get('projectName'))
// console.log(getHashParameters().get('page'))


export const client = new Client({
	base: new URL(window.location.href),
	project: projectName,
})

// 把 webpack 产物（build/）再复制一份到扩展的 res/app/ 目录。
// build.fan 用 resDirs（而非 nodeDirs）把 res/app/ 打进 pod 根目录之外的
// res/ 下，FIN 只把 /pod/{pod}/res/* 标记为匿名路径，这样才能在未登录时
// 通过 /pod/dkAppExt/res/app/index.html 直接访问、渲染自建登录页。
// publicPath 是 'auto'，同一份产物挂在不同路径下都能正确解析资源，不需要分开构建。
const fs = require('fs')
const path = require('path')

const buildDir = path.resolve(__dirname, '../build')
const resAppDir = path.resolve(__dirname, '../../res/app')

fs.rmSync(resAppDir, { recursive: true, force: true })
fs.cpSync(buildDir, resAppDir, { recursive: true })

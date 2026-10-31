import {readFile,writeFile,mkdir} from 'node:fs/promises'
import path from 'node:path'
const routes=JSON.parse(await readFile('scripts/legacy-routes.json','utf8'))
const parts=(process.env.DOCS_BASE??'/').split('/').filter(Boolean)
const base='/'+(parts.length?parts.join('/')+'/':'')
const root=path.resolve('docs/.vitepress/dist')
for(const[from,to]of Object.entries(routes)){
 const url=base+to.split('/').map(encodeURIComponent).join('/')+'.html'
 const target=path.join(root,from+'.html')
 if(!target.startsWith(root+path.sep))throw new Error('非法旧路由')
 await mkdir(path.dirname(target),{recursive:true})
 await writeFile(target,`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${url}"><title>文档已迁移 · SparkTide</title></head><body><p>这份说明已整理到新版产品手册。<a href="${url}">打开新版文档</a></p></body></html>`)
}
console.log(`已生成 ${Object.keys(routes).length} 个旧地址跳转`)

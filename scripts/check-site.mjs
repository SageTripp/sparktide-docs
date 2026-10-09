import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('docs/.vitepress/dist')
const parts = (process.env.DOCS_BASE ?? '/').split('/').filter(Boolean)
const base = '/' + (parts.length ? parts.join('/') + '/' : '')
const origin = 'https://docs.invalid'
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat()
}
const files = await walk(root)
const htmlFiles = files.filter(f => f.endsWith('.html'))
if (!htmlFiles.length) throw new Error('没有构建产物，请先运行 npm run docs:build')
const failures = []
let checked = 0
// 入链计数：真实内容页必须能从导航或其它页面到达；旧地址跳转桩按设计不被链接，豁免。
const inbound = new Map(htmlFiles.map(file => [file, 0]))
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8')
  const page = new URL(base + path.relative(root, file).split(path.sep).join('/'), origin)
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = match[1].replaceAll('&amp;', '&')
    const url = new URL(ref, page)
    if (url.origin !== origin) continue
    const pathname = decodeURIComponent(url.pathname)
    if (!pathname.startsWith(base)) {
      failures.push(`${path.relative(root, file)}: 越出部署路径 ${ref}`)
      continue
    }
    let target = path.resolve(root, pathname.slice(base.length))
    if (target !== root && !target.startsWith(root + path.sep)) {
      failures.push(`${file}: 非法路径 ${ref}`)
      continue
    }
    try {
      if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html')
      await stat(target)
      if (url.hash && target.endsWith('.html')) {
        const content = await readFile(target, 'utf8')
        const id = decodeURIComponent(url.hash.slice(1))
        if (!content.includes(`id="${id}"`)) throw new Error(`不存在的锚点 ${id}`)
      }
      if (inbound.has(target) && target !== file) inbound.set(target, inbound.get(target) + 1)
      checked++
    } catch (error) {
      failures.push(`${path.relative(root, file)}: ${ref} (${error.message})`)
    }
  }
}
// 孤立内容页：没有任何站内入链的页面用户无法从导航到达（新增页面忘记挂上导航时的典型症状）。
// 旧地址跳转桩按设计不被链接，豁免；index/404 由站点自身入口承担，也豁免。
const siteEntry = file => {
  const relative = path.relative(root, file).split(path.sep).join('/')
  return relative === 'index.html' || relative === '404.html'
}
for (const [file, count] of inbound) {
  if (count > 0 || siteEntry(file)) continue
  const html = await readFile(file, 'utf8')
  if (html.includes('http-equiv="refresh"')) continue
  failures.push(`${path.relative(root, file)}: 内容页没有任何站内入链，用户无法从导航到达`)
}
// 破损表格：表头分隔线与首个数据行之间出现空行会让整张表只剩表头，
// 数据行被渲染成带竖线的纯文本（对“还不能做什么”这类诚实声明尤其有害）。静态扫描源文档。
const sources = (await walk(path.join(path.resolve('docs'), ''))).filter(file => file.endsWith('.md') && !file.includes(`${path.sep}.vitepress${path.sep}`))
for (const file of sources) {
  const lines = (await readFile(file, 'utf8')).split(/\r?\n/)
  for (let index = 0; index + 2 < lines.length; index++) {
    const separator = /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[index]) && lines[index].includes('-')
    if (!separator || !lines[index - 1]?.trim().startsWith('|')) continue
    if (lines[index + 1].trim() === '' && lines[index + 2]?.trim().startsWith('|')) {
      failures.push(`${path.relative(process.cwd(), file)}:${index + 1}: 表格分隔线后有空行，表格数据行不会渲染`)
    }
  }
}
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`通过：${htmlFiles.length} 个 HTML，${checked} 个本地链接/资源/锚点，部署路径 ${base}`)
}

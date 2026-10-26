import { defineConfig } from 'vitepress'
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {sidebar} from './navigation.mts'
import legacyRoutes from '../../scripts/legacy-routes.json'
const rawBase = process.env.DOCS_BASE ?? '/'
const parts = rawBase.split('/').filter(Boolean)
const base = '/' + (parts.length ? parts.join('/') + '/' : '')
if (!/^\/(?:[A-Za-z0-9_.-]+\/)*$/.test(base) || parts.some(p => p === '.' || p === '..')) {
  throw new Error('DOCS_BASE 必须为 / 或 /仓库名/，仓库路径使用 ASCII 字符')
}
const revision = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const sourceDirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim().length > 0
export default defineConfig({
  buildEnd: async (siteConfig) => {
    await writeFile(join(siteConfig.outDir, 'build-info.json'), JSON.stringify({ revision, sourceDirty, site: 'sparktide-docs', generatedAt: new Date().toISOString() }, null, 2) + '\n')
  },
  lang: 'zh-CN', title: 'SparkTide · 启澜',
  description: '启澜开发者文档：理解产品、跑通示例、接入业务与部署上线。',
  base, cleanUrls: false, lastUpdated: false,
  rewrites: { 'README.md': 'index.md' },
  vite: {
    plugins: [{
      name: 'sparktide-legacy-doc-routes',
      configureServer(server) {
        // 开发预览与静态部署使用同一旧地址清单。
        server.middlewares.use((request, response, next) => {
          const url = new URL(request.url || '/', 'http://docs.invalid')
          let pathname: string
          try { pathname = decodeURIComponent(url.pathname) } catch { return next() }
          if (!pathname.startsWith(base)) return next()
          const key = pathname.slice(base.length).replace(/\.html$/, '').replace(/\/$/, '')
          const target = legacyRoutes[key as keyof typeof legacyRoutes]
          if (!target) return next()
          response.writeHead(302, { Location: base + target.split('/').map(encodeURIComponent).join('/') + '.html' + url.search })
          response.end()
        })
      }
    }]
  },
  head: [['link', { rel: 'icon', type: 'image/png', href: `${base}sparktide-logo.png` }], ['meta', { name: 'sparktide-docs-revision', content: revision }]],
  themeConfig: {
    logo: { src: '/sparktide-logo.png', alt: 'SparkTide 启澜' },
    siteTitle: 'SparkTide · 启澜',
    nav: [
      { text: '指南', link: '/', activeMatch: '^/$|/开始使用/|/教程/|/开发接入/(SDK简化接入|接入流程)' },
      { text: '能力', link: '/使用指南/README', activeMatch: '/使用指南/|/开发接入/(业务接入|模型治理|知识接入|运行时)/' },
      { text: '参考', link: '/开发接入/README', activeMatch: '/接口参考/|/开发接入/(README|业务后台SDK|前端SDK|React与Vue)' },
      { text: '部署', link: '/部署运维/README', activeMatch: '/部署运维/|/开发接入/运维治理/' },
      { text: '版本', items: [
        { text: '版本与获取', link: '/开始使用/版本与获取' },
        { text: '公开 0.1.0 教程', link: '/教程/README' },
        { text: '内部候选接入指南', link: '/开发接入/SDK简化接入' },
        { text: '版本说明与验证范围', link: '/产品支持/版本说明' },
      ] },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/SageTripp/sparktide-docs', ariaLabel: '启澜文档 GitHub 仓库' }],
    sidebar,
    search: { provider: 'local', options: { locales: { root: { translations: {
      button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
      modal: { displayDetails:'显示详细结果',noResultsText:'没有找到相关内容',resetButtonTitle:'清除搜索',footer:{selectText:'选择',navigateText:'切换',closeText:'关闭'} }
    } } } } },
    outline: { level: [2,3], label: '本页内容' },
    docFooter: { prev:'上一篇', next:'下一篇' },
    darkModeSwitchLabel:'切换主题',darkModeSwitchTitle:'切换深色主题',lightModeSwitchTitle:'切换浅色主题',skipToContentLabel:'跳至正文', sidebarMenuLabel:'文档目录', returnToTopLabel:'回到顶部',
    footer: { message:'SparkTide · 启澜开发者文档', copyright:'理解产品 · 接入业务 · 部署上线' },
    notFound:{title:'没有找到这页文档',quote:'可以从快速开始或搜索继续查找。',linkLabel:'返回文档首页',linkText:'返回文档首页'}
  }
})

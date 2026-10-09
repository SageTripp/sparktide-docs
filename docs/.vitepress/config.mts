import { defineConfig } from 'vitepress'
import {sidebar} from './navigation.mts'
import legacyRoutes from '../../scripts/legacy-routes.json'
const rawBase = process.env.DOCS_BASE ?? '/'
const parts = rawBase.split('/').filter(Boolean)
const base = '/' + (parts.length ? parts.join('/') + '/' : '')
if (!/^\/(?:[A-Za-z0-9_.-]+\/)*$/.test(base) || parts.some(p => p === '.' || p === '..')) {
  throw new Error('DOCS_BASE 必须为 / 或 /仓库名/，仓库路径使用 ASCII 字符')
}
export default defineConfig({
  lang: 'zh-CN', title: 'SparkTide · 启澜',
  description: 'SparkTide 开发者文档：从环境准备到第一轮对话，按步骤接入业务后台 SDK 和前端聊天 SDK，再按需学习工具、知识、模型与权限。',
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
  head: [['link', { rel: 'icon', type: 'image/png', href: `${base}sparktide-logo.png` }]],
  themeConfig: {
    logo: { src: '/sparktide-logo.png', alt: 'SparkTide 启澜' },
    siteTitle: 'SparkTide · 启澜',
    nav: [
      {text:'教程',link:'/教程/README',activeMatch:'/教程/|/开始使用/阅读地图'},
      {text:'能力指南',link:'/使用指南/README',activeMatch:'/使用指南/|/开发接入/(业务接入|模型治理|知识接入|运行时)/'},
      {text:'SDK 参考',link:'/开发接入/README',activeMatch:'/开发接入/(README|业务后台SDK|前端SDK|React与Vue|接入流程)'},
      {text:'部署与运维',link:'/部署运维/README',activeMatch:'/部署运维/|/开发接入/运维治理/'},
      {text:'API',link:'/接口参考/README',activeMatch:'/接口参考/'},
      {text:'0.1',items:[{text:'版本与获取',link:'/开始使用/版本与获取'},{text:'能力状态',link:'/产品支持/能力状态'},{text:'常见问题',link:'/产品支持/常见问题'},{text:'版本说明',link:'/产品支持/版本说明'},{text:'控制台操作',link:'/使用指南/控制台/README'}]}
    ],
    sidebar,
    search: { provider: 'local', options: { locales: { root: { translations: {
      button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
      modal: { displayDetails:'显示详细结果',noResultsText:'没有找到相关内容',resetButtonTitle:'清除搜索',footer:{selectText:'选择',navigateText:'切换',closeText:'关闭'} }
    } } } } },
    outline: { level: [2,3], label: '本页导航' },
    docFooter: { prev:'上一篇', next:'下一篇' },
    darkModeSwitchLabel:'切换主题',darkModeSwitchTitle:'切换深色主题',lightModeSwitchTitle:'切换浅色主题',skipToContentLabel:'跳至正文', sidebarMenuLabel:'文档目录', returnToTopLabel:'回到顶部',
    footer: { message:'汇聚智能，驱动涌现。', copyright:'SparkTide · 启澜产品文档 · 0.1 发布线' },
    notFound:{title:'没有找到这页文档',quote:'可以从快速开始或搜索继续查找。',linkLabel:'返回文档首页',linkText:'返回文档首页'}
  }
})

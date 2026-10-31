import { defineConfig } from 'vitepress'
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { sidebar, navFor } from './navigation.mts'
import versions from './versions.json'
const parts = (process.env.DOCS_BASE ?? '/').split('/').filter(Boolean)
const base = '/' + (parts.length ? parts.join('/') + '/' : '')
if (!/^\/(?:[A-Za-z0-9_.-]+\/)*$/.test(base) || parts.some(p => p === '.' || p === '..')) {
  throw new Error('DOCS_BASE 必须为 / 或 /仓库名/，仓库路径使用 ASCII 字符')
}
const revision = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const sourceDirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0
export default defineConfig({
  lang: 'zh-CN', title: 'SparkTide · 启澜',
  description: '按启澜版本组织的开发者文档：快速开始、开发接入、能力指南、控制台操作、部署运维和参考资料。',
  base, cleanUrls: false, lastUpdated: false,
  rewrites: { 'README.md': 'index.md' },
  vite: { plugins: [{
    name: 'sparktide-current-version-search',
    enforce: 'post',
    transform(code, id) {
      // VitePress 1.6.4 按分区提供索引；全站入口沿用当前版本，版本页各用自己的索引。
      if (id !== '/@localSearchIndex') return
      return { code: code.replace('export default ', 'const indexes = ') +
        `\nindexes.root = indexes[${JSON.stringify(versions.current)}];\nexport default indexes`, map: null }
    }
  }] },
  // 复用 VitePress 的分区机制隔离导航和本地搜索，所有版本仍使用中文。
  locales: {
    root: { label: '', lang: 'zh-CN' },
    ...Object.fromEntries(versions.versions.map(version => [version.id, {
      label: '', lang: 'zh-CN', link: `/${version.id}/README`,
      themeConfig: { nav: navFor(version.id) }
    }]))
  },
  buildEnd: async (siteConfig) => {
    await writeFile(join(siteConfig.outDir, 'build-info.json'), JSON.stringify({ revision, sourceDirty, currentVersion: versions.current, site: 'sparktide-docs', generatedAt: new Date().toISOString() }, null, 2) + '\n')
  },
  head: [['link', { rel: 'icon', type: 'image/png', href: `${base}sparktide-logo.png` }], ['meta', { name: 'sparktide-docs-revision', content: revision }]],
  themeConfig: {
    logo: { src: '/sparktide-logo.png', alt: 'SparkTide 启澜' }, siteTitle: '启澜文档',
    nav: [
      { text: '产品能力', link: '/#capabilities' },
      { text: '接入方式', link: '/#integration' },
      { text: '应用场景', link: '/#scenarios' },
      { text: '开发文档', link: `/${versions.current}/README` }
    ],
    i18nRouting: false,
    sidebar,
    search: { provider: 'local', options: { miniSearch: { searchOptions: { boost: { title: 20, titles: 6, text: 1 } } }, translations: {
      button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
      modal: { displayDetails: '显示详细结果', noResultsText: '没有找到相关内容', resetButtonTitle: '清除搜索', footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' } }
    } } },
    outline: { level: [2, 3], label: '本页内容' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '切换主题', darkModeSwitchTitle: '切换深色主题', lightModeSwitchTitle: '切换浅色主题', skipToContentLabel: '跳至正文', sidebarMenuLabel: '本栏目目录', returnToTopLabel: '回到顶部',
    footer: { message: 'SparkTide · 启澜', copyright: '启澜，让智能体走进业务。' },
    notFound: { title: '没有找到这页文档', quote: '旧版内容已归档。请先选择与你的平台匹配的文档版本。', linkLabel: '返回文档首页', linkText: '返回文档首页' }
  }
})

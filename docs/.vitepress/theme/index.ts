import DefaultTheme from 'vitepress/theme'
import { defineComponent, h } from 'vue'
import { useData, withBase } from 'vitepress'
import { useSyncedCodeGroups } from './useSyncedCodeGroups'
import versions from '../versions.json'
import './custom.css'
import DocsPortal from './DocsPortal.vue'
import DocsBrand from './DocsBrand.vue'
import ProductHome from './ProductHome.vue'
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) { app.component('DocsPortal', DocsPortal); app.component('ProductHome', ProductHome) },
  Layout: defineComponent({ setup() {
    useSyncedCodeGroups()
    const { frontmatter } = useData()
    const id = () => frontmatter.value.productVersion || versions.current
    return () => h(DefaultTheme.Layout, { class: { dark: frontmatter.value.pageClass === 'product-home' } }, {
      'nav-bar-content-before': () => h(DocsBrand),
      'aside-outline-after': () => h('div', { class: 'aside-help' }, [
        h('a', { href: withBase(`/${id()}/参考资料/版本与兼容性.html`) }, '版本与兼容性'),
        h('a', { href: withBase(`/${id()}/参考资料/能力与限制.html`) }, '当前能力与限制')
      ]),
      'doc-after': () => h('div', { class: 'doc-meta' }, [
        frontmatter.value.productVersion ? `适用平台：${id()}` : '启澜文档版本入口',
        frontmatter.value.updated ? ` · 更新于 ${frontmatter.value.updated}` : ''
      ])
    })
  } })
}

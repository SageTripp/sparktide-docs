import DefaultTheme from 'vitepress/theme'
import { defineComponent, h } from 'vue'
import { useData, withBase } from 'vitepress'
import { tutorialSteps } from '../navigation.mts'
import { useSyncedCodeGroups } from './useSyncedCodeGroups'
import './custom.css'
import DocsPortal from './DocsPortal.vue'
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) { app.component('DocsPortal', DocsPortal) },
  Layout: defineComponent({ setup() {
    useSyncedCodeGroups()
    const { frontmatter } = useData()
    return () => h(DefaultTheme.Layout, null, {
      'sidebar-nav-before': () => h('div', { class: 'sidebar-caption' }, ['开发者文档', h('span', ' / DOCS')]),
      'aside-outline-after': () => h('div', { class: 'aside-help' }, [
        h('a', { href: withBase('/开始使用/版本与获取.html') }, '版本与获取'),
        h('a', { href: withBase('/产品支持/常见问题.html') }, '遇到问题？'),
      ]),
      'doc-before': () => {
        const step = Number(frontmatter.value.tutorialStep)
        if (step) return h('nav', {class:'tutorial-progress', 'aria-label':'入门教程进度'}, [
            h('p', [h('strong', `公开 0.1.0 · 第 ${step} / ${tutorialSteps.length} 步`),
            h('a', {href:withBase('/教程/README.html')}, '查看完整路线')]),
          h('ol', tutorialSteps.map((item, i) => h('li', [h('a', {
            href:withBase(item.link + '.html'),
            'aria-current': i + 1 === step ? 'step' : undefined,
            title:item.text
          }, [h('span', String(i+1)), item.text.replace(/^\d+\. /,'').replace('（可选）','')])])) )
        ])
      },
      'doc-after': () => h('div', { class: 'doc-meta' }, [
        frontmatter.value.productVersion ? `适用范围：${frontmatter.value.productVersion}` : h('a', { href: withBase('/开始使用/版本与获取.html') }, '选择适合你的版本'),
        frontmatter.value.updated ? ` · 更新于 ${frontmatter.value.updated}` : ''
      ])
    })
  } })
}

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
      'doc-before': () => {
        const step = Number(frontmatter.value.tutorialStep)
        if (step) return h('nav', {class:'tutorial-progress', 'aria-label':'入门教程进度'}, [
            h('p', [h('strong', `应用接入 · 第 ${step} / ${tutorialSteps.length} 步`),
            h('a', {href:withBase('/教程/README.html')}, '查看完整路线')]),
          h('ol', tutorialSteps.map((item, i) => h('li', [h('a', {
            href:withBase(item.link + '.html'),
            'aria-current': i + 1 === step ? 'step' : undefined,
            title:item.text
          }, [h('span', String(i+1)), item.text.replace(/^\d+\. /,'').replace('（可选）','')])])) )
        ])
      },
      'doc-after': () => h('div', { class: 'doc-meta' }, `适用版本 ${frontmatter.value.productVersion || '0.1'}${frontmatter.value.updated ? ' · 更新于 ' + frontmatter.value.updated : ''}`)
    })
  } })
}

import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import { useData, withBase } from 'vitepress'
import { tutorialSteps } from '../navigation.mts'
import './custom.css'
export default {
  extends: DefaultTheme,
  Layout: () => {
    const { frontmatter } = useData()
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => {
        const step = Number(frontmatter.value.tutorialStep)
        if (step) return h('nav', {class:'tutorial-progress', 'aria-label':'入门教程进度'}, [
          h('p', [h('strong', `快速上手 · 第 ${step} / ${tutorialSteps.length} 步`),
            h('a', {href:withBase('/教程/README.html')}, '查看完整路线')]),
          h('ol', tutorialSteps.map((item, i) => h('li', [h('a', {
            href:withBase(item.link + '.html'),
            'aria-current': i + 1 === step ? 'step' : undefined,
            title:item.text
          }, [h('span', String(i+1)), item.text.replace(/^\d+\. /,'').replace('（可选）','')])])) )
        ])
        if (frontmatter.value.topic) return h('aside', {class:'reading-context','aria-label':'阅读位置'}, [
          h('strong', frontmatter.value.topic), h('p', frontmatter.value.docGoal),
          h('a', {href:withBase('/开始使用/阅读地图.html')}, '阅读地图'),
          h('a', {href:withBase('/教程/README.html')}, '第一次接入：从教程开始')
        ])
      },
      'doc-after': () => h('div', { class: 'doc-meta' }, `适用版本：0.1 发布线 · 最近核对：${frontmatter.value.updated || '2026-09-29'} · SparkTide 产品文档`)
    })
  }
}

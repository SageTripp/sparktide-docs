<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import versions from '../versions.json'
import ProductDemo from './ProductDemo.vue'
import PortalIcon from './PortalIcon.vue'
import { vGlow } from './glow'
import PortalSky from './PortalSky.vue'
import './product-home.css'

const doc = (path: string) => withBase(`/${versions.current}/${path}.html`)
const portal = ref<HTMLElement>()
const isScrolled = ref(false)
const pagingEnabled = ref(false)
const skyPage = ref(0)
const experienceActive = ref(false)
const activeScene = ref<'knowledge' | 'query' | 'approval'>('knowledge')
const scenes = [
  { id: 'knowledge' as const, number: '01', icon: 'knowledge', title: '知识问答', description: '读懂文档，让答案有出处。' },
  { id: 'query' as const, number: '02', icon: 'tool', title: '业务查询', description: '连接业务，让数据看得见。' },
  { id: 'approval' as const, number: '03', icon: 'security', title: '操作审批', description: '确认变更，让行动有边界。' }
]
let frame = 0
let revealElements: HTMLElement[] = []
let pages: HTMLElement[] = []
let lastWheelAt = 0
let wheelTotal = 0
let wheelConsumed = false
let flipUntil = 0

// 展示进度始终依据实际滚动位置，触摸和键盘保留原生行为。
function updateScroll() {
  frame = 0
  if (!portal.value) return
  const progress = Math.min(1, Math.max(0, window.scrollY / window.innerHeight))
  portal.value.style.setProperty('--hero-progress', String(progress))
  isScrolled.value = window.scrollY > 180
  const pageBounds = pages.map(page => page.getBoundingClientRect())
  const middle = window.innerHeight / 2
  const visiblePage = pageBounds.findIndex(bounds => bounds.top <= middle && bounds.bottom > middle)
  if (visiblePage >= 0) skyPage.value = visiblePage
  const stageBounds = portal.value.querySelector('.product-stage')!.getBoundingClientRect()
  const stageVisible = Math.min(stageBounds.bottom, window.innerHeight) - Math.max(stageBounds.top, 0)
  experienceActive.value = stageVisible > Math.min(stageBounds.height * .4, window.innerHeight * .35)
  pagingEnabled.value = window.matchMedia('(min-width: 1100px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)').matches && pages.every(page => page.offsetHeight <= window.innerHeight + 2)
  for (const element of revealElements) {
    // 用布局坐标计算进度，避免展示变换反过来影响下一帧的位置测量。
    let layoutTop = 0
    let parent: HTMLElement | null = element
    while (parent) {
      layoutTop += parent.offsetTop
      parent = parent.offsetParent as HTMLElement | null
    }
    const progress = Math.min(1, Math.max(0, (window.innerHeight * .94 - (layoutTop - window.scrollY)) / (window.innerHeight * .32)))
    element.style.setProperty('--reveal', String(progress))
  }
}
function scheduleScroll() {
  if (!frame) frame = requestAnimationFrame(updateScroll)
}
function turnPage(event: WheelEvent) {
  if (!window.matchMedia('(min-width: 1100px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)').matches) return
  if (event.ctrlKey || event.defaultPrevented || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return
  const target = event.target as HTMLElement
  if (!portal.value?.contains(target)) return
  // 内容超过一屏时允许自然阅读，工作台内部有剩余内容时先滚动工作台。
  if (!pagingEnabled.value) return
  const body = target.closest<HTMLElement>('.pd-body')
  if (body && (event.deltaY > 0 ? body.scrollTop + body.clientHeight < body.scrollHeight - 1 : body.scrollTop > 1)) return
  const now = performance.now()
  if (now - lastWheelAt > 180) { wheelTotal = 0; wheelConsumed = false }
  lastWheelAt = now
  event.preventDefault()
  if (wheelConsumed || now < flipUntil) return
  wheelTotal += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1)
  if (Math.abs(wheelTotal) < 20) return
  const positions = pages.map(page => page.getBoundingClientRect().top + window.scrollY)
  const current = positions.reduce((nearest, top, index) => Math.abs(top - window.scrollY) < Math.abs(positions[nearest] - window.scrollY) ? index : nearest, 0)
  const next = Math.max(0, Math.min(pages.length - 1, current + Math.sign(wheelTotal)))
  wheelConsumed = true
  flipUntil = now + 700
  window.scrollTo({ top: positions[next], behavior: 'smooth' })
}
onMounted(() => {
  revealElements = Array.from(portal.value!.querySelectorAll<HTMLElement>('[data-reveal]'))
  pages = Array.from(portal.value!.querySelectorAll<HTMLElement>('.portal-page'))
  updateScroll()
  portal.value!.classList.add('scroll-ready')
  window.addEventListener('scroll', scheduleScroll, { passive: true })
  window.addEventListener('resize', scheduleScroll)
  window.addEventListener('wheel', turnPage, { passive: false })
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('scroll', scheduleScroll)
  window.removeEventListener('resize', scheduleScroll)
  window.removeEventListener('wheel', turnPage)
})
const featureIcons = ['model', 'tool', 'knowledge', 'interface', 'security', 'activity']
const features = [
  { number: '01', title: '模型与智能体', text: '为不同职责配置模型、指令与可用能力，让智能体在业务范围内工作。', link: '能力指南/智能体', tags: '模型配置 / 智能体声明' },
  { number: '02', title: '业务工具', text: '把已有服务连接成智能体可调用的工具，让对话进一步完成业务查询与操作。', link: '能力指南/业务工具', tags: '服务接入 / 受控调用' },
  { number: '03', title: '知识与引用', text: '连接托管文档或外部知识服务，在回答中保留引用，按权限查看来源。', link: '能力指南/知识问答', tags: '文档检索 / 来源追溯' },
  { number: '04', title: '会话与界面', text: '从流式对话到业务卡片、问卷与文件成果，把智能体的结果带到用户面前。', link: '能力指南/界面与文件成果', tags: '流式交互 / 业务组件' },
  { number: '05', title: '身份与权限', text: '沿用业务系统的登录、租户和数据权限，在可信身份下连接业务能力。', link: '开发接入/身份与权限', tags: '身份适配 / 权限边界' },
  { number: '06', title: '运行与治理', text: '查看会话、调用与审批记录，管理预算和运行状态，为问题诊断保留依据。', link: '控制台操作/运行与审批', tags: '审批记录 / 预算与诊断' }
]
</script>

<template>
  <main ref="portal" class="product-portal" :class="{ 'is-scrolled': isScrolled, 'is-paged': pagingEnabled }">
    <PortalSky :page="skyPage" />
    <section class="product-hero portal-page" aria-labelledby="product-title">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="portal-width hero-topline"><a :href="withBase('/')" class="hero-brand"><img :src="withBase('/sparktide-logo.png')" alt="" width="32" height="32" /><strong>启澜</strong><span>SparkTide</span></a><a :href="doc('README')">开发文档 <PortalIcon name="arrow" /></a></div>
      <div class="portal-width hero-inner">
        <div class="hero-message">
          <p class="portal-eyebrow"><span></span> 让智能体成为业务的一部分</p>
          <h1 id="product-title">让智能体，<br /><em>走进业务。</em></h1>
          <p class="hero-description">模型的能力，业务的知识，<br />在你熟悉的系统里，连接成行动。</p>
          <div class="portal-actions">
            <a v-glow class="glass-surface portal-button primary" :href="doc('快速开始/README')">开始构建 <PortalIcon name="arrow" /></a>
            <a v-glow class="glass-surface portal-button secondary" href="#experience">看看它能做什么 <span aria-hidden="true">↓</span></a>
          </div>
          <div class="hero-version">{{ versions.current }} <span>平台 · 后端 SDK · 前端 SDK</span></div>
        </div>
        <div class="hero-composition" aria-label="模型、知识与工具连接为业务助手">
          <div class="composition-orbit orbit-one" aria-hidden="true"></div><div class="composition-orbit orbit-two" aria-hidden="true"></div>
          <img class="hero-sculpture" :src="withBase('/品牌/启澜玻璃标志.png')" alt="启澜星芒与三道浪形的立体玻璃标志" width="1280" height="1280" fetchpriority="high" />
          <a v-glow class="glass-surface orbit-card orbit-model" :href="doc('能力指南/智能体')"><PortalIcon name="model" /><div><small>INTELLIGENCE</small><strong>模型与智能体</strong><span>定义职责 · 选择能力</span></div></a>
          <a v-glow class="glass-surface orbit-card orbit-knowledge" :href="doc('能力指南/知识问答')"><PortalIcon name="knowledge" /><div><small>KNOWLEDGE</small><strong>业务知识</strong><span>检索 · 引用 · 可追溯</span></div></a>
          <a v-glow class="glass-surface orbit-card orbit-tools" :href="doc('能力指南/业务工具')"><PortalIcon name="tool" /><div><small>ACTION</small><strong>业务工具</strong><span>连接服务 · 受控操作</span></div></a>
          <div class="composition-caption"><span></span> ONE PLATFORM. YOUR BUSINESS.</div>
        </div>
      </div>
      <a href="#experience" class="scroll-cue"><span>向下探索</span><span aria-hidden="true">↓</span></a>
      <div class="hero-bottom-glow" aria-hidden="true"></div>
    </section>
    <section id="experience" class="product-experience portal-width portal-page">
      <div class="experience-intro" data-reveal>
        <p class="portal-eyebrow">PRODUCT EXPERIENCE</p><h2>不止是回答。<br />把事情向前推进。</h2>
        <p>从知识、数据到行动，<br />探索启澜的三种业务场景。</p>
        <div class="experience-scenes" role="group" aria-label="选择演示场景">
          <button v-for="scene in scenes" :key="scene.id" type="button" :aria-pressed="activeScene === scene.id" aria-controls="product-demo-panel" @click="activeScene = scene.id"><PortalIcon :name="scene.icon" /><span><strong>{{ scene.title }}</strong><small>{{ scene.description }}</small></span><i>{{ scene.number }}</i></button>
        </div>
      </div>
      <div class="product-stage" data-reveal><ProductDemo :scene="activeScene" :active="experienceActive" /></div>
    </section>
    <section id="capabilities" class="portal-section portal-width portal-page">
      <div class="portal-section-heading" data-reveal><div><p class="portal-eyebrow">产品能力 / CAPABILITIES</p><h2>从理解问题，到完成业务。</h2></div><p>把智能体需要的能力连接起来，<br />把业务需要的控制保留下来。</p></div>
      <div class="product-features">
        <a v-for="(feature, index) in features" :key="feature.number" :href="doc(feature.link)" v-glow class="product-feature glass-surface" data-reveal>
          <div class="feature-top"><PortalIcon :name="featureIcons[index]" /><span aria-hidden="true">↗</span></div>
          <h3>{{ feature.title }}</h3><p>{{ feature.text }}</p><small>{{ feature.tags }}</small>
        </a>
      </div>
      <div class="product-foundation" aria-label="产品组成"><p>一套平台，连接智能体与业务</p><div><span>模型</span><i aria-hidden="true">＋</i><span>知识</span><i aria-hidden="true">＋</i><span>工具</span><i aria-hidden="true">→</i><strong>你的业务应用</strong></div></div>
    </section>
    <section id="integration" class="portal-section integration-section portal-page">
      <div class="portal-width integration-layout" data-reveal>
        <div><p class="portal-eyebrow">接入方式 / INTEGRATION</p><h2>融入现有系统，<br />从你熟悉的技术开始。</h2><p class="section-description">前端呈现交互，后台连接业务，平台负责执行与治理。通过配套 SDK，把这三个部分连接起来。</p><a class="portal-text-link" :href="doc('开发接入/接入总览')">了解接入方式 <span aria-hidden="true">↗</span></a></div>
        <div class="integration-stack">
          <a v-glow class="glass-surface" :href="doc('开发接入/前端接入')"><span class="layer-index">01</span><div><h3>你的业务界面</h3><p>聊天、会话状态与业务组件</p><small>React · Vue 3 · Vue 2 · JS / TS</small></div><span aria-hidden="true">↗</span></a>
          <div class="layer-connector" aria-hidden="true">↕</div>
          <a v-glow class="glass-surface" :href="doc('开发接入/后端接入')"><span class="layer-index">02</span><div><h3>你的业务后台</h3><p>身份适配、业务工具与知识回调</p><small>Java · Kotlin · HTTP</small></div><span aria-hidden="true">↗</span></a>
          <div class="layer-connector" aria-hidden="true">↕</div>
          <a v-glow class="glass-surface" :href="doc('快速开始/整体组成')"><span class="layer-index">03</span><div><h3>启澜 SparkTide</h3><p>智能体执行 · 会话存储 · 审批与预算</p><small>PLATFORM + SDK</small></div><span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
    <div class="portal-finale portal-page">
    <section id="scenarios" class="portal-section portal-width">
      <div class="portal-section-heading" data-reveal><div><p class="portal-eyebrow">应用场景 / USE CASES</p><h2>在业务发生的地方，提供帮助。</h2></div></div>
      <div class="scenario-grid" data-reveal>
        <article><PortalIcon name="knowledge" /><span>知识服务</span><h3>让知识走出文档</h3><p>面向制度、手册和业务资料提供问答，帮助用户找到答案，也找到答案的来源。</p><a :href="doc('能力指南/知识问答')">知识问答能力 ↗</a></article>
        <article><PortalIcon name="tool" /><span>业务协作</span><h3>让查询更自然</h3><p>通过接入的业务工具查询数据，用表格与业务卡片呈现结果，减少页面之间的来回切换。</p><a :href="doc('能力指南/业务工具')">业务工具能力 ↗</a></article>
        <article><PortalIcon name="security" /><span>流程辅助</span><h3>让操作有确认</h3><p>在对话中收集信息，为需要确认的工具操作请求审批，并保留运行与交互记录。</p><a :href="doc('能力指南/会话交互')">会话交互能力 ↗</a></article>
      </div>
    </section>
    <section class="portal-closing portal-width" data-reveal>
      <div><p class="portal-eyebrow">BUILD WITH SPARKTIDE</p><h2>你的下一个业务助手，<br />从启澜开始。</h2></div>
      <div><a v-glow class="glass-surface portal-button primary" :href="doc('快速开始/README')">开始构建 <span aria-hidden="true">↗</span></a></div>
    </section>
    </div>
  </main>
</template>

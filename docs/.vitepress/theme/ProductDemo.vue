<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import versions from '../versions.json'
import PortalIcon from './PortalIcon.vue'
import { vGlow } from './glow'

const props = withDefaults(defineProps<{ scene: 'knowledge' | 'query' | 'approval'; active?: boolean }>(), { active: true })
const sceneTitle = computed(() => ({ knowledge: '知识问答', query: '业务查询', approval: '操作审批' })[props.scene])
const sourcesOpen = ref(false)
const pendingOnly = ref(false)
const decision = ref<'pending' | 'approved' | 'rejected'>('pending')
const tasks = [
  { id: 'ST-101', title: '后端 SDK 联调', owner: '后端开发', status: '进行中', priority: '普通' },
  { id: 'ST-102', title: '前端组件嵌入', owner: '前端开发', status: '待处理', priority: '高' },
  { id: 'ST-103', title: '业务身份验收', owner: '集成测试', status: '待处理', priority: '普通' }
]
const visibleTasks = computed(() => pendingOnly.value ? tasks.filter(task => task.status === '待处理') : tasks)
const doc = (name: string) => withBase(`/${versions.current}/部署运维/${name}.html`)
const elapsed = ref(4000)
const complete = computed(() => elapsed.value >= 4000)
const waiting = computed(() => elapsed.value >= 350 && elapsed.value < 950)
const answering = computed(() => elapsed.value >= 950)
const demoBody = ref<HTMLElement>()
const responseParts = {
  knowledge: ['独立进程部署需要准备以下三项：', 'Node.js 24.22.1 / npm 10.9.4', '平台运行时与依赖管理。', 'PostgreSQL 17', '保存会话、任务及运行记录。', '单个启澜执行器', '同一数据库只运行一个执行器。', '文档解析需要 Java 17；默认镜像不含 Java。Redis 不是当前必需服务。'],
  query: ['已找到 3 项未完成的接入事项，其中 1 项为高优先级。以下是查询结果：'],
  approval: ['已整理这次变更。请核对任务与截止时间，确认后再执行。']
}
const parts = computed(() => responseParts[props.scene])
const characters = computed(() => {
  const total = parts.value.join('').length
  return Math.floor(Math.min(1, Math.max(0, (elapsed.value - 950) / (props.scene === 'knowledge' ? 2600 : 1350))) * total)
})
function part(index: number) {
  const offset = parts.value.slice(0, index).join('').length
  return parts.value[index].slice(0, Math.max(0, characters.value - offset))
}
const stageLabel = computed(() => !props.active ? '' : complete.value ? '回答已完成' : elapsed.value < 350 ? '正在发送提问' : waiting.value ? '正在准备回答' : '正在输出回答')
let timer: ReturnType<typeof setTimeout> | undefined
let motion: MediaQueryList | undefined
let mounted = false
function play() {
  clearTimeout(timer)
  sourcesOpen.value = false
  pendingOnly.value = false
  decision.value = 'pending'
  if (demoBody.value) demoBody.value.scrollTop = 0
  if (!props.active || document.hidden || motion?.matches) { elapsed.value = 4000; return }
  elapsed.value = 0
  const start = performance.now()
  const tick = () => {
    elapsed.value = Math.min(4000, performance.now() - start)
    if (!complete.value) timer = setTimeout(tick, 32)
  }
  timer = setTimeout(tick, 32)
}
watch(() => [props.scene, props.active], () => { if (mounted) play() }, { flush: 'post' })
onMounted(() => {
  mounted = true
  motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  motion.addEventListener('change', play)
  document.addEventListener('visibilitychange', play)
  play()
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  motion?.removeEventListener('change', play)
  document.removeEventListener('visibilitychange', play)
})

</script>

<template>
  <div id="product-demo-panel" v-glow class="pd-demo glass-surface" role="region" :aria-label="`${sceneTitle}演示`">
    <header class="pd-header"><div class="pd-identity"><PortalIcon name="interface" /><div><strong>{{ sceneTitle }}</strong><span>启澜助手工作台</span></div></div><div class="pd-header-actions"><span class="pd-badge">交互演示</span><button type="button" class="pd-replay" :disabled="!complete" @click="play">重播 ↺</button></div></header>
    <span class="pd-stage-announcement" role="status" aria-live="polite">{{ stageLabel }}</span>
    <div ref="demoBody" :key="scene" class="pd-body" :class="{ 'pd-playing': !complete, 'pd-sending': elapsed < 350 }" tabindex="0" :aria-label="`${sceneTitle}内容`">
      <div v-if="scene === 'knowledge'" class="pd-panel">
        <div class="pd-question">部署启澜，需要准备哪些组件？</div>
        <div v-if="waiting" class="pd-thinking" aria-hidden="true"><i></i><i></i><i></i><span>正在准备回答</span></div>
        <div v-if="answering" class="pd-answer-heading"><PortalIcon name="knowledge" /><span>依据 {{ versions.current }} 部署文档</span></div>
        <p v-if="answering" class="pd-answer">{{ part(0) }}<span v-if="!complete && characters < parts[0].length" class="pd-cursor" aria-hidden="true"></span></p>
        <ol v-if="part(1)" class="pd-facts">
          <li><strong>{{ part(1) }}</strong><span>{{ part(2) }}</span></li>
          <li v-if="part(3)"><strong>{{ part(3) }}</strong><span>{{ part(4) }}</span></li>
          <li v-if="part(5)"><strong>{{ part(5) }}</strong><span>{{ part(6) }}</span></li>
        </ol>
        <p v-if="part(7)" class="pd-note">{{ part(7) }}</p>
        <div v-if="complete" class="pd-references pd-arrive"><a :href="doc('部署准备')"><span>01</span> 部署准备 <PortalIcon name="arrow" /></a><a :href="doc('独立进程部署')"><span>02</span> 独立进程部署 <PortalIcon name="arrow" /></a></div>
        <button type="button" v-if="complete" class="pd-source-toggle" :aria-expanded="sourcesOpen" @click="sourcesOpen = !sourcesOpen">{{ sourcesOpen ? '收起来源摘录 −' : '查看来源摘录 ＋' }}</button>
        <blockquote v-if="sourcesOpen" class="pd-source">“确认同一 PostgreSQL 上只会启动一个启澜执行器。第二个进程会在取得顾问锁失败后退出。”<cite>《部署准备》· 步骤 6</cite></blockquote>
      </div>
      <div v-else-if="scene === 'query'" class="pd-panel">
        <div class="pd-question">本周还有哪些接入事项没完成？</div>
        <div v-if="waiting" class="pd-thinking" aria-hidden="true"><i></i><i></i><i></i><span>正在准备回答</span></div>
        <div v-if="answering" class="pd-answer-heading"><PortalIcon name="tool" /><span>接入计划 · 演示数据</span></div>
        <p v-if="answering" class="pd-answer">{{ part(0) }}</p>
        <div v-if="elapsed >= 2350" class="pd-stats pd-arrive"><div><strong>3<span> 项</span></strong><small>未完成事项</small></div><div><strong>1<span> 项</span></strong><small>高优先级</small></div><div><strong>2<span> 项</span></strong><small>待处理</small></div></div>
        <div v-if="complete" class="pd-filters" role="group" aria-label="任务筛选"><button type="button" :aria-pressed="!pendingOnly" @click="pendingOnly = false">全部</button><button type="button" :aria-pressed="pendingOnly" @click="pendingOnly = true">待处理</button><span aria-live="polite">显示 {{ visibleTasks.length }} 项</span></div>
        <div v-if="elapsed >= 2650" class="pd-table-scroll pd-arrive" tabindex="0" aria-label="演示任务表"><table><thead><tr><th>事项</th><th>负责人</th><th>状态</th></tr></thead><tbody><tr v-for="task in (complete ? visibleTasks : tasks.slice(0, Math.max(0, Math.floor((elapsed - 2650) / 350) + 1)))" :key="task.id"><td><small>{{ task.id }}<b v-if="task.priority === '高'">高优先</b></small><strong>{{ task.title }}</strong></td><td>{{ task.owner }}</td><td><span class="pd-status" :class="{ 'pd-pending': task.status === '待处理' }">{{ task.status }}</span></td></tr></tbody></table></div>
        <p v-if="complete" class="pd-note">可切换上方筛选，查看待处理事项。</p>
      </div>
      <div v-else class="pd-panel">
        <div class="pd-question">把任务 ST-102 的截止时间调整到 11 月 6 日。</div>
        <div v-if="waiting" class="pd-thinking" aria-hidden="true"><i></i><i></i><i></i><span>正在准备回答</span></div>
        <div v-if="answering" class="pd-answer-heading"><PortalIcon name="security" /><span>变更确认 · 演示数据</span></div>
        <p v-if="answering" class="pd-answer">{{ part(0) }}</p>
        <div v-if="elapsed >= 2400" class="pd-change pd-arrive"><div class="pd-change-title"><span>ST-102</span><strong>前端组件嵌入</strong></div><div class="pd-dates"><div><small>原截止时间</small><strong>11 月 4 日</strong></div><PortalIcon name="arrow" /><div><small>拟调整为</small><strong>11 月 6 日</strong></div></div><p>仅修改截止时间，负责人和任务状态保持不变。</p></div>
        <div v-if="complete && decision === 'pending'" class="pd-decision pd-arrive"><p>请确认是否执行这项变更。</p><div><button type="button" class="pd-confirm" @click="decision = 'approved'">确认变更</button><button type="button" @click="decision = 'rejected'">拒绝</button></div></div>
        <div v-else-if="complete" class="pd-result" role="status"><PortalIcon :name="decision === 'approved' ? 'activity' : 'security'" /><p>{{ decision === 'approved' ? '演示已确认：截止时间已调整为 11 月 6 日。' : '演示已拒绝：保留原截止时间 11 月 4 日。' }}</p><button type="button" @click="decision = 'pending'">重置演示 ↺</button></div>
      </div>
    </div>
    <footer class="pd-footer"><span></span>{{ scene === 'knowledge' ? '引用来自当前文档 · 非在线问答' : '使用本地演示数据 · 不调用业务服务' }}</footer>
  </div>
</template>

<style scoped>
.pd-header-actions { display: flex; gap: 14px; align-items: center; }
.pd-replay { font-size: 11px; color: var(--vp-c-text-2); padding: 6px 0; }
.pd-replay:disabled { opacity: .35; cursor: default; }
.pd-stage-announcement { position: absolute !important; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.pd-question { transition: transform .35s ease, opacity .35s ease; }
.pd-sending .pd-question { transform: translateY(12px); opacity: .3; }
.pd-thinking { display: flex; align-items: center; gap: 5px; min-height: 32px; color: var(--vp-c-text-3); font-size: 11px; }
.pd-thinking span { margin-left: 5px; }
.pd-thinking i { width: 4px; height: 4px; background: var(--st-accent); border-radius: 50%; animation: pd-think .9s ease-in-out infinite alternate; }
.pd-thinking i:nth-child(2) { animation-delay: .15s; }.pd-thinking i:nth-child(3) { animation-delay: .3s; }
.pd-cursor { display: inline-block; width: 2px; height: 1em; margin-left: 3px; vertical-align: -.12em; background: var(--st-accent); animation: pd-think .5s ease-in-out infinite alternate; }
.pd-arrive { animation: pd-arrive .35s ease both; }
@keyframes pd-think { from { opacity: .3; } to { opacity: 1; } }
@keyframes pd-arrive { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
@media(prefers-reduced-motion:reduce) { .pd-question { transition: none; }.pd-arrive,.pd-thinking i,.pd-cursor { animation: none; } }

.pd-demo { display: flex; flex-direction: column; height: 600px; border-radius: 16px; overflow: hidden; font-size: 14px; }
.pd-header,.pd-footer { flex-shrink: 0; }
.pd-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid var(--vp-c-divider); }
.pd-identity { display: flex; align-items: center; gap: 12px; }
.pd-identity > svg { width: 36px; height: 36px; padding: 7px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); border-radius: 10px; }
.pd-identity strong,.pd-identity span { display: block; }
.pd-identity strong { font-size: 15px; font-weight: 600; }
.pd-identity span { font-size: 10px; color: var(--vp-c-text-3); margin-top: 3px; }
.pd-badge { color: var(--vp-c-text-3); font-size: 11px; }
.pd-demo button { cursor: pointer; }
.pd-demo button:focus-visible,.pd-demo a:focus-visible,.pd-table-scroll:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 3px; }
.pd-body:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: -3px; }
.pd-body { flex: 1; padding: 18px 24px 12px; min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--vp-c-divider) transparent; }
.pd-question { padding: 12px 16px; border-radius: 10px 10px 2px 10px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); margin: 0 0 24px 28px; line-height: 1.7; font-size: 13px; }
.pd-answer-heading { display: flex; align-items: center; gap: 7px; color: var(--st-accent); font-size: 11px; margin-bottom: 12px; }
.pd-answer-heading svg { width: 15px; height: 15px; }
.pd-answer { margin: 0 0 12px; line-height: 1.7; }
.pd-facts { margin: 0; padding-left: 22px; }
.pd-facts li { padding-left: 4px; margin: 9px 0; }
.pd-facts li::marker { color: var(--vp-c-text-3); }
.pd-facts strong { font-weight: 550; font-size: 13px; }
.pd-facts span { display: block; font-size: 12px; color: var(--vp-c-text-2); line-height: 1.7; }
.pd-note { font-size: 11px; line-height: 1.8; color: var(--vp-c-text-2); margin: 12px 0; }
.pd-references { display: flex; gap: 10px; }
.pd-references a { display: flex; align-items: center; gap: 8px; border: 1px solid var(--vp-c-divider); padding: 10px; border-radius: 6px; font-size: 11px; color: var(--vp-c-brand-1); flex: 1; min-height: 44px; }
.pd-references a > span { font-size: 9px; color: var(--vp-c-text-3); }
.pd-references svg { width: 12px; height: 12px; margin-left: auto; }
.pd-source-toggle { font-size: 11px; color: var(--vp-c-text-2); min-height: 44px; }
.pd-source { font-size: 12px; line-height: 1.9; margin: 0; padding: 8px 12px; border-left: 2px solid var(--vp-c-brand-1); color: var(--vp-c-text-2); background: var(--vp-c-bg-soft); }
.pd-source cite { display: block; font-style: normal; font-size: 10px; color: var(--vp-c-text-3); margin-top: 6px; }
.pd-stats { display: grid; grid-template-columns: repeat(3,1fr); padding: 8px 0 22px; }
.pd-stats > div { padding-left: 16px; border-left: 1px solid var(--vp-c-divider); }
.pd-stats strong { display: block; font-size: 28px; font-weight: 550; line-height: 1.5; }
.pd-stats strong span { font-size: 11px; font-weight: 400; color: var(--vp-c-text-3); }
.pd-stats small { color: var(--vp-c-text-2); font-size: 11px; }
.pd-filters { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.pd-filters button { min-height: 36px; padding: 0 13px; font-size: 12px; border-radius: 5px; color: var(--vp-c-text-2); }
.pd-filters button[aria-pressed=true] { background: var(--vp-c-bg-soft); color: var(--vp-c-brand-1); }
.pd-filters > span { font-size: 10px; margin-left: auto; color: var(--vp-c-text-3); }
.pd-table-scroll { overflow-x: auto; }
.pd-table-scroll table { width: 100%; border-collapse: collapse; text-align: left; min-width: 340px; }
.pd-table-scroll th { font-size: 10px; font-weight: 400; color: var(--vp-c-text-3); padding: 10px 8px; border-bottom: 1px solid var(--vp-c-divider); }
.pd-table-scroll td { font-size: 11px; padding: 14px 8px; border-bottom: 1px solid var(--vp-c-divider); white-space: nowrap; }
.pd-table-scroll td strong { display: block; font-size: 12px; font-weight: 500; margin-top: 4px; }
.pd-table-scroll td small { font-size: 9px; color: var(--vp-c-text-3); }
.pd-table-scroll b { font-size: 8px; margin-left: 6px; color: var(--vp-c-warning-1); font-weight: 400; }
.pd-status { color: var(--st-accent); }.pd-pending { color: var(--vp-c-text-2); }
.pd-change { border: 1px solid var(--vp-c-divider); border-radius: 8px; padding: 20px; }
.pd-change-title span { display: block; color: var(--vp-c-text-3); font-size: 10px; margin-bottom: 5px; }
.pd-change-title strong { font-size: 15px; font-weight: 550; }
.pd-dates { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 24px 0; }
.pd-dates small { display: block; color: var(--vp-c-text-3); font-size: 10px; margin-bottom: 5px; }
.pd-dates strong { font-size: 19px; font-weight: 500; }.pd-dates > div:last-child strong { color: var(--vp-c-brand-1); }
.pd-dates > svg { width: 20px; height: 20px; color: var(--vp-c-text-3); }
.pd-change p { font-size: 11px; color: var(--vp-c-text-2); margin: 0; line-height: 1.8; }
.pd-decision p { font-size: 12px; color: var(--vp-c-text-2); margin: 18px 0 12px; }
.pd-decision > div { display: flex; gap: 10px; }
.pd-decision button { min-height: 42px; padding: 0 22px; border: 1px solid var(--vp-c-divider); border-radius: 6px; font-size: 12px; }
.pd-decision .pd-confirm { color: var(--vp-c-bg); background: var(--vp-c-brand-1); border-color: transparent; }
.pd-result { padding-top: 22px; }.pd-result > svg { width: 20px; height: 20px; color: var(--st-accent); }
.pd-result p { font-size: 13px; line-height: 1.8; margin: 8px 0; }.pd-result button { font-size: 11px; min-height: 40px; color: var(--vp-c-brand-1); }
.pd-footer { display: flex; align-items: center; gap: 7px; border-top: 1px solid var(--vp-c-divider); padding: 13px 24px; font-size: 10px; color: var(--vp-c-text-3); }
.pd-footer > span { width: 4px; height: 4px; border-radius: 50%; background: var(--st-accent); }
@media(max-width:767px) { .pd-header { padding: 18px; }.pd-body { padding: 18px 16px 12px; }.pd-question { margin-left: 12px; }.pd-references { flex-wrap: wrap; }.pd-references a { min-width: 120px; }.pd-change { padding: 16px; }.pd-dates strong { font-size: 16px; }.pd-footer { padding: 13px 16px; } }
</style>

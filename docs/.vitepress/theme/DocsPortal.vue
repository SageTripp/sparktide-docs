<script setup lang="ts">
import { withBase } from 'vitepress'
defineProps<{ section: 'start' | 'journey' | 'stack' | 'capabilities' | 'reference' }>()
const url = (path: string) => withBase(path + '.html')
const icons = {
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm4 5-2.5 5.5L8 16l2.5-5.5L16 8Z',
  connect: 'M8 7H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3m8-10h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3M7 12h10m-3-3 3 3-3 3',
  server: 'M5 3h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 10h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2ZM7 7h.01M7 17h.01',
}
const entries = [
  { title: '了解启澜', description: '理解平台、双 SDK 与业务系统如何协作。', link: '/开始使用/产品介绍', icon: 'compass', action: '认识产品' },
  { title: '接入已有系统', description: '保留原有认证与业务服务，逐步嵌入智能体。', link: '/开发接入/接入流程', icon: 'connect', action: '查看接入路线' },
  { title: '部署底座', description: '选择部署方式，配置网关、持久化与运行环境。', link: '/部署运维/README', icon: 'server', action: '准备运行环境' },
]
const journey = [
  { title: '准备环境', description: '获取固定制品，启动底座。', link: '/教程/准备环境' },
  { title: '连接应用', description: '创建应用，连接后台与界面。', link: '/教程/创建应用' },
  { title: '验证对话', description: '发送消息，检查会话与历史。', link: '/教程/验证对话' },
]
const capabilities = [
  { title: '模型与智能体', description: '选择模型，定义职责和可用能力。', link: '/使用指南/智能体', mark: '01' },
  { title: '业务工具', description: '调用已有服务，让助手完成业务操作。', link: '/使用指南/业务工具', mark: '02' },
  { title: '知识与引用', description: '连接知识来源，追溯回答依据。', link: '/使用指南/知识库', mark: '03' },
  { title: '身份与权限', description: '沿用业务身份，明确授权和数据边界。', link: '/使用指南/应用与权限', mark: '04' },
  { title: '会话与交互', description: '处理流式消息、确认、取消与恢复。', link: '/使用指南/运行与审计', mark: '05' },
  { title: '业务卡片', description: '将工具结果渲染成可理解的界面。', link: '/使用指南/界面组件', mark: '06' },
]
const reference = [
  { title: 'SDK 参考', description: '方法、类型、框架集成', link: '/开发接入/README' },
  { title: 'HTTP 与事件', description: '接口、字段、SSE 协议', link: '/接口参考/README' },
  { title: '部署与运维', description: '上线、备份、监控与排障', link: '/部署运维/README' },
  { title: '控制台手册', description: '授权、运行查看与日常管理', link: '/使用指南/控制台/README' },
]
</script>

<template>
  <div v-if="section === 'start'" class="entry-grid" aria-label="选择你的起点">
    <a v-for="entry in entries" :key="entry.title" :href="url(entry.link)" class="entry-card">
      <svg class="entry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="icons[entry.icon as keyof typeof icons]" /></svg>
      <h2>{{ entry.title }}</h2><p>{{ entry.description }}</p><span class="card-action">{{ entry.action }} <span aria-hidden="true">↗</span></span>
    </a>
  </div>
  <div v-else-if="section === 'journey'" class="journey-block">
    <ol class="journey-steps">
      <li v-for="(step, index) in journey" :key="step.title"><a :href="url(step.link)"><span class="step-index">{{ index + 1 }}</span><span><strong>{{ step.title }}</strong><small>{{ step.description }}</small></span></a></li>
    </ol>
    <a class="text-action" :href="url('/教程/README')">开始公开 0.1.0 连续教程 <span aria-hidden="true">→</span></a>
  </div>
  <div v-else-if="section === 'stack'" class="stack-grid">
    <section class="stack-card"><div class="stack-heading"><span class="stack-code" aria-hidden="true">{ }</span><h3>业务后台</h3><span class="small-label">内部候选</span></div><p>用类型化声明连接模型与业务能力。</p><div class="stack-links"><a :href="url('/开发接入/业务后台SDK') + '#安装'">Java <span aria-hidden="true">↗</span></a><a :href="url('/开发接入/业务后台SDK')">Kotlin <span aria-hidden="true">↗</span></a></div></section>
    <section class="stack-card"><div class="stack-heading"><span class="stack-code" aria-hidden="true">&lt;/&gt;</span><h3>前端应用</h3><span class="small-label">内部候选</span></div><p>一个客户端，统一会话与交互状态。</p><div class="stack-links"><a :href="url('/开发接入/React与Vue') + '#默认面板'">React <span aria-hidden="true">↗</span></a><a :href="url('/开发接入/React与Vue') + '#默认面板'">Vue 3 <span aria-hidden="true">↗</span></a><a :href="url('/开发接入/React与Vue') + '#vue-2'">Vue 2 <span aria-hidden="true">↗</span></a><a :href="url('/开发接入/前端SDK')">JS / TS <span aria-hidden="true">↗</span></a></div></section>
  </div>
  <div v-else-if="section === 'capabilities'" class="capability-grid">
    <a v-for="item in capabilities" :key="item.title" :href="url(item.link)" class="capability-link"><span class="capability-mark" aria-hidden="true">{{ item.mark }}</span><div><h3>{{ item.title }}</h3><p>{{ item.description }}</p></div><span class="link-arrow" aria-hidden="true">↗</span></a>
  </div>
  <div v-else class="reference-grid">
    <a v-for="item in reference" :key="item.title" :href="url(item.link)"><h3>{{ item.title }} <span aria-hidden="true">↗</span></h3><p>{{ item.description }}</p></a>
  </div>
</template>

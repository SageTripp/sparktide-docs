<script setup lang="ts">
import { withBase } from 'vitepress'
const url = (path: string) => withBase(path + '.html')
const entries = [
  {title:'接入应用',description:'注解声明业务能力，复用现有认证，接入双 SDK 开发候选。',link:'/开发接入/SDK简化接入',action:'查看接入指南'},
  {title:'管理平台',description:'管理应用，维护参数配置，查询运行记录和告警。',link:'/使用指南/控制台/README',action:'查看控制台手册'},
  {title:'部署与运维',description:'部署服务、配置网关与数据库，执行升级、备份与故障排查。',link:'/部署运维/README',action:'查看运维指南'}
]
const steps = [
  {title:'确认版本',link:'/开始使用/版本与获取'}, {title:'声明后台',link:'/开发接入/SDK简化接入'},
  {title:'复用业务认证',link:'/开发接入/业务后台SDK'}, {title:'创建客户端',link:'/开发接入/前端SDK'},
  {title:'嵌入聊天页面',link:'/开发接入/React与Vue'}, {title:'联合验收',link:'/开发接入/接入流程'}
]
const capabilities = [
  {title:'模型与调用配置',detail:'模型服务、应用授权、候选策略和用量',link:'/使用指南/模型接入'},
  {title:'智能体与工具',detail:'智能体职责、业务操作和确认要求',link:'/使用指南/智能体'},
  {title:'知识与检索',detail:'业务资料、访问权限和检索效果',link:'/使用指南/知识库'},
  {title:'身份与权限',detail:'业务登录、租户隔离和可信上下文',link:'/使用指南/应用与权限'},
  {title:'版本与发布',detail:'依赖检查、默认入口和版本回退',link:'/使用指南/批次发布'},
  {title:'会话与界面',detail:'流式消息、取消、确认和业务组件',link:'/使用指南/运行与审计'}
]
const references = [
  {title:'Java / Kotlin SDK',link:'/开发接入/业务后台SDK'}, {title:'JS / TS SDK',link:'/开发接入/前端SDK'},
  {title:'React / Vue3 / Vue2',link:'/开发接入/React与Vue'}, {title:'HTTP API',link:'/接口参考/README'},
  {title:'事件协议',link:'/接口参考/事件协议'}, {title:'环境变量',link:'/部署运维/环境变量'}
]
</script>

<template>
  <main class="docs-portal">
    <header class="portal-intro">
      <p class="portal-kicker">产品文档</p>
      <h1>SparkTide 文档</h1>
      <p class="portal-description">了解平台能力，接入业务应用，管理运行与部署。</p>
      <div class="portal-intro-links">
        <a :href="url('/开始使用/产品介绍')">产品概览</a>
        <a :href="url('/开始使用/版本与获取')">安装与获取</a>
        <a :href="url('/产品支持/版本说明')">版本说明</a>
      </div>
    </header>
    <section class="portal-entries" aria-label="按任务选择文档">
      <a v-for="entry in entries" :key="entry.title" :href="url(entry.link)" class="portal-entry">
        <h2>{{ entry.title }}</h2><p>{{ entry.description }}</p><span>{{ entry.action }}</span>
      </a>
    </section>
    <section class="portal-path" aria-labelledby="path-heading">
      <div class="portal-section-heading"><h2 id="path-heading">应用接入流程</h2><a :href="url('/开发接入/SDK简化接入')">新版指南</a></div>
      <ol><li v-for="(step,index) in steps" :key="step.title"><a :href="url(step.link)"><span>{{ String(index+1).padStart(2,'0') }}</span>{{ step.title }}</a></li></ol>
      <p>新版 API 使用内部开发候选，尚未公开发行；公开 0.1.0 下载示例在固定版本教程中保留，不与新 API 混用。</p>
    </section>
    <div class="portal-columns">
      <section aria-labelledby="capabilities-heading">
        <div class="portal-section-heading"><h2 id="capabilities-heading">能力指南</h2><a :href="url('/使用指南/README')">全部指南</a></div>
        <div class="portal-capabilities"><a v-for="item in capabilities" :key="item.title" :href="url(item.link)"><h3>{{ item.title }}</h3><p>{{ item.detail }}</p></a></div>
      </section>
      <aside class="portal-reference" aria-label="参考资料">
        <h2>参考资料</h2><a v-for="item in references" :key="item.title" :href="url(item.link)">{{ item.title }}</a>
        <div class="portal-support"><h3>需要帮助？</h3><a :href="url('/产品支持/常见问题')">常见问题</a><a :href="url('/部署运维/监控与排障')">故障排查</a><a :href="url('/产品支持/能力状态')">能力与限制</a></div>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import VPFlyout from 'vitepress/dist/client/theme-default/components/VPFlyout.vue'
import versions from '../versions.json'

const { frontmatter } = useData()
const current = computed(() => frontmatter.value.productVersion || versions.current)
const items = versions.versions.map(version => ({ text: version.label, link: `/${version.id}/README` }))
items.push({ text: '全部版本', link: '/版本/README' })
</script>

<template>
  <div class="docs-brand">
    <a class="docs-brand-home" :href="withBase('/')" aria-label="启澜产品首页">
      <img :src="withBase('/sparktide-logo.webp')" alt="" width="28" height="28" />
      <span>{{ frontmatter.pageClass === 'product-home' ? '启澜 SparkTide' : '启澜文档' }}</span>
    </a>
    <VPFlyout class="docs-version" :button="current" :label="`选择文档版本，当前 ${current}`" :items="items" />
  </div>
</template>

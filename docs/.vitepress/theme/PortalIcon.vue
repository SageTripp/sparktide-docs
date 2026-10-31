<script setup lang="ts">
defineProps<{ name: string }>()
const paths: Record<string, string> = {
  model: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
  tool: 'M8 7H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3m8-10h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3M7 12h10m-3-3 3 3-3 3',
  knowledge: 'M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4Zm8 2v15M7 8h2m-2 4h2m6-4h2m-2 4h2',
  interface: 'M3 4h18v14H8l-5 3ZM7 8h10M7 12h6',
  security: 'm12 2 8 3v6c0 5-8 11-8 11S4 16 4 11V5Zm-4 9 3 3 5-6',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  arrow: 'M5 12h14m-6-6 6 6-6 6'
}
</script>
<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.model" /></svg></template>

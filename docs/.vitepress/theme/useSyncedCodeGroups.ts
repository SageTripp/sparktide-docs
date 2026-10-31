import { onMounted, onUnmounted } from 'vue'
import { onContentUpdated } from 'vitepress'

// 构建工具的 Kotlin DSL 与业务代码的 Kotlin 是两种独立偏好。
const families = {
  'jvm-language': ['Java', 'Kotlin'],
  'web-framework': ['React', 'Vue 3', 'Vue 2'],
  'web-language': ['TypeScript', 'JavaScript'],
  'node-package-manager': ['npm', 'pnpm', 'Yarn'],
  'jvm-build-tool': ['Gradle Kotlin DSL', 'Gradle Groovy DSL', 'Maven']
} as const
type Family = keyof typeof families
const storagePrefix = 'sparktide:docs:code-group:'

function describe(group: Element) {
  const inputs = Array.from(group.querySelectorAll<HTMLInputElement>(':scope > .tabs > input'))
  const labels = Array.from(group.querySelectorAll<HTMLElement>(':scope > .tabs > label'))
  const titles = labels.map(label => {
    const title = label.dataset.title || label.textContent?.trim() || ''
    return title === 'Vue' ? 'Vue 3' : title
  })
  const family = (Object.keys(families) as Family[]).find(key =>
    titles.length > 1 && titles.every(title => (families[key] as readonly string[]).includes(title)))
  return { family, inputs, titles }
}

function select(group: Element, title: string) {
  const { inputs, titles } = describe(group)
  const index = titles.indexOf(title)
  const blocks = group.querySelector(':scope > .blocks')
  if (index < 0 || !blocks?.children[index] || inputs.length !== titles.length) return
  inputs.forEach((input, i) => { input.checked = i === index })
  Array.from(blocks.children).forEach((block, i) => block.classList.toggle('active', i === index))
}

export function useSyncedCodeGroups() {
  const preferences = new Map<Family, string>()
  let frame: number | undefined
  let mounted = false
  const groups = () => Array.from(document.querySelectorAll('.vp-code-group'))

  function restore() {
    for (const group of groups()) {
      const { family } = describe(group)
      if (!family) continue
      let title = preferences.get(family)
      if (!title) {
        try { title = localStorage.getItem(storagePrefix + family) || undefined } catch { /* 禁用存储时仍支持本页联动。 */ }
        if (title && (families[family] as readonly string[]).includes(title)) preferences.set(family, title)
        else title = undefined
      }
      if (title) select(group, title)
    }
  }

  function scheduleRestore() {
    if (!mounted) return
    if (frame !== undefined) cancelAnimationFrame(frame)
    // 等待 VitePress 在开发模式中恢复代码块默认状态后再应用偏好。
    frame = requestAnimationFrame(() => { frame = undefined; restore() })
  }

  function changed(event: Event) {
    const input = event.target
    if (!(input instanceof HTMLInputElement) || input.type !== 'radio') return
    const group = input.closest('.vp-code-group')
    if (!group) return
    const { family, inputs, titles } = describe(group)
    const title = titles[inputs.indexOf(input)]
    if (!family || !title) return
    preferences.set(family, title)
    try { localStorage.setItem(storagePrefix + family, title) } catch { /* 存储不可用不影响切换。 */ }
    for (const other of groups()) {
      if (describe(other).family === family) select(other, title)
    }
  }

  function storageChanged(event: StorageEvent) {
    if (!event.key?.startsWith(storagePrefix)) return
    const family = event.key.slice(storagePrefix.length) as Family
    if (!(family in families)) return
    if (event.newValue && (families[family] as readonly string[]).includes(event.newValue)) {
      preferences.set(family, event.newValue)
      restore()
    }
  }

  onMounted(() => {
    mounted = true
    document.addEventListener('change', changed)
    window.addEventListener('storage', storageChanged)
    scheduleRestore()
  })
  onContentUpdated(scheduleRestore)
  onUnmounted(() => {
    mounted = false
    document.removeEventListener('change', changed)
    window.removeEventListener('storage', storageChanged)
    if (frame !== undefined) cancelAnimationFrame(frame)
  })
}

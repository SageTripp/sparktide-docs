import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const catalog = JSON.parse(await readFile('docs/.vitepress/versions.json', 'utf8'))
let pairs = 0
let frameworkGroups = 0
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) { await check(file); continue }
    if (!file.endsWith('.md')) continue
    const text = await readFile(file, 'utf8')
    const groups = [...text.matchAll(/^::: code-group\s*\r?\n([\s\S]*?)^:::\s*$/gm)]
    for (const fence of text.matchAll(/^```(java|kotlin)(?:\s+\[([^\]]+)\])?\s*$/gm)) {
      if (fence[2]?.startsWith('Gradle')) continue
      const group = groups.find(item => fence.index > item.index && fence.index < item.index + item[0].length)
      assert.ok(group, `${file}：${fence[1]} 示例必须放在可切换的代码组内`)
      assert.match(group[1], /^```java\s+\[Java\]/m, `${file}：缺少 Java 对照`)
      assert.match(group[1], /^```kotlin\s+\[Kotlin\]/m, `${file}：缺少 Kotlin 对照`)
    }
    for (const group of groups) {
      if (/^```java\s+\[Java\]/m.test(group[1])) pairs++
      if (/\[React\]/.test(group[1]) && /\[Vue (?:2|3)\]/.test(group[1])) {
        for (const label of ['React', 'Vue 3', 'Vue 2']) assert.ok(group[1].includes(`[${label}]`), `${file}：框架对照缺少 ${label}`)
        frameworkGroups++
      }
    }
  }
}
await check(path.join('docs', catalog.current))
assert.ok(pairs > 0, '当前版本缺少 Java / Kotlin 示例')
assert.ok(frameworkGroups > 0, '当前版本缺少前端框架对照')
console.log(`示例标签检查通过：${pairs} 组 Java / Kotlin、${frameworkGroups} 组 React / Vue 3 / Vue 2。`)

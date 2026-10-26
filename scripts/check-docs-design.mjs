import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
const root = new URL('../docs/.vitepress/dist/', import.meta.url)
const read = (name) => readFile(new URL(name, root), 'utf8')
const home = await read('index.html')
const build = JSON.parse(await read('build-info.json'))
assert.equal(build.revision, process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim())
assert.equal(typeof build.sourceDirty, 'boolean')
assert.ok(home.includes(`name="sparktide-docs-revision" content="${build.revision}"`))
assert.equal((home.match(/<h1\b/g) || []).length, 1)
for (const marker of ['VPSidebar', 'VPDocAsideOutline', '把智能体接入你的业务', '了解启澜', '接入已有系统', '部署底座', '内部候选', '公开 0.1.0', '从第一轮对话开始', '按技术栈接入', '为应用增加能力', '上线与查阅']) {
  assert.ok(home.includes(marker), `Homepage missing ${marker}`)
}
const candidate = await read('开发接入/SDK简化接入.html')
for (const marker of ['0.1.1-auth.20261023-6', '尚未公开', 'id="_4-连接平台并复用现有登录"']) assert.ok(candidate.includes(marker), marker)
const fixed = await read('教程/README.html')
for (const marker of ['0.1.0', '固定版本教程', 'sparktide-tutorial.zip']) assert.ok(fixed.includes(marker), marker)
const framework = await read('开发接入/React与Vue.html')
for (const id of ['默认面板', 'vue-2']) assert.ok(framework.includes(`id="${id}"`), id)
// Legacy route coverage is validated by check-site; no route aliases are removed here.
console.log(`Docs design regressions passed: homepage, version boundaries, framework anchors, build provenance (${build.revision.slice(0, 7)}${build.sourceDirty ? ', working tree' : ''}).`)

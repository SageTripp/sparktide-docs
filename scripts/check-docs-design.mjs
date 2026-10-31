import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
const root = path.resolve('docs/.vitepress/dist')
const read = name => readFile(path.join(root, name), 'utf8')
const catalog = JSON.parse(await readFile('docs/.vitepress/versions.json', 'utf8'))
const home = await read('index.html')
const build = JSON.parse(await read('build-info.json'))
assert.equal(build.revision, process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim())
assert.equal(build.currentVersion, catalog.current)
assert.equal(typeof build.sourceDirty, 'boolean')
assert.equal((home.match(/<h1\b/g) || []).length, 1)
for (const marker of ['SparkTide', '让智能体', '走进业务', '产品能力', '接入方式', '应用场景', '交互演示', catalog.current]) assert.ok(home.includes(marker), `首页缺少 ${marker}`)
assert.ok(!home.includes('公开 0.1.0'))
const sections = ['快速开始', '开发接入', '能力指南', '控制台操作', '部署运维', '参考资料']
for (const version of catalog.versions) {
  const versionHome = await read(`${version.id}/README.html`)
  assert.ok(versionHome.includes(`启澜 ${version.id}`), '版本页缺少版本号')
  for (const section of sections) {
    const html = await read(`${version.id}/${section}/README.html`)
    assert.ok(html.includes('VPSidebar'), `${section} 缺少栏目目录`)
    assert.ok(html.includes(version.id), `${section} 缺少版本上下文`)
    assert.ok(!html.includes('class="version-context"'), `${section} 不应显示重复版本条`)
    // 栏目侧栏不应再次展示全部六栏的详细文章。
    const sidebar = html.match(/<aside class="VPSidebar[\s\S]*?<\/aside>/)?.[0] || ''
    assert.ok(sidebar.includes('← 版本首页'), `${section} 缺少返回版本首页的箭头`)
    const links = [...sidebar.matchAll(/href="([^"]+)"/g)].map(match => decodeURIComponent(match[1]))
    for (const link of links) if (link.includes(`/${version.id}/`) && !link.endsWith(`/${version.id}/README.html`)) {
      assert.ok(link.includes(`/${version.id}/${section}/`), `侧栏越出栏目：${link}`)
    }
  }
  const capability = await read(`${version.id}/参考资料/能力与限制.html`)
  for (const marker of ['单活', '未开放', 'OTLP', 'UNKNOWN']) assert.ok(capability.includes(marker), `能力边界缺少 ${marker}`)
  const api = await read(`${version.id}/参考资料/HTTP接口/能力与知识.html`) + await read(`${version.id}/参考资料/HTTP接口/治理与运维.html`)
  assert.ok(api.includes('当前未开放'), '预留 API 必须显示未开放提示')
  for (const name of ['聊天与任务', '身份与应用', '能力与知识', '治理与运维', '业务聊天接口']) {
    const source = await readFile(`docs/${version.id}/参考资料/HTTP接口/${name}.md`, 'utf8')
    assert.ok(!/^## (GET|POST|PUT|PATCH|DELETE)\b/m.test(source), `${name} 操作必须使用中文功能标题`)
    assert.ok(!source.includes('结构化错误；通过 error.code 判断原因'), `${name} 不能用通用占位文案代替错误说明`)
  }
  await read(`${version.id}/参考资料/公共错误码.html`)
  await read(`${version.id}/参考资料/更新日志.html`)
}
const top = await readdir(root)
for (const old of ['教程', '开始使用', '使用指南', '开发接入', '部署运维', '接口参考', '产品支持', '归档', 'downloads', 'maven']) assert.ok(!top.includes(old), `旧内容进入当前站点：${old}`)
async function verify(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) await verify(file)
    else if (entry.name.endsWith('.md')) {
      const text = await readFile(file, 'utf8')
      const relative = path.relative(path.resolve('docs'), file).split(path.sep).join('/')
      const version = catalog.versions.find(item => relative.startsWith(item.id + '/'))
      if (!version) continue
      assert.ok(text.includes(`productVersion: "${version.id}"`), `文档版本缺失或不符：${relative}`)
      assert.ok(!/D:\\Workspace|C:\\Users|0\.1\.1-auth\./.test(text), `内部路径或旧候选混入：${relative}`)
    }
  }
}
await verify(path.resolve('docs', catalog.current))
console.log(`版本与结构检查通过：${catalog.versions.length} 套文档、六个独立栏目、旧内容隔离、能力边界与构建来源。`)

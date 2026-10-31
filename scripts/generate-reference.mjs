import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { errorSection, explainStatus, operationAnchor, publicErrorMarkdown, unavailable } from './reference-errors.mjs'
import { fieldNote } from './reference-fields.mjs'

const catalog = JSON.parse(await readFile('docs/.vitepress/versions.json', 'utf8'))
const version = process.argv[2] || catalog.current
const release = catalog.versions.find(item => item.id === version)
if (!release) throw new Error('未知文档版本：' + version)
const root = path.resolve('docs', version, '参考资料/HTTP接口')
await mkdir(root, { recursive: true })
const download = `/版本/${version}`
const readContract = name => readFile(path.resolve('docs/public', '版本', version, name), 'utf8').then(JSON.parse)
const contract = await readContract('openapi.json')
const business = await readContract('business-chat.openapi.json')
const domainErrors = JSON.parse(await readFile(new URL('./reference-domain-errors.json', import.meta.url), 'utf8'))
const domainStatuses = JSON.parse(await readFile(new URL('./reference-domain-statuses.json', import.meta.url), 'utf8'))
if (JSON.stringify(Object.keys(domainErrors).sort()) !== JSON.stringify(Object.keys(domainStatuses).sort())) throw new Error('领域错误说明与状态清单不一致')
const esc = value => String(value ?? '').replaceAll('|', '&#124;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', ' ')
const meta = title => `---\ntitle: "${title}"\nproductVersion: "${version}"\nupdated: "${release.updated}"\nsource: "sparktide-platform/contracts；scripts/generate-reference.mjs；scripts/reference-errors.mjs；scripts/reference-fields.mjs"\n---\n\n# ${title}\n\n`
const warning = '\n::: warning 合同与开放范围\n本页是本版本随附机器合同的字段参考，合同包含预留操作，不代表每个接口都已开放。调用前先查[当前能力与限制](../能力与限制.md)。失败时请结合本页错误表与[公共错误码](../公共错误码.md)处理。\n:::\n\n'
const pointerName = ref => ref.split('/').pop().replaceAll('~1', '/').replaceAll('~0', '~')
function type(schema, schemaPage = '数据结构') {
  if (!schema) return '对象'
  if (schema.const !== undefined && schema.type === undefined && !schema.$ref && !schema.oneOf && !schema.anyOf && !schema.allOf) return esc(typeof schema.const)
  if (schema.$ref) {
    const name = pointerName(schema.$ref)
    const page = schema.$ref.includes('openapi.json#') ? '数据结构' : schemaPage
    return `[${esc(name)}](./${page}.md#schema-${name.toLowerCase()})`
  }
  if (schema.oneOf || schema.anyOf || schema.allOf) return (schema.oneOf || schema.anyOf || schema.allOf).map(item => type(item, schemaPage)).join(' / ')
  if (schema.const !== undefined && schema.type === undefined) return schema.const === null ? 'null' : typeof schema.const
  if (schema.type === 'array') return `数组：${type(schema.items || {}, schemaPage)}`
  return esc(Array.isArray(schema.type) ? schema.type.join(' / ') : schema.type || '对象')
}
function constraints(schema, description) {
  const keys = ['default', 'const', 'enum', 'minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems', 'pattern', 'format', 'additionalProperties']
  const text = description ?? schema.description
  return [text, ...keys.filter(key => schema[key] !== undefined).map(key => `${key}: ${JSON.stringify(schema[key])}`)].filter(Boolean).map(esc).join('；') || '—'
}
function fieldDescription(schema, scope, name) {
  const note = fieldNote(scope, name)
  if (note) return note
  const raw = String(schema.description || '')
  if (raw.includes('结构化错误')) return '失败时携带的 Error 信封。合同原文仍在折叠的 JSON 里；具体 error.code 见公共错误码，不要把这个对象理解成所有 HTTP 状态共用同一个原因。'
  return schema.description
}
function table(schema, schemaPage, scope, expand) {
  if (schema.oneOf && !schema.properties) {
    return schema.oneOf.map((branch, index) => {
      const mode = branch.properties?.mode?.const
      const label = mode ? `分支 ${mode}` : `分支 ${index + 1}`
      return `\n**${label}**\n` + table(branch, schemaPage, scope, expand)
    }).join('\n')
  }
  if (!schema.properties) return `\n${type(schema, schemaPage)}。${constraints(schema)}\n`
  let text = '\n| 字段 | 类型 | 必填 | 说明与约束 |\n| --- | --- | --- | --- |\n'
  text += Object.entries(schema.properties).map(([name, field]) => `| ${esc(name)} | ${type(field, schemaPage)} | ${(schema.required || []).includes(name) ? '是' : '否'} | ${constraints(field, fieldDescription(field, scope, name))} |`).join('\n')
  text += '\n'
  if (expand) {
    for (const [name, field] of Object.entries(schema.properties)) {
      if (!field.properties) continue
      text += `\n**${name}**\n` + table(field, schemaPage, scope ? `${scope}.${name}` : name, false)
    }
  }
  return text
}
function resolve(value, document) {
  if (!value?.$ref) return value
  if (!value.$ref.startsWith('#/')) throw new Error('不支持的外部引用：' + value.$ref)
  return value.$ref.slice(2).split('/').reduce((item, key) => item[key.replaceAll('~1', '/').replaceAll('~0', '~')], document)
}
function schemaOf(bodySchema, document) {
  if (!bodySchema) return { schema: {}, name: undefined }
  if (bodySchema.$ref?.startsWith('#/')) return { schema: resolve(bodySchema, document), name: pointerName(bodySchema.$ref) }
  if (bodySchema.$ref?.includes('/components/schemas/')) return { schema: contract.components.schemas[pointerName(bodySchema.$ref)] || bodySchema, name: pointerName(bodySchema.$ref) }
  return { schema: bodySchema, name: undefined }
}
function operation(route, method, op, methods, document, schemaPage, business) {
  const title = String(op.summary || `${method.toUpperCase()} ${route}`).trim()
  const anchor = operationAnchor(method, route)
  let text = `\n## ${title} {#${anchor}}\n\n\`${method.toUpperCase()} ${route}\`\n\n${esc(String(op.description || '').replaceAll('结构化错误', ' Error 信封'))}\n`
  if (!business && unavailable(route)) text += '\n::: warning 当前未开放\n当前 Node 平台尚未提供此操作。不要把合同字段或 SDK 方法的存在视为调用可用。\n:::\n'
  const parameters = [...(methods.parameters || []), ...(op.parameters || [])].map(item => resolve(item, document))
  if (parameters.length) text += '\n### 请求参数\n\n| 名称 | 位置 | 必填 | 类型与说明 |\n| --- | --- | --- | --- |\n' + parameters.map(p => `| ${esc(p.name)} | ${p.in} | ${p.required ? '是' : '否'} | ${type(p.schema || {}, schemaPage)}；${constraints(p.schema || {}, fieldNote(`${method.toUpperCase()} ${route}`, p.name) || p.description || p.schema?.description)} |`).join('\n') + '\n'
  let jsonBody = false
  let multipart = false
  if (op.requestBody) {
    const body = resolve(op.requestBody, document)
    text += '\n### 请求正文\n'
    for (const [mime, content] of Object.entries(body.content || {})) {
      if (mime.includes('json')) jsonBody = true
      if (mime.includes('multipart')) multipart = true
      const resolved = schemaOf(content.schema || {}, document)
      const scope = resolved.name || `${method.toUpperCase()} ${route}`
      text += `\nContent-Type：\`${mime}\`。正文${body.required === false ? '可选' : '必填'}。\n` + table(resolved.schema || {}, schemaPage, scope, true)
    }
  }
  text += '\n### 响应\n\n| HTTP | 说明 | 类型 |\n| --- | --- | --- |\n'
  for (const [status, raw] of Object.entries(op.responses || {})) {
    const response = resolve(raw, document)
    const meaning = Number(status) >= 400 || status === 'default' ? explainStatus(status, response.description) : (response.description || '')
    const content = Object.entries(response.content || {})
    text += content.length ? content.map(([mime, entry]) => `| ${status} | ${esc(meaning)} | ${mime}：${type(entry.schema || {}, schemaPage)} |`).join('\n') + '\n' : `| ${status} | ${esc(meaning)} | 无正文 |\n`
  }
  text += errorSection({ method, route, business, jsonBody, multipart })
  return text
}
function group(route) {
  if (/\/(chat|runs|conversations|streaming)(\/|$)/.test(route) && !route.includes('/activity/')) return '聊天与任务'
  if (/\/(agents|tools|knowledge|ui-capabilities|model-providers|models|model-bindings|model-profiles|release-plans|releases|model-compatibility|\{kind\})(\/|$)/.test(route)) return '能力与知识'
  if (route === '/v1/me' || route === '/v1/me/profile' || /^\/v1\/apps(?:\/\{app\})?$/.test(route) || /\/(tokens|default-agent|agent-entries|credentials|identity-delegations?)(\/|$)/.test(route)) return '身份与应用'
  return '治理与运维'
}
let count = 0
const groups = new Map()
for (const [route, methods] of Object.entries(contract.paths)) for (const [method, op] of Object.entries(methods)) {
  if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue
  const name = group(route)
  groups.set(name, (groups.get(name) || '') + operation(route, method, op, methods, contract, '数据结构', false))
  count++
}
const written = []
for (const [name, content] of groups) {
  const file = path.join(root, name + '.md')
  await writeFile(file, meta(name) + warning + '[HTTP 接口总览](README.md) · [数据结构](数据结构.md) · [公共错误码](../公共错误码.md)\n' + content)
  written.push(file)
}
let businessCount = 0
let businessText = meta('业务聊天接口') + warning + '这是业务后台 SDK 暴露的聊天网关合同。使用业务登录身份；路径基于业务后台配置的 HTTP 前缀，不把平台管理凭据交给浏览器。\n\n[业务数据结构](业务数据结构.md) · [公共错误码](../公共错误码.md) · [开发接入](../../开发接入/HTTP接入.md)\n'
for (const [route, methods] of Object.entries(business.paths)) for (const [method, op] of Object.entries(methods)) {
  if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue
  businessText += operation(route, method, op, methods, business, '业务数据结构', true)
  businessCount++
}
const businessFile = path.join(root, '业务聊天接口.md')
await writeFile(businessFile, businessText)
written.push(businessFile)
for (const [name, document] of [['数据结构', contract], ['业务数据结构', business]]) {
  let text = meta(name) + '由本版本机器合同生成。请求和响应字段若在文档映射里有单独的角色说明，表格采用该说明；折叠的 JSON 仍是合同原文。可选不等于允许 null；只有合同明确包含 null 时才能传入。\n\n[HTTP 接口总览](README.md) · [公共错误码](../公共错误码.md)\n'
  for (const [key, schema] of Object.entries(document.components?.schemas || {})) {
    const resolved = schema.$ref ? (schemaOf(schema, document).schema || schema) : schema
    const rawDescription = schema.description || resolved.description || ''
    const shown = String(rawDescription).includes('结构化错误') ? '失败响应使用的 Error 信封。表格说明的是各字段在该信封中的角色；折叠 JSON 保留合同原文。' : rawDescription
    text += `\n## ${key} {#schema-${key.toLowerCase()}}\n\n${esc(shown)}\n` + table(resolved.properties ? resolved : schema, name, key, false) + '\n::: details 完整定义\n\n```json\n' + JSON.stringify(schema, null, 2) + '\n```\n\n:::\n'
  }
  const file = path.join(root, name + '.md')
  await writeFile(file, text)
  written.push(file)
}
const readme = path.join(root, 'README.md')
await writeFile(readme, meta('HTTP 接口') + warning + `平台协议版本为 \`${contract.info.version}\`，文档对应平台版本为 \`${version}\`，两者用途不同。机器下载与生成页一起保存在本版本命名空间。\n\n## 按任务查询\n\n` + [...groups.keys(), '业务聊天接口', '数据结构', '业务数据结构'].map(name => `- [${name}](${name}.md)`).join('\n') + `\n\n## 错误码\n\n操作页说明各 HTTP 状态和入口错误。认证、限流、容量、运行与领域错误码见[公共错误码](../公共错误码.md)。\n\n## 下载机器合同\n\n` + ['openapi.json', 'business-chat.openapi.json', 'agent-event.schema.json', 'knowledge-callback.schema.json', 'remote-model.schema.json'].map(name => `- [${name}](${download}/${name})`).join('\n') + '\n\n## 调用前确认\n\n1. 浏览器调用业务后台聊天网关；管理与平台客户端按平台合同调用。\n2. 身份来自受信认证边界，不能用 appId 或普通 context 代替授权。\n3. 创建请求保留同一业务意图的幂等键；未知结果先读取原记录，不自动重发写操作。\n4. HTTP 成功不等于任务成功；按事件或任务终态判断执行结果。\n')
written.push(readme)
if (version === '0.2.0') {
  const errorPage = path.resolve('docs', version, '参考资料/公共错误码.md')
  await writeFile(errorPage, meta('公共错误码') + publicErrorMarkdown() + domainErrorMarkdown())
  written.push(errorPage)
}
const placeholder = /结构化错误|请求被拒绝；检查认证、权限、输入及受控错误码/
for (const file of written) {
  if (file.endsWith('数据结构.md') || file.endsWith('业务数据结构.md')) continue
  const text = await readFile(file, 'utf8')
  if (placeholder.test(text)) throw new Error('仍有泛化错误占位：' + file)
  const headings = [...text.matchAll(/^## (.+)$/gm)].map(item => item[1])
  if (headings.some(item => /^(GET|POST|PUT|PATCH|DELETE) /.test(item))) throw new Error('操作标题仍是方法路径：' + file)
}
console.log(`已生成 ${version}：${count} 个平台操作、${businessCount} 个业务网关操作、${Object.keys(contract.components.schemas).length} 个平台数据结构`)

function domainErrorMarkdown() {
  let text = '\n## 领域错误码索引 {#领域错误码索引}\n\n以下按领域解释 0.2.0 实现中的错误码。状态列是错误对象定义的状态，**不代表所有错误都直接成为 HTTP 响应**：运行、摄取、向量构建中的失败也可能记录在任务或事件里。未开放入口不能因为存在错误码而调用。未知结果与写入副作用必须先核对原记录，不能只按状态码自动重试。\n'
  const categories = [...new Set(Object.values(domainErrors).map(item => item.category))]
  for (const category of categories) {
    text += `\n### ${esc(category)}\n\n| error.code | 状态 | 含义与触发条件 | 处理方式 |\n| --- | --- | --- | --- |\n`
    for (const [code, item] of Object.entries(domainErrors).sort(([a], [b]) => a.localeCompare(b))) {
      if (item.category !== category) continue
      text += `| \`${code}\` | ${domainStatuses[code].join(' / ')} | ${esc(item.meaning)} | ${esc(item.handling)} |\n`
    }
  }
  return text
}

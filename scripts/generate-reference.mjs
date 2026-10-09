import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
const root = path.resolve('docs')
const contract = JSON.parse(await readFile(path.join(root, 'public/downloads/openapi.json'), 'utf8'))
const schemas = contract.components.schemas
const esc = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', ' ')
const schemaName = value => value.$ref?.split('/').pop()
function type(s) {
  if (s.$ref) return `[${schemaName(s)}](./数据结构.md#schema-${schemaName(s).toLowerCase()})`
  if (s.oneOf || s.anyOf) return (s.oneOf || s.anyOf).map(type).join(' / ')
  if (s.type === 'array') return `数组：${type(s.items || {})}`
  return esc(Array.isArray(s.type) ? s.type.join(' / ') : s.type || (s.enum ? '枚举' : s.const !== undefined ? typeof s.const : '对象'))
}
function constraints(s) {
  const out = []
  for (const key of ['default','const','enum','minimum','maximum','exclusiveMinimum','exclusiveMaximum','minLength','maxLength','minItems','maxItems','uniqueItems','pattern','format']) {
    if (s[key] !== undefined) out.push(`${key}: ${esc(JSON.stringify(s[key]))}`)
  }
  if (s.additionalProperties === false) out.push('不允许额外字段')
  if (s.description) out.push(esc(s.description))
  return out.join('；') || '—'
}
function table(s, prefix = '') {
  const rows=[]
  function visit(value, p) {
    for(const [name,field] of Object.entries(value.properties || {})) {
      const key=p+name
      rows.push(`| ${esc(key)} | ${type(field)} | ${(value.required || []).includes(name)?'是':'否'} | ${constraints(field)} |`)
      if(field.properties) visit(field,key+'.')
      if(field.items?.properties) visit(field.items,key+'[].')
    }
  }
  visit(s,prefix)
  return rows.length ? '\n| 字段 | 类型 | 本层必填 | 默认值与约束 |\n| --- | --- | --- | --- |\n'+rows.join('\n')+'\n' : '\n类型：'+type(s)+'。'+constraints(s)+'\n'
}
const meta=title=>`---\ntitle: ${title}\nproductVersion: "0.1"\nupdated: "2026-10-03"\nstatus: 已确认\nowner: SparkTide 维护者\nsource: protocol/openapi.json 与 Api/AuditApi/ObservationApi\n---\n\n# ${title}\n\n`
const groups={
 '身份与应用':{intro:'平台管理员创建应用、签发与撤销本地凭据；有效身份读取 /me，自身应用身份读取应用。默认入口由应用管理身份设置，并携带当前应用 revision。',operations:[]},
 '能力注册':{intro:'应用能力操作需要 APP_ADMIN 或 PLATFORM_ADMIN；公共模型与全局绑定需要平台管理员。注册正文是 id/version/definition，更新正文直接是 definition。单资源发布需先发布依赖；批次发布可在一个事务内发布整条依赖链。',operations:[]},
 '聊天与任务':{intro:'使用 USER 或 APP_ADMIN 业务身份。所有 Run、事件、确认与会话按应用、用户和租户所有权校验。POST chat 显式使用 Accept，JSON 返回 202，SSE 返回 200 流。',operations:[]},
 '运维接口':{intro:'指标、审计、应用活动、托管文档和应用租约需要管理身份。归档与全局供应商租约只允许平台管理员；机器契约下载需要有效身份。',operations:[]}
}
function group(route) {
 if(/\/(chat|runs|conversations)(\/|$)/.test(route)&&!route.includes('/activity/'))return '聊天与任务'
 if(route.includes('/model-compatibility'))return '能力注册'
 if(route.includes('/release-plans')||route.includes('/releases'))return '能力注册'
 if(route.includes('{kind}')||route.includes('/model-providers')||route.includes('/models'))return '能力注册'
 if(route==='/v1/me'||route==='/v1/apps'||route==='/v1/apps/{app}'||route.includes('/tokens')||route.includes('/default-agent')||route.includes('/agent-entries/'))return '身份与应用'
 return '运维接口'
}
let count=0
for(const [route,methods]of Object.entries(contract.paths))for(const[method,op]of Object.entries(methods)){
 if(!['get','post','put','delete','patch'].includes(method))continue
 count++
 let text=`\n## ${method.toUpperCase()} ${route}\n\n`
 const parameters=[...(methods.parameters || []),...(op.parameters || [])]
 if(parameters.length){text+='### 参数\n\n| 名称 | 位置 | 必填 | 类型与约束 |\n| --- | --- | --- | --- |\n';for(const p of parameters)text+=`| ${esc(p.name)} | ${p.in} | ${p.required?'是':'否'} | ${type(p.schema||{})}；${constraints(p.schema||{})} |\n`}
 if(op.requestBody){text+='\n### 请求正文\n';for(const[mime,body]of Object.entries(op.requestBody.content||{})){text+=`\nContent-Type：\`${mime}\`；正文${op.requestBody.required?'必填':'可选'}。\n`+table(body.schema||{})}}
 text+='\n### 响应\n\n| HTTP | 响应类型 | 数据结构 |\n| --- | --- | --- |\n'
 for(const[status,response]of Object.entries(op.responses||{})){
  const content=Object.entries(response.content||{})
  if(!content.length)text+=`| ${status} | 无正文 | ${esc(response.description)} |\n`
  for(const[mime,body]of content)text+=`| ${status==='default'?'其他错误':status} | ${mime} | ${type(body.schema||{})} |\n`
 }
 if(route.includes('/documents')&&!route.endsWith('/access'))text+='\n文档写入只允许 MANAGED 草稿；id/text 必填，text 上限 65536 字符，每版本最多 1000 篇。GET 返回元数据，已发布文档不可修改或删除。\n'
 if(route.endsWith('/activity/runs'))text+='\n返回 `{items:Run[],nextOffset:number|null}`，按创建时间倒序，nextOffset 为 null 表示结束。\n'
 if(route.endsWith('/metrics'))text+='\n返回 runCount、byStatus、configuredCost（币种→十进制金额字符串）、unknownCostRuns。费用为配置统计，不是供应商账单。\n'
 if(route.endsWith('/leases'))text+='\nkind/id/version/instanceId 为必填字符串；ttlSeconds 为 10–300。能力定义必须启用 leaseRequired，且知识必须为 REMOTE；全局路径仅支持 model-providers。返回 instanceId/expiresAt。\n'
 if(route.endsWith('/maintenance/archive'))text+='\n默认只预览。dryRun=false 才修改热数据，返回本批处理结果；不会默认永久删除归档。\n'
 if(/^\/v1\/apps\/\{app\}\/conversations(\/|$)/.test(route))text+='\n会话属于发起主体；同一会话同时只有一个活动 Run。失败、超时与取消的用户消息保留在会话中并携带 status 与 errorCode，但不进入后续模型历史。删除仅移除会话正文，Run、事件、审计与幂等证据保留；带已删除会话号的 chat 返回 404。\n'
 groups[group(route)].operations.push(text)
}
for(const[name,g]of Object.entries(groups)){
 let text=meta(name)+g.intro+'\n\n字段类型见[数据结构](./数据结构.md)，通用身份和请求头见[API 入口](./README.md)。\n'
 if(name==='能力注册')text+='\n支持的 kind：agents、tools、knowledge、ui-capabilities、model-providers、models、model-bindings、model-profiles。版本为三段稳定语义版本。更新草稿和替换默认入口要求带双引号的 If-Match。已发布定义不可变；撤销后不能再次发布。公共模型草稿使用 POST 与 If-Match 更新，没有单独 PUT 路由。\n'
 if(name==='聊天与任务')text+='\n同次创建请求保留 Idempotency-Key，同键同正文复用 Run，同键不同正文冲突。会话只能有一个活动任务。confirm 正文只提交确认标识与决策，不能替换参数。取消不撤销已经到达业务系统的副作用。\n'
 await writeFile(path.join(root,'接口参考',name+'.md'),text+g.operations.join(''))
}
const notes={AgentDefinition:'允许列表默认空；delegatedCapabilities 采用 kind/id@version。根 Agent 与子 Agent 共用根任务预算。',ToolDefinition:'roles 必须为非空 USER/APP_ADMIN 数组；effect 为 READ、COMPUTE、WRITE、DANGEROUS。后者要求用户确认。',KnowledgeDefinition:'INLINE 要求 1–100 篇 documents，每篇 text 1–16384 字符；REMOTE 必须有 endpoint；MANAGED 通过独立文档接口导入。',ProviderDefinition:'stream=true 可用于 OPENAI_CHAT 与 REMOTE 1.0；REMOTE 事件、身份及终结要求见 RemoteModelRequest/RemoteModelStreamFrame。endpoint 为完整请求地址，受出站白名单和密钥 origin 绑定限制。',BindingDefinition:'scope 省略表示当前应用，也可明确填写当前 appId；global 绑定仅平台管理员授权。',ChatRequest:'agentId 非空时必须同时提供 agentVersion；appId 若提供须等于路径。conversationId 省略/null 创建会话；context 与 client 不是可信身份。',CreateToken:'subjectId 非空；tenantId 默认为空字符串。原始 token 仅签发时返回。',Run:'202 返回的 Run 尚未完成；终态为 SUCCEEDED、FAILED、CANCELLED、TIMED_OUT。',Definition:'根据 Registry kind 选择对应定义；不把不同类别的字段混合提交。'}
let definitions=meta('数据结构与字段')+'本页根据随站点发布的 OpenAPI 生成。可选不表示允许 null；只有类型明确包含 null 时才能传 null。嵌套必填列指该字段所在对象，父对象可选时只在提供父对象后校验。\n\n'
definitions+='## 工具与 UI 的 Schema 方言\n\nSchema 支持 type、properties、required、additionalProperties:false、items、enum、minimum/maximum、minLength/maxLength、minItems/maxItems、description/title。对象关闭额外字段，最大递归 12 层；默认字符串上限 65536、数组上限 1000。不支持 $ref、pattern、format、oneOf 或远端解析。这里指工具输入输出和 UI Props 的业务 Schema，不是 OpenAPI 文件自身的 Schema 特性。\n\n'
for(const[name,s]of Object.entries(schemas)){
 definitions+=`## ${name} {#schema-${name.toLowerCase()}}\n\n${notes[name]||''}\n`+table(s)
 definitions+='\n::: details 完整机器定义\n\n```json\n'+JSON.stringify(s,null,2)+'\n```\n\n:::\n\n'
}
await writeFile(path.join(root,'接口参考/数据结构.md'),definitions.trimEnd()+'\n')
console.log(`生成 ${count} 个操作、${Object.keys(schemas).length} 个数据结构参考`)

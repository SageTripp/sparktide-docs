/** 错误说明只记录已读到的抛出点。合同列出的 HTTP 状态不等于某个 error.code。 */

const GENERIC = [
  '结构化错误；通过 error.code 判断原因，不能据此自动重放写操作。',
  '结构化错误；写入操作绝不自动重放。',
  '结构化错误',
  '请求被拒绝；检查认证、权限、输入及受控错误码，不自动重发写请求。',
]

const STATUS = {
  200: '请求被受理或读取成功。聊天、导入和元数据生成里，HTTP 成功只表示本次调用返回，不表示模型、工具或任务已经成功结束。',
  201: '资源已创建。响应体是合同给出的对象，不是错误信封。',
  202: '请求已受理并开始异步处理。要用运行、导入任务或元数据操作的后续读取判断终态，不能把 202 当成回答已完成。',
  400: '路径、查询、请求头或正文没有通过该操作的校验。按 error.code 修正后再发新请求，不要原样重放写操作。',
  401: '没有可用身份。平台入口对缺少 Bearer、非法令牌、过期或已吊销凭据使用 UNAUTHENTICATED。',
  403: '身份已经识别，但角色、应用范围或资源所有权不允许。不要改 appId 或 context 绕过。',
  404: '路径没有被当前进程挂载，或资源不存在、不属于当前身份。不要把所有 404 都理解成数据已删除。',
  406: 'Accept 与该操作实际能返回的表示不兼容。',
  409: '当前状态或幂等键与这次写入冲突。先读取最新记录，确认没有未知副作用后再决定是否换键重试。',
  410: '游标、许可或资源已经失效。重新读取当前序号或资源，不要沿用旧游标。',
  412: '修订或前置条件与服务端当前值不一致。用响应前重新读到的 revision 明确重试，不要自动覆盖。',
  413: '正文或上传文件超过该端点的字节上限。',
  415: 'Content-Type 不是该端点要求的媒体类型。合同不一定列出 415，入口仍会返回该状态。',
  428: '条件写缺少必需的 If-Match。补上当前修订后再提交。',
  429: '认证尝试、主体速率或并发超过入口限制。遵守 Retry-After，不要并行堆叠同一身份。',
  500: '合同保留 HTTP 500，但没有绑定 error.code。当前 Node 入口不会把未分类异常写成 500，而是写成 503 SERVICE_UNAVAILABLE。',
  502: '合同把该状态说明为上游失败，但没有绑定 error.code。根据实际 error.code 查询错误表或公共错误码。',
  503: '依赖未装配、进程容量用尽，或出现未分类异常。429 与 503 在入口上多数标记 retryable，但已经发出的写操作仍要先读原结果。',
  default: '合同用 default 收纳未单独列出的拒绝，没有对应唯一 error.code。业务网关还会把未分类异常写成 503 UPSTREAM_UNAVAILABLE。',
}

export function operationAnchor(method, route) {
  return `${method}-${route}`.toLowerCase().replace(/[{}]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function unavailable(route) {
  return route.endsWith('/activity/runs') || route.includes('/retrieval-debug') || /\/knowledge\/\{knowledgeId\}\/evaluations/.test(route) || /\/audit\/retention\//.test(route)
}

export function isGenericDescription(description) {
  return GENERIC.includes(String(description || '').trim())
}

export function explainStatus(status, description) {
  const text = String(description || '').trim()
  if (GENERIC.includes(text)) return STATUS[status] || '按 error.code 查询公共错误码，结合请求或任务状态处理。'
  return text.replaceAll('结构化错误', ' Error 信封')
}

function row(status, code, trigger, handling) {
  return { status: String(status), code, trigger, handling }
}

function executionKind(route) {
  if (route.includes('/activity/')) return null
  if (route.endsWith('/artifacts/{artifactId}/content')) return 'artifact'
  if (route.endsWith('/chat')) return 'chat'
  if (route.endsWith('/streaming/capabilities')) return 'capabilities'
  if (route.endsWith('/stream')) return 'stream'
  if (route.endsWith('/events')) return 'events'
  if (route.endsWith('/cancel')) return 'cancel'
  if (route.endsWith('/archive') || route.endsWith('/restore')) return 'archive'
  if (/\/conversations\/\{conversationId\}$/.test(route) || /\/conversations\/\{id\}$/.test(route)) return 'conversation'
  if (route.endsWith('/conversations')) return 'conversations'
  if (route.endsWith('/runs')) return 'runs'
  if (/\/runs\/\{runId\}$/.test(route) || /\/runs\/\{id\}$/.test(route)) return 'run'
  return null
}

function jsonBodyRows() {
  return [
    row(415, 'UNSUPPORTED_MEDIA_TYPE', '读取 JSON 正文时 Content-Type 不是 application/json，charset 只允许 utf-8。', '改为 JSON 正文。合同若未列出 415，入口仍返回该码。'),
    row(413, 'REQUEST_TOO_LARGE', 'JSON 正文超过该端点字节上限。超限在收完有界丢弃后返回，避免连接被提前重置。', '缩小正文。不要把截断后的正文自动重放。'),
    row(400, 'INVALID_REQUEST', '正文不是合法 UTF-8、被中断，或 Content-Length 与实际字节不一致。', '修正正文后再提交。'),
  ]
}

export function operationErrors({ method, route, business, jsonBody, multipart }) {
  const rows = []
  if (unavailable(route)) {
    rows.push(row(404, 'RESOURCE_NOT_FOUND', '当前 Node 入口没有挂载该合同路径。认证通过后 server.ts 对未认领路径返回 Endpoint is not available。', '不要调用。以能力与限制里的未开放项为准，不要根据合同字段推断可用。'))
    return rows
  }
  if (business) rows.push(...businessErrors(method, route))
  else rows.push(...platformErrors(method, route, { jsonBody, multipart }))
  return rows
}

function businessErrors(method, route) {
  const rows = [
    row(400, 'INVALID_REQUEST', '业务网关在转发前拒绝未知字段、错误类型、不可读 JSON 或不符合该方法的协议版本。SdkHttpErrors 把 IllegalArgumentException 固定写成该码，消息为 Invalid chat request 或 SDK request could not be completed。', '按业务合同改正文。不要把被拒绝的正文原样重放。'),
    row(401, 'UNAUTHENTICATED', '业务登录无法解析，或宿主认证异常被 SdkHttpErrors 认成未认证。平台上游的 401 会保留原 error.code。', '恢复业务登录。网关不会用失败回执自动重放已经发出的写操作。'),
    row(403, 'PERMISSION_DENIED', '宿主授权被拒绝时，SdkHttpErrors 返回该码。平台上游的 403 保留原来的 error.code。', '不要改用另一个应用的登录绕过。'),
    row(503, 'UPSTREAM_UNAVAILABLE', '控制器已关闭、流执行器或期限任务不可用，以及网关未分类异常。平台上游的其它状态和 error.code 原样透出，消息改为 SDK request could not be completed。', '先读原运行或会话。不要把网关 503 当成平台已经执行失败。'),
  ]
  if (route === '/chat' && method === 'post') {
    rows.push(row(400, 'INVALID_REQUEST', '消息 role 必须是 user，protocolVersion 若出现则必须是 1.0，client 只接受 uiCapabilities。', '按 ChatRequest 重写。幂等键可省略，省略时网关为本请求生成新键，不会自动重发。'))
    rows.push(row(403, 'PERMISSION_DENIED', '正文 appId 不等于网关配置的应用时，控制器返回 Application outside scope。', '不要在浏览器请求里指定其它应用。'))
  }
  if (['/conversations/{id}/summary', '/conversations/{id}/title/generate', '/conversations/{id}/suggestions', '/conversations/{conversationId}/follow-ups'].includes(route) && method === 'post') {
    rows.push(row(400, 'INVALID_REQUEST', '这些写操作要求调用方提供 Idempotency-Key；缺失、错误协议版本或未知字段在转发前拒绝。', '带上同一业务意图的幂等键。失败后不要自动换键重放。'))
  }
  if ((route.endsWith('/archive') || route.endsWith('/restore')) && method === 'post') {
    rows.push(row(400, 'INVALID_REQUEST', '正文只能包含 protocolVersion，且必须是 1.0。', '不要附带身份或模型参数。'))
  }
  if (route.endsWith('/inputs/{inputId}/cancel') && method === 'post') {
    rows.push(row(400, 'INVALID_REQUEST', '取消问卷的正文只能是 protocolVersion 1.0。', '不要带幂等键以外的额外字段；该操作本身不要求幂等键，也不停止后台运行。'))
  }
  if (route.endsWith('/follow-ups/{inputId}') && method === 'delete') {
    rows.push(row(412, 'REVISION_MISMATCH', 'If-Match 缺失，或不是 1 到 16 位数字（可带成对双引号）。网关在转发前抛出该码。', '先读取跟进队列，用当前输入修订再取消。取消不会停止活动 Run。'))
  }
  if (route.endsWith('/follow-ups/{inputId}') && method === 'patch') {
    rows.push(row(400, 'INVALID_REQUEST', '修订必须是有限非负整数；position 大于 31 时网关拒绝。未知字段不会转发。', '只修改尚未领取的 QUEUE。冲突由平台返回，网关不改键重试。'))
  }
  if (route.endsWith('/events') || route.endsWith('/stream')) {
    rows.push(row(429, 'QUOTA_EXCEEDED', '当前控制器的事件订阅数达到 maxStreams，无法再取得许可。', '关闭不再观看的订阅后再连接。断流不会取消 Run。'))
    rows.push(row(503, 'UPSTREAM_UNAVAILABLE', '取得上游前控制器已关闭，或流执行器拒绝任务。', '稍后重新订阅。不要据此重放创建运行的请求。'))
  }
  return rows
}

function platformErrors(method, route, { jsonBody, multipart }) {
  const rows = []
  if (multipart) {
    rows.push(
      row(415, 'UNSUPPORTED_MEDIA_TYPE', '导入上传必须是带单一 boundary 的 multipart/form-data，且不能带 Content-Encoding。', '按 file 与 metadata 两个 part 重新上传。'),
      row(413, 'FILE_TOO_LARGE', '文件 part 不是 1 到 4194304 字节。', '换符合上限的原件。解析器是否可用是另一件事，见部署说明。'),
      row(413, 'REQUEST_TOO_LARGE', 'metadata part 超过 65536 字节，或整个正文超过端点上限。', '缩小元数据。不要分片冒充同一次上传。'),
      row(400, 'INVALID_REQUEST', 'part 数量、边界、Content-Disposition 或文件名不符合 ingestion-upload.ts：必须恰好一个 file 与一个 metadata。', '按上传合同重做正文。'),
    )
  } else if (jsonBody) rows.push(...jsonBodyRows())

  if (route === '/v1/apps' && method === 'post') {
    rows.push(row(403, 'PERMISSION_DENIED', 'server.ts 要求 principal.role 为 PLATFORM_ADMIN，否则拒绝创建应用。', '使用平台管理员凭据。应用管理员不能调用该入口。'))
  }
  if (/^\/v1\/apps\/\{app\}\/tokens(\/\{tokenId\})?$/.test(route)) {
    rows.push(row(403, 'PERMISSION_DENIED', '签发、列出和吊销应用凭证都要求 PLATFORM_ADMIN。', '不要用应用管理员令牌管理系统凭证。'))
  }
  if (route === '/v1/leases' && method === 'post') {
    rows.push(row(403, 'PERMISSION_DENIED', '公共模型供应商租约只允许平台管理员。', '应用租约走 /v1/apps/{app}/leases。'))
  }
  if (/^\/v1\/(model-providers|models)(\/|$)/.test(route)) {
    rows.push(row(403, 'PERMISSION_DENIED', '全局模型与提供方注册表要求 PLATFORM_ADMIN，其它角色得到 Global scope is model admin only。', '在应用路径下维护应用自己的注册表，或改用平台管理员。'))
  }
  if (route === '/v1/apps/{app}/identity-delegation' && method === 'put') {
    rows.push(
      row(403, 'PERMISSION_DENIED', '配置委托策略要求 PLATFORM_ADMIN。', '应用管理员只能读取策略，不能改签发方和租户范围。'),
      row(428, 'PRECONDITION_REQUIRED', 'access.ts configureDelegation 在缺少 If-Match 时抛出该码。', '先 GET 策略，带上当前 revision。'),
      row(412, 'REVISION_MISMATCH', 'If-Match 与当前策略 revision 不一致。', '重新读取后再提交。成功更新会使已发出的委托令牌失效。'),
    )
  }
  if (route === '/v1/apps/{app}/identity-delegations' && method === 'post') {
    rows.push(row(403, 'PERMISSION_DENIED', '换取短时用户身份要求调用方角色为 APP_ADMIN，且通过 manager 校验。', '使用可撤销的应用后端凭据，不要用用户令牌换票。'))
  }
  if (/^\/v1\/apps\/\{app\}\/credentials\/\{credentialId\}$/.test(route) && (method === 'put' || method === 'delete')) {
    rows.push(
      row(503, 'CREDENTIAL_STORE_DISABLED', '进程没有装配托管凭据存储时，server.ts 在经理校验之后返回该码。', '先配置凭据存储。这不是凭据内容错误。'),
      row(428, 'PRECONDITION_REQUIRED', 'managed-credentials.ts 的 revision() 在缺少 If-Match 时抛出。', '创建或轮换、撤销都必须带当前修订；新凭据的当前修订按实现视为 0。'),
      row(412, 'REVISION_MISMATCH', 'If-Match 与已存储凭据的 revision 不一致。', '重新读取元数据后再写。不要在冲突时自动覆盖密钥。'),
    )
  }
  if (/^\/v1\/apps\/\{app\}\/credentials\/\{credentialId\}$/.test(route) && method === 'get') {
    rows.push(row(503, 'CREDENTIAL_STORE_DISABLED', '未装配托管凭据存储时，读取元数据同样返回该码。', '不要把 503 理解成凭据不存在。'))
  }
  if (/\/\{kind\}(\/|$)/.test(route) || route.endsWith('/managed-definitions') || route.endsWith('/model-compatibility') || route.endsWith('/default-agent') || route.endsWith('/release-plans') || route === '/v1/apps/{app}/leases') {
    rows.push(row(400, 'INVALID_REQUEST', 'server.ts 拒绝无法解码的应用或注册表路径、未知注册表字段，以及发布列表上不合法的分页。', '只提交该操作声明的字段。全局模型路径还要求平台管理员。'))
  }
  if (route.endsWith('/agent-entries/{agentId}')) {
    rows.push(row(400, 'INVALID_REQUEST', '智能体入口路径无法解码时，server.ts 返回该码。', '使用合同允许的入口标识。解析结果不回退到默认智能体。'))
  }
  if (route === '/v1/apps/{app}' && method === 'put') {
    rows.push(row(412, 'REVISION_MISMATCH', 'registry.ts 更新应用时要求 If-Match 指向当前应用 revision，缺失或格式不符都使用该码。', '先读取应用，再带修订提交名称或状态。'))
  }
  if (route === '/v1/apps/{app}/releases' && method === 'post') {
    rows.push(
      row(400, 'INVALID_REQUEST', 'publishRelease 要求非空 reason、1 到 128 位的幂等键，以及 64 位十六进制发布计划哈希。requireCondition 使用该码。', '先调用发布预览，把计划哈希、应用修订和幂等键一并提交。'),
      row(412, 'REVISION_MISMATCH', '缺少 If-Match、应用 revision 已变化，或计划中的资源 revision 与注册表不一致。', '重新预览。不要用旧计划覆盖。'),
      row(409, 'IDEMPOTENCY_CONFLICT', '同一主体的幂等键已经用于另一份请求哈希。', '换成本业务意图自己的键，或读回原来的发布记录。'),
      row(409, 'RELEASE_PLAN_CHANGED', '提交时的 planHash 与事务内重新计算的计划不一致。', '重新预览后再发布。'),
      row(409, 'RELEASE_INVALID', '预检失败，或资源状态不再允许发布。响应消息会指向 release-plans，不包含定义正文。', '按预览里的 errors 处理，不要直接重放发布。'),
    )
  }
  if (route === '/v1/apps/{app}/knowledge/{knowledgeId}/documents/{documentId}/access' && method === 'put') {
    rows.push(row(412, 'REVISION_MISMATCH', 'document-access.ts 要求 If-Match 为当前文档访问修订，缺失或对不上都是该码，而不是 428。', '先 GET 访问策略，带上返回的修订再更新。'))
  }

  const kind = executionKind(route)
  if (kind) {
    rows.push(row(403, 'PERMISSION_DENIED', 'execution-http.ts 要求路径中的 app 与凭据 appId 相同，否则 Application outside credential scope。', '使用本应用凭证。路径里的 app 不能改成其它应用。'))
    if (kind === 'chat' || kind === 'events') {
      rows.push(row(406, 'NOT_ACCEPTABLE', 'Accept 同时拒绝 application/json 与 text/event-stream（含 */* 与对应通配）。', '明确接受 JSON 或 SSE。质量值更高的 SSE 才会走事件流。'))
    }
    if (kind === 'stream') {
      rows.push(
        row(406, 'NOT_ACCEPTABLE', '原生流要求 Accept 包含 text/event-stream。', '不要用只接受 JSON 的客户端订阅 /stream。'),
        row(410, 'EVENT_CURSOR_EXPIRED', 'Last-Event-ID 无法解析为该 run 的序号，或游标已经超过当前序号。', '从空游标或最后一条可靠事件重新订阅。'),
        row(403, 'PREVIEW_PERMIT_EXPIRED', '单次读取授权超过 10 秒。这是流内部的许可过期，不是登录过期。', '重新订阅。未提交的预览尾巴可以丢失，可靠事件仍可回放。'),
      )
    }
    if (kind === 'events') {
      rows.push(
        row(410, 'EVENT_CURSOR_EXPIRED', 'JSON 回放时游标大于 run.lastSequence；SSE 路径上非法游标同样使用该码。', '先读运行上的 lastSequence，再用不大于它的游标。'),
        row(503, 'SERVICE_UNAVAILABLE', '事件页损坏或 lastSequence 不是非负安全整数时，execution-http.ts 用该码中止可靠回放。', '不要跳号继续。稍后重读运行；断流本身不取消 Run。'),
      )
    }
    if (kind === 'artifact') {
      rows.push(row(404, 'RESOURCE_NOT_FOUND', '执行服务没有装配 downloadArtifact 时返回 File downloads are unavailable。', '确认文件成果能力已装配。标识不存在时领域服务还可能另返回 404，本适配层只保证这一条。'))
    }
    if (kind === 'conversations' && method === 'get') {
      rows.push(row(400, 'INVALID_REQUEST', '查询只允许 limit、offset、archived；archived 必须是单个 true 或 false。分页超出适配层范围时同样是该码。', '省略 archived 表示未归档范围。不要传重复查询参数。'))
    }
    if (kind === 'chat' && jsonBody) {
      rows.push(row(400, 'INVALID_REQUEST', '若携带 Idempotency-Key，长度必须是 1 到 128。聊天创建不强制该头。', '需要幂等时固定使用同一键。同键异载荷时查看公共错误码中的 IDEMPOTENCY_CONFLICT。'))
    }
  }

  if (route.includes('/follow-ups')) {
    rows.push(row(400, 'INVALID_REQUEST', 'follow-up-http.ts 拒绝非法路径、反斜杠、未知查询和无法解码的标识。', '按 follow-up-input/1.0 重写路径和正文。'))
    if (method === 'delete' || method === 'patch' || route.endsWith('/control')) {
      rows.push(row(412, 'REVISION_MISMATCH', 'follow-up-rules.ts 把不合法的 If-Match 或修订统一写成该码，不另造错误码。', '先读队列。取消或编辑只影响尚未领取的 QUEUE，不取消活动 Run。'))
    }
  }
  if (route.includes('/eval-') || route.includes('/alert') || route.startsWith('/v1/operations/') || route.endsWith('/observability') || route.endsWith('/trace')) {
    rows.push(
      row(403, 'PERMISSION_DENIED', 'operations-http.ts 对平台入口要求 PLATFORM_ADMIN；应用入口要求路径应用与凭据一致，且角色是应用管理员或平台管理员。', '不要用普通用户令牌调用管理入口，也不要跨应用读取。'),
      row(503, 'CAPABILITY_UNAVAILABLE', '对应的评测、告警、观测或脱敏服务没有装配到本进程。', '这是部署未启用，不是规则不存在。不要重放写入来“激活”能力。'),
      row(400, 'INVALID_REQUEST', route.includes('/alert') ? '告警列表的 state 只接受空、FIRING、ACKNOWLEDGED 或 RESOLVED；分页和 If-Match 也必须符合 operations-http.ts。' : (route.endsWith('/observability') && route.includes('/apps/') ? '应用观测摘要的 hours 缺省 24，只接受 1 到 168 的整数。' : '查询字段、分页或 If-Match 修订格式不在 operations-http.ts 允许范围内。'), '按该操作的参数修正。不要用普通用户令牌调用。'),
    )
  }
  if (route.startsWith('/v1/operations/retention') || route.includes('/maintenance/archive')) {
    rows.push(
      row(403, 'PERMISSION_DENIED', 'retention-http.ts 要求 PLATFORM_ADMIN。', '应用管理员不能调用平台留存入口。'),
      row(503, 'CAPABILITY_UNAVAILABLE', '留存或归档服务未装配。', '未装配时不要把合同字段当成已执行清理。'),
      row(400, 'INVALID_REQUEST', '这些入口不接受额外查询字段；归档路径无法解码时同样拒绝。', '去掉未知查询后再调用。'),
    )
  }
  if (route.includes('/quotas') || route.includes('/quota-reservations')) {
    rows.push(row(400, 'INVALID_REQUEST', '配额分页只接受单个非负整数 limit 与 offset，且必须落在适配层范围内。', '不要添加过滤字段。修正分页后重读，不要重放核对写操作。'))
  }
  if (route.includes('/model-invocations')) {
    rows.push(row(400, 'INVALID_REQUEST', '列表只接受 limit、offset；limit 为 1 到 100，offset 为 0 到 1000000。明细与核对不接受查询字段。', '核对是登记证据，不会重放模型调用。'))
  }
  if (route.includes('/model-bindings/')) {
    rows.push(row(400, 'INVALID_REQUEST', '探测与健康读取只接受适配层声明的路径和分页，未知查询会被拒绝。', '探测失败不等于绑定已恢复健康。重置健康是请求探测，不会强制标为健康。'))
  }
  if (route.includes('/vectors')) {
    rows.push(
      row(400, 'INVALID_REQUEST', '向量任务分页只接受 limit、offset；取消、重试和删除不接受正文。任务标识不符合适配层字符集时拒绝。', '重试会按当前授权新建任务，不是继续同一个未知任务。'),
      row(404, 'RESOURCE_NOT_FOUND', '路径属于向量前缀但方法不被 vector-http.ts 认领。', '核对方法。未开放的知识评测不要用向量路径代替。'),
    )
  }
  if (route.includes('/ingestions')) {
    rows.push(row(400, 'INVALID_REQUEST', '除上传以外的导入操作不接受正文；分页字段非法或任务标识不合法时拒绝。', '取消、重试和删除都要带当前任务修订。适配层不枚举领域修订码。'))
  }
  if (route.includes('/conversations/') && (route.includes('/summary') || route.includes('/title/') || route.includes('/suggestions') || route.includes('/metadata-operations'))) {
    rows.push(row(400, 'INVALID_REQUEST', 'conversation-metadata-http.ts 拒绝非法路径、反斜杠和任何查询字段。', '生成类操作的模型输出错误出现在操作记录中，不要把受理成功当成摘要已写入。'))
  }
  if (route.endsWith('/edits')) {
    rows.push(row(400, 'INVALID_REQUEST', 'conversation-edit-http.ts 拒绝非法路径、反斜杠和查询字段。历史不匹配等冲突由领域服务返回，适配层没有另外规定 error.code。', '使用会话投影里的 messageId。失败后不要改用新幂等键自动重放。'))
  }
  if (route.includes('/inputs/')) {
    rows.push(row(400, 'INVALID_REQUEST', 'conversation-input-http.ts 拒绝非法路径和查询。选项与取值范围由已保存的问卷决定。', '取消不会调用模型，也不会停止其它运行。'))
  }
  if (route.includes('/citations/') && route.endsWith('/preview')) {
    rows.push(row(400, 'INVALID_REQUEST', '引用预览不接受查询字段，路径标识必须符合适配层字符集。', '预览按运行所有者的历史权限判断，客户端不能用 citationId 自己授权。'))
  }
  if (route.includes('/tool-executions')) {
    rows.push(row(400, 'INVALID_REQUEST', '工具账本不接受未知查询；路径无法解码时拒绝。', '核对未知结果是登记证据。不要因为核对失败而自动再执行工具。'))
  }
  if (route.endsWith('/confirm')) {
    rows.push(row(400, 'INVALID_REQUEST', 'confirmation-http.ts 拒绝非法路径、反斜杠和任何查询字段。确认单是否仍待裁决由领域服务决定，适配层不另造错误码。', '使用事件里的 confirmationId。拒绝后不要自动改成另一种 decision 重放。'))
  }
  if (route.endsWith('/audit')) {
    rows.push(row(400, 'INVALID_REQUEST', 'audit-http.ts 只接受 limit 与 offset，分页超出范围或应用标识无法解码时拒绝。', '这是最近控制动作的有界读取，不是审计导出。'))
  }
  if (route.endsWith('/audit/records') || route.endsWith('/audit/export')) {
    rows.push(row(400, 'INVALID_REQUEST', '审计记录查询和导出由审计适配层校验路径与查询。未知字段会被拒绝。', '导出是一页有界快照。用返回的续传位置取下一页，不要扩大成全量历史。'))
  }
  if (route.endsWith('/metrics') && route.includes('/apps/')) {
    rows.push(row(400, 'INVALID_REQUEST', 'application-metrics-http.ts 不接受查询字段，应用标识无法解码时拒绝。', '返回的是运行状态计数，不是 Prometheus 进程指标。进程指标在 /v1/operations/metrics。'))
  }
  if (route === '/v1/apps/{app}/releases' || route === '/v1/apps/{app}/releases/{releaseId}') {
    rows.push(row(400, 'INVALID_REQUEST', 'server.ts 对非法发布路径，以及列表上不是单个非负整数的 limit、offset 返回该码。', '先通过 manager 校验。单条读取不要带分页参数。'))
  }
  if (route.includes('/documents') && !route.includes('/access') && !route.includes('/ingestions')) {
    rows.push(row(400, 'INVALID_REQUEST', 'managed-knowledge-http.ts 拒绝无法解码的文档路径、未知查询和不合法的文档标识。', '导入、删除和预览都作用在草稿或调用方提供的文本上，不表示版本已经发布。'))
  }
  if (['/v1/apps', '/v1/apps/{app}', '/v1/me', '/v1/openapi', '/v1/schemas/agent-event'].includes(route) && method === 'get') {
    rows.push(row(401, 'UNAUTHENTICATED', '这些读取发生在认证之后，没有额外的适配层错误码。缺少或无效 Bearer 仍由 access.ts 返回该码。', '见公共错误码的入口表。刷新登录凭据后重试读取。'))
  }
  if (route === '/v1/me/profile') {
    rows.push(row(400, 'INVALID_REQUEST', '个人资料入口不接受查询字段，路径不能包含反斜杠。', '只提交显示名和头像颜色。这不是平台身份。'))
  }
  if (rows.length === 0) {
    rows.push(row(400, 'INVALID_REQUEST', '该操作的适配层会拒绝无法解码的路径、反斜杠或未知查询。业务校验失败的具体代码见公共错误码。', '按合同修正请求。根据 error.code 查询公共错误码；无法识别的代码保留 traceId 后交由维护者排查。'))
  }
  return dedupe(rows)
}

function dedupe(rows) {
  const seen = new Set()
  return rows.filter(item => {
    const key = `${item.status}:${item.code}:${item.trigger}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function errorSection({ method, route, business, jsonBody, multipart }) {
  const rows = operationErrors({ method, route, business, jsonBody, multipart })
  const lines = [
    '',
    '### 错误',
    '',
    business
      ? '业务网关返回 `error.code` 与 `error.message`。平台错误的状态和代码会保留，消息经过脱敏。通用错误与运行失败详见[公共错误码](../公共错误码.md)。'
      : '失败响应包含 `error.code`、`error.message`、`error.traceId`、`error.retryable` 和 `error.details`。以下列出本操作的入口错误；认证、限流以及后续领域处理失败详见[公共错误码](../公共错误码.md)。HTTP 状态与错误码不是一对一关系。',
    '',
  ]
  lines.push('| HTTP | error.code | 触发条件 | 处理 |', '| --- | --- | --- | --- |')
  for (const item of rows) lines.push(`| ${item.status} | \`${item.code}\` | ${item.trigger} | ${item.handling} |`)
  lines.push('')
  if (business) {
    lines.push('平台 `PlatformException` 经过业务网关时保留 HTTP 状态和 error.code，消息固定为 “SDK request could not be completed”，不附带上游正文。网关没有为这些平台码再造一套状态。')
    lines.push('')
  } else if (!unavailable(route)) {
    lines.push('业务校验、存储及运行准备还可能返回领域错误，请按[公共错误码](../公共错误码.md#领域错误码索引)中的代码和处理建议判断。任务已经受理后发生的失败，应读取运行或任务记录。')
    lines.push('')
  }
  return lines.join('\n')
}

export function publicErrorMarkdown() {
  return `失败响应都带 Error 信封，但机器合同没有为每个 HTTP 状态规定唯一的 \`error.code\`。本页说明认证、请求校验、业务网关以及领域处理中的错误含义与处理方式。

模型、工具和预览在运行过程中还会抛出另一些码。那些码通常出现在运行、事件或任务记录里，不能自动写成某一个 HTTP 操作的同步错误。

## 错误信封

平台入口 \`server.ts\` 的 \`failure()\` 写出：

| 字段 | 含义 | 处理 |
| --- | --- | --- |
| error.code | 稳定机器码 | 分支判断只看这个字段 |
| error.message | 适配层给出的说明 | 可以记入诊断，不要直接展示给业务用户 |
| error.traceId | 形如 \`tr_\` 加随机标识的关联号 | 用于排查这一次 HTTP 失败，不能代替 Run 记录 |
| error.retryable | 429 和 503 为 true，但 \`COMMIT_OUTCOME_UNKNOWN\` 恒为 false | true 只表示可以再试一次新的读取或新的业务意图，不表示平台会自动重放 |
| error.details | 入口固定给空对象 | 不要假设里面有字段 |

业务网关 \`SdkHttpErrors\` 同样返回 \`error.code\` 与 \`error.message\`。它不转发平台消息正文，未分类异常使用 \`UPSTREAM_UNAVAILABLE\`。

## HTTP 状态

| HTTP | 含义 |
| --- | --- |
| 400 | ${STATUS[400]} |
| 401 | ${STATUS[401]} |
| 403 | ${STATUS[403]} |
| 404 | ${STATUS[404]} |
| 406 | ${STATUS[406]} |
| 409 | ${STATUS[409]} |
| 410 | ${STATUS[410]} |
| 412 | ${STATUS[412]} |
| 413 | ${STATUS[413]} |
| 415 | ${STATUS[415]} |
| 428 | ${STATUS[428]} |
| 429 | ${STATUS[429]} |
| 500 | ${STATUS[500]} |
| 502 | ${STATUS[502]} |
| 503 | ${STATUS[503]} |

合同里的 \`default\` 不是一种固定码。

## 入口公共错误 {#入口公共错误}

这些码发生在具体业务路由之前或之外，来源是 \`apps/server/src/http/server.ts\` 与 \`packages/security/src/identity/access.ts\`。各操作页不再把整张表复制一遍。

| HTTP | error.code | 触发条件 | 处理 |
| --- | --- | --- | --- |
| 400 | \`INVALID_REQUEST\` | 请求目标不是以 / 开头；安全或并发头重复；JSON 正文不是 UTF-8 或读取被中断 | 修正这一次请求 |
| 401 | \`UNAUTHENTICATED\` | 没有 Bearer，令牌为空或长于 16384，联邦令牌无效或过期，凭据不存在、已吊销或过期 | 恢复真实登录后再读原状态 |
| 403 | \`DELEGATION_REVOKED\` | 委托令牌的父凭据、策略修订、签发方、租户范围或应用状态不再满足 \`checkCredential\` | 由应用后端重新换票 |
| 403 | \`PERMISSION_DENIED\` | 后续存活检查发现凭据身份变化，或该路由明确要求的角色不足 | 核对角色和应用，不要更换 appId |
| 429 | \`RATE_LIMITED\` | 认证失败过多、主体请求过多，或同一身份并发达到 8。响应带 Retry-After | 等待后再试。不要并行堆叠 |
| 503 | \`DATABASE_CAPACITY_UNAVAILABLE\` | 进程内在途请求达到 32 | 稍后重试读取；写操作先确认原请求有没有生效 |
| 503 | \`SERVICE_UNAVAILABLE\` | 抛出的不是 PlatformError。数据库容量错误会保留该错误自己的 code | 先读原记录。retryable 为 true 也不自动重放写操作 |
| 404 | \`RESOURCE_NOT_FOUND\` | 认证之后没有任何适配层认领该路径 | 对照能力与限制，确认入口是否开放 |

健康检查 \`/actuator/health\` 不使用 Error 信封。未就绪时返回 503 和 \`{"status":"DOWN"}\`。

## 写入与修订

| HTTP | error.code | 适用环节 | 处理 |
| --- | --- | --- | --- |
| 428 | \`PRECONDITION_REQUIRED\` | 委托策略更新、托管凭据写入和撤销缺少 If-Match | 先读取当前修订 |
| 412 | \`REVISION_MISMATCH\` | 应用更新、发布、委托策略、托管凭据、文档访问和跟进输入的修订不匹配 | 用新读到的修订明确重试 |
| 409 | \`IDEMPOTENCY_CONFLICT\` | 发布幂等键已用于另一份请求 | 读回原发布，或更换本次意图的键 |
| 409 | \`RELEASE_PLAN_CHANGED\` | 发布时计划哈希已经变化 | 重新预览 |
| 409 | \`RELEASE_INVALID\` | 发布预检没有通过，或资源不再可发布 | 看预览错误，不要直接重放 |
| 413 | \`REQUEST_TOO_LARGE\` | JSON 正文或上传元数据超过端点上限 | 缩小正文 |
| 413 | \`FILE_TOO_LARGE\` | 导入文件不是 1 字节到 4 MiB | 更换原件 |
| 415 | \`UNSUPPORTED_MEDIA_TYPE\` | JSON 入口收到了其它 Content-Type，或上传不是单一 boundary 的 multipart | 改正媒体类型 |

## 运行与事件

这些码来自 \`execution-http.ts\`，只适用于对应的聊天、运行、会话和事件路由。具体操作页会再列一次。

| HTTP | error.code | 触发条件 | 处理 |
| --- | --- | --- | --- |
| 403 | \`PERMISSION_DENIED\` | 路径中的应用与凭据应用不一致 | 使用本应用凭证 |
| 406 | \`NOT_ACCEPTABLE\` | 聊天或事件回放的 Accept 既不能给 JSON 也不能给 SSE；原生流不接受 event-stream | 改 Accept |
| 410 | \`EVENT_CURSOR_EXPIRED\` | Last-Event-ID 非法或超过当前序号 | 按运行上的 lastSequence 重新订阅 |
| 403 | \`PREVIEW_PERMIT_EXPIRED\` | 原生流单次读取授权超过 10 秒 | 重新订阅。可靠事件仍然可以回放 |
| 503 | \`SERVICE_UNAVAILABLE\` | 可靠事件页损坏 | 不要跳过序号 |
| 404 | \`RESOURCE_NOT_FOUND\` | 文件下载能力没有装配 | 不要把成果标识当成公开 URL |

\`POST /v1/apps/{app}/chat\` 返回 202 只表示运行已受理。模型协议错误、工具输出错误和上下文超限发生在运行过程中，不一定是这次 POST 的 HTTP 状态。

## 运行过程中的码 {#运行过程中的码}

下面的码在运行时源码里有抛出点。它们可以作为 Run、事件或任务上的失败码出现。本页不把它们许诺成每个返回 502 或 429 的 HTTP 操作都会产生的码。

| HTTP | error.code | 适用环节 | 含义 |
| --- | --- | --- | --- |
| 502 | \`MODEL_PROTOCOL_ERROR\` | 远端模型投影、输出和原生模型线协议 | 模型报文无法按协议解释 |
| 502 | \`MODEL_FEATURE_UNSUPPORTED\` | 远端模型投影 | 模型不支持所请求的能力 |
| 429 | \`MODEL_CONTEXT_EXCEEDED\` | 远端模型投影 | 上下文窗口不够 |
| 502 | \`METADATA_OUTPUT_INVALID\` | 会话摘要与下一步建议的输出校验 | 模型文本或建议条数不符合合同 |
| 502 | \`TOOL_OUTPUT_INVALID\` | 业务工具回调 | 工具结果不可用或不符合声明的输出 |
| 502 | \`TOOL_IDENTITY_MISMATCH\` | 业务工具回调 | 工具身份与注册工具不一致 |
| 502 | \`TOOL_CALL_ID_UNSUPPORTED\` | 业务工具回调 | 工具调用标识不能用于回调 |
| 502 | \`UPSTREAM_ERROR\` | 业务工具结果未知 | 结果未知，不要重试同一次调用 |
| 502 | \`UI_PRESENTATION_UNAVAILABLE\` | 界面工具 | 界面调用身份或标识不可用 |
| 502 | \`KNOWLEDGE_PROTOCOL_ERROR\` | 知识检索 | 知识协议报文无效 |
| 502 | \`KNOWLEDGE_TIMED_OUT\` | 知识检索 | 检索超时 |
| 502 | \`KNOWLEDGE_OUTPUT_INVALID\` | 引用预览 | 引用标题等公开字段超出合同 |
| 503 | \`COMMIT_OUTCOME_UNKNOWN\` | 预览提交 | 是否写入未知。入口把该码的 retryable 固定为 false |

处理方式：读取运行或任务的终态和错误码。结果未知时不要自动重放工具、发布或模型调用。

## 业务聊天网关 {#业务聊天网关}

来源是 \`SparkTideChatController\` 与 \`SdkHttpErrors\`。浏览器只调用这个网关，不持有平台管理凭据。

| HTTP | error.code | 触发条件 | 处理 |
| --- | --- | --- | --- |
| 400 | \`INVALID_REQUEST\` | 未知字段、类型错误、不可读 JSON、协议版本不对，或该方法要求的幂等键缺失 | 按业务合同修改 |
| 401 | \`UNAUTHENTICATED\` | 业务登录解析失败，或宿主认证异常 | 重新登录 |
| 403 | \`PERMISSION_DENIED\` | 聊天正文的 appId 超出网关配置，或宿主拒绝授权 | 不要从浏览器改应用 |
| 412 | \`REVISION_MISMATCH\` | 删除跟进输入时 If-Match 缺失或不是 1 到 16 位数字 | 先读队列修订 |
| 429 | \`QUOTA_EXCEEDED\` | 事件或原生流订阅达到控制器上限 | 关闭旧订阅 |
| 503 | \`UPSTREAM_UNAVAILABLE\` | 控制器关闭、流执行器不可用，或未分类异常 | 先读原 Run，不要重放写操作 |

平台已经返回的错误会保留状态和 error.code。因此业务页上的平台码与平台操作页相同，只是消息被换成固定句子。

## 未开放操作

知识检索调试、知识评测、应用活动运行分页，以及审计专项留存预览和执行，合同里有路径，当前 Node 入口未挂载。调用得到 404 \`RESOURCE_NOT_FOUND\`。详见[能力与限制](能力与限制.md)。
`
}

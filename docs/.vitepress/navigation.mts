import type { DefaultTheme } from 'vitepress'
const page = (text: string, link: string) => ({ text, link: '/' + link })
const group = (text: string, items: DefaultTheme.SidebarItem[], collapsed?: boolean): DefaultTheme.SidebarItem => ({ text, items, ...(collapsed === undefined ? {} : { collapsed }) })
const deep = (domain: string, names: string[]) => names.map(name => page(name, domain + '/' + name))
export const tutorialSteps = [
  page('1. 准备环境与制品', '教程/准备环境'),
  page('2. 创建应用与开发身份', '教程/创建应用'),
  page('3. 声明模型并启动后台', '教程/接入后台'),
  page('4. 接入聊天页面', '教程/接入前端'),
  page('5. 验证第一轮对话', '教程/验证对话'),
  page('6. 添加工具与知识（可选）', '教程/添加工具与知识'),
  page('7. 接入业务登录并上线', '教程/接入生产')
]
export const sidebar: DefaultTheme.SidebarItem[] = [
  group('开始使用', [
    { text: '文档首页', link: '/' },
    page('认识启澜', '开始使用/产品介绍'),
    page('选择阅读路线', '开始使用/阅读地图'),
    page('版本与获取', '开始使用/版本与获取'),
    group('跑通示例 · 公开 0.1.0', [page('教程总览', '教程/README'), ...tutorialSteps], true),
  ]),
  group('接入业务', [
    page('接入路线与分工', '开发接入/接入流程'),
    page('新版 SDK 接入 · 内部候选', '开发接入/SDK简化接入'),
    page('Java / Kotlin 后台', '开发接入/业务后台SDK'),
    page('前端客户端', '开发接入/前端SDK'),
    page('React / Vue 组件与状态', '开发接入/React与Vue'),
  ]),
  group('构建应用能力', [
    page('能力指南', '使用指南/README'),
    group('模型', [page('模型接入', '使用指南/模型接入'), page('模型治理路线', '开发接入/模型治理/README'), ...deep('开发接入/模型治理', ['模型能力声明与检查', '模型配置与候选路由', '远程模型提供器与流式接入', '模型调用账本与核对', '模型健康探测与恢复', '应用配额与费用预算'])], true),
    group('智能体', [page('职责、能力与版本', '使用指南/智能体'), page('运行时进阶', '开发接入/运行时/README'), page('父子智能体', '开发接入/运行时/父子智能体额度与结果')], true),
    group('业务工具', [page('工具入门', '使用指南/业务工具'), page('Java / Kotlin 注解工具', '开发接入/业务接入/注解工具接入'), page('回调协议', '开发接入/工具回调')], true),
    group('知识与检索', [page('知识入门', '使用指南/知识库'), page('选择知识接入路线', '开发接入/知识接入/README'), page('知识 Provider 与注册', '开发接入/业务接入/知识提供器与自动注册'), ...deep('开发接入/知识接入', ['外部知识协议与权限过滤', '托管文档分块与版本运维', '文件上传解析与摄入任务', '回答引用与鉴权来源预览', '知识库选源与按需检索', '向量与混合检索', '知识检索调试与版本评测'])], true),
    group('身份与权限', [page('应用与可信身份', '使用指南/应用与权限'), page('业务权限与上下文', '开发接入/业务接入/业务权限与可信上下文'), page('文档授权与撤权', '使用指南/文档权限')], true),
    group('会话与界面', [page('会话、确认与取消', '使用指南/运行与审计'), page('业务卡片', '使用指南/界面组件')], true),
    group('版本与发布', [page('默认入口与回滚', '使用指南/批次发布'), page('声明式注册', '开发接入/业务接入/声明式注册与启动发布'), page('批次预检与发布', '开发接入/业务接入/批次预检与发布')], true),
  ]),
  group('上线与运维', [
    page('部署路线', '部署运维/README'),
    group('部署底座', [...deep('部署运维', ['Docker部署', '独立部署', '环境变量', 'HTTPS与网关', '集群部署'])], true),
    group('运维与治理', [...deep('部署运维', ['升级与备份', '监控与排障', '可观测性与调用链', '运行治理与执行核对']), page('审计与留存路线', '开发接入/运维治理/README'), page('审计查询、导出与留存', '开发接入/运维治理/审计查询导出与留存')], true),
    group('管理控制台', [page('控制台手册', '使用指南/控制台/README'), page('工作区与日常操作', '使用指南/控制台/多模块工作台'), page('首次连接与手工管理', '开始使用/首次配置')], true),
  ]),
  group('参考资料', [
    page('SDK 参考索引', '开发接入/README'),
    page('业务接入专题', '开发接入/业务接入/README'),
    group('HTTP API', [page('接口参考总览', '接口参考/README'), ...deep('接口参考', ['身份与应用', '能力注册', '聊天与任务', '运维接口', '数据结构', '错误处理'])], true),
    page('事件协议', '接口参考/事件协议'),
    page('历史客户端与低层协议', '开发接入/业务接入/类型化聊天'),
  ]),
  group('帮助与版本', [
    page('帮助中心', '产品支持/README'),
    page('常见问题', '产品支持/常见问题'), page('能力与限制', '产品支持/能力状态'),
    page('版本说明', '产品支持/版本说明'), page('贡献与支持', '产品支持/贡献与支持'),
  ]),
]

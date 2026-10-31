import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import versions from './versions.json'

export const sections = ['快速开始', '开发接入', '能力指南', '控制台操作', '部署运维', '参考资料']
const order: Record<string, string[]> = {
  快速开始: ['README', '认识启澜', '整体组成', '版本与获取', '运行第一个助手'],
  开发接入: ['README', '接入总览', '后端接入', '身份与权限', '前端接入', '自定义界面', 'HTTP接入', '完整示例', 'Agent技能'],
  能力指南: ['README', '模型', '智能体', '业务工具', '知识问答', '会话交互', '界面与文件成果', '版本与发布'],
  控制台操作: ['README', '应用与授权', '模型与凭据', '能力资源', '知识与文档', '运行与审批', '用量与诊断'],
  部署运维: ['README', '部署准备', 'Docker部署', '独立进程部署', '环境变量', '网络与认证', '升级与恢复', '监控与排障'],
  SDK依赖: ['README', 'Java核心', 'Java8核心', 'Kotlin扩展', 'SpringBoot4启动器', 'SpringBoot2启动器', '模型声明', '模型HTTP传输', 'OpenAI兼容模型', 'OpenAI模型', 'DeepSeek模型', 'Ollama模型', 'OpenCodeGo模型', '文档合同', 'PDF文档', 'GraphQL只读查询', '前端核心', '基础界面', '大屏界面', '通用展示组件'],
  参考资料: ['README', '后端SDK', '前端SDK', 'HTTP接口', '公共错误码', '事件协议', '错误与常见问题', '版本与兼容性', '更新日志', '能力与限制']
}
// 导航只从当前版本目录读取，新增版本不改写旧版链接。
function items(relative: string, section: string): any[] {
  const dir = fileURLToPath(new URL(`../${relative}/`, import.meta.url))
  const names = readdirSync(dir, { withFileTypes: true })
    .filter(entry => (entry.isDirectory() || entry.name.endsWith('.md')) && !(section === '参考资料' && entry.name === 'SDK依赖'))
    .sort((a, b) => {
      const rank = (name: string) => {
        const index = (order[section] || ['README']).indexOf(name.replace(/\.md$/, ''))
        return index < 0 ? 100 : index
      }
      return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name, 'zh-CN')
    })
  return names.map(entry => {
    if (entry.isDirectory()) return { text: entry.name, collapsed: true, items: items(`${relative}/${entry.name}`, entry.name) }
    const content = readFileSync(`${dir}/${entry.name}`, 'utf8')
    const title = /^# (.+)$/m.exec(content)?.[1] || entry.name.replace('.md', '')
    const link = `/${relative}/${entry.name.replace(/\.md$/, '')}`
    if (section === '参考资料' && ['后端SDK.md', '前端SDK.md'].includes(entry.name)) {
      const frontend = new Set(['前端核心', '基础界面', '大屏界面', '通用展示组件'])
      const isFrontend = entry.name === '前端SDK.md'
      const dependencies = items(`${relative}/SDK依赖`, 'SDK依赖').filter(item => {
        const name = item.link.split('/').pop()
        return name !== 'README' && frontend.has(name) === isFrontend
      })
      return { text: title, link, collapsed: true, items: [
        { text: `${title}总览`, link }, ...dependencies
      ] }
    }
    return { text: entry.name === 'README.md' ? `${section}总览` : title, link }
  })
}
export const sidebar = Object.fromEntries(versions.versions.flatMap(version => [
  [`/${version.id}/`, sections.map(section => ({ text: section, link: `/${version.id}/${section}/README` }))],
  ...sections.map(section => [`/${version.id}/${section}/`, [
    { text: '← 版本首页', link: `/${version.id}/README` },
    { text: section, items: items(`${version.id}/${section}`, section) }
  ]])
]))
export const navFor = (id: string) => [
  { text: '首页', link: '/', activeMatch: '^/$' },
  ...sections.map(section => ({ text: section, link: `/${id}/${section}/README`, activeMatch: `/${section}/` }))
]

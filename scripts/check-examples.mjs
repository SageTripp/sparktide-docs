import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const examples = path.join(root, 'examples', '0.2.0')
const required = [
  'java-ops-assistant',
  'kotlin-ops-assistant',
  'core-client',
  'react-chat',
  'vue3-chat',
  'vue2-chat',
]
const sourceExt = new Set(['.kts', '.xml', '.json', '.java', '.kt', '.ts', '.tsx', '.js', '.mjs'])

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'build' || entry.name === '.gradle') continue
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file, acc)
    else acc.push(file)
  }
  return acc
}

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

for (const name of required) {
  if (!existsSync(path.join(examples, name))) fail(`缺少示例目录 ${name}`)
}
if (process.exitCode) process.exit(process.exitCode)

for (const file of walk(examples)) {
  const ext = path.extname(file)
  if (!sourceExt.has(ext)) continue
  const text = readFileSync(file, 'utf8')
  if (/project\s*\(/.test(text)) fail(`${file} 使用了工程依赖`)
  if (/file:\s*[^"'\s]*sparktide-(backend|frontend)-sdk/.test(text)) fail(`${file} 指向 SDK 源码目录`)
  if (/sk-[A-Za-z0-9]{16,}|BEGIN (RSA |OPENSSH )?PRIVATE KEY/.test(text)) fail(`${file} 含有疑似密钥`)
}
if (process.exitCode) process.exit(process.exitCode)
console.log('示例静态检查通过：六个目录，坐标依赖，无 SDK 工程依赖。')

const backend = process.env.SPARKTIDE_BACKEND_SDK
  || path.resolve(root, '../../../repo/sparktide-backend-sdk')
const frontend = process.env.SPARKTIDE_FRONTEND_SDK
  || path.resolve(root, '../../../repo/sparktide-frontend-sdk')

const modules = {
  'sdk-model-spi': ['org.reactivestreams:reactive-streams:1.0.4'],
  'sdk-document-spi': ['javax.validation:validation-api:2.0.1.Final'],
  'sdk-model-http': ['dev.sparktide:sdk-model-spi:0.2.0', 'org.apache.httpcomponents:httpclient:4.5.14'],
  'sdk-model-openai-compatible': ['dev.sparktide:sdk-model-http:0.2.0'],
  'sdk-model-openai': ['dev.sparktide:sdk-model-openai-compatible:0.2.0'],
  'sdk-model-deepseek': ['dev.sparktide:sdk-model-openai-compatible:0.2.0'],
  'sdk-model-opencode-go': ['dev.sparktide:sdk-model-openai-compatible:0.2.0'],
  'sdk-model-ollama': ['dev.sparktide:sdk-model-http:0.2.0'],
  'sdk-java': [
    'dev.sparktide:sdk-document-spi:0.2.0',
    'dev.sparktide:sdk-model-spi:0.2.0',
    'com.fasterxml.jackson.core:jackson-databind:2.20.1',
  ],
  'sdk-kotlin': [
    'dev.sparktide:sdk-java:0.2.0',
    'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2',
  ],
  'sdk-spring-boot-starter': ['dev.sparktide:sdk-java:0.2.0'],
}

function pom(artifact, deps) {
  const body = deps.map(item => {
    const [groupId, artifactId, version] = item.split(':')
    return `    <dependency><groupId>${groupId}</groupId><artifactId>${artifactId}</artifactId><version>${version}</version></dependency>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>dev.sparktide</groupId>
  <artifactId>${artifact}</artifactId>
  <version>0.2.0</version>
  <dependencies>
${body}
  </dependencies>
</project>
`
}

function stageMaven(repo) {
  let staged = 0
  for (const artifact of Object.keys(modules)) {
    const jar = path.join(backend, artifact, 'build', 'libs', `${artifact}-0.2.0.jar`)
    if (!existsSync(jar)) return { staged, missing: jar }
    const dest = path.join(repo, 'dev', 'sparktide', artifact, '0.2.0')
    mkdirSync(dest, { recursive: true })
    cpSync(jar, path.join(dest, `${artifact}-0.2.0.jar`))
    writeFileSync(path.join(dest, `${artifact}-0.2.0.pom`), pom(artifact, modules[artifact]))
    staged++
  }
  return { staged, missing: '' }
}

function gradle(projectDir, task, repo) {
  const wrapper = path.join(backend, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew')
  const init = path.join(repo, 'init.gradle')
  writeFileSync(init, `settingsEvaluated { settings ->
    settings.dependencyResolutionManagement.repositories.maven { url = uri('${repo.replace(/\\/g, '/')}') }
  }
`)
  const result = spawnSync(wrapper, [
    '-p', projectDir,
    task,
    '--no-daemon',
    '--init-script', init,
    `-Dmaven.repo.local=${repo}`,
  ], { encoding: 'utf8', cwd: projectDir, timeout: 300000, shell: process.platform === 'win32' })
  const output = `${result.stdout || ''}\n${result.stderr || ''}`
  if (result.status !== 0) {
    console.error(output.slice(-4000))
    fail(`${path.basename(projectDir)} ${task} 失败，退出码 ${result.status}`)
  } else {
    console.log(`${path.basename(projectDir)} ${task} 通过。SDK Jar 来自本地构建目录，Spring 与 Kotlin 插件来自 Maven Central，未改 SDK 仓库。`)
  }
}

if (!existsSync(path.join(backend, 'sdk-java', 'build', 'libs', 'sdk-java-0.2.0.jar'))) {
  console.log(`跳过后端编译：未找到 ${backend} 的 0.2.0 Jar。不把公网 Maven 安装视为已验证。`)
} else {
  const repo = mkdtempSync(path.join(os.tmpdir(), 'sparktide-example-m2-'))
  const staged = stageMaven(repo)
  if (staged.missing) {
    console.log(`跳过后端编译：缺少 ${staged.missing}`)
  } else {
    console.log(`已把 ${staged.staged} 个 0.2.0 Jar 放进临时 Maven 仓库，不写入用户本机仓库。`)
    gradle(path.join(examples, 'java-ops-assistant'), 'compileJava', repo)
    gradle(path.join(examples, 'kotlin-ops-assistant'), 'compileKotlin', repo)
  }
}

function packFrontend(dest) {
  mkdirSync(dest, { recursive: true })
  const result = spawnSync('npm', ['pack', '--pack-destination', dest, '--ignore-scripts'], {
    encoding: 'utf8', cwd: frontend, timeout: 120000, shell: process.platform === 'win32',
  })
  if (result.status !== 0) return `${result.stdout || ''}\n${result.stderr || ''}`
  const workspaces = spawnSync('npm', ['pack', '--workspaces', '--pack-destination', dest, '--ignore-scripts'], {
    encoding: 'utf8', cwd: frontend, timeout: 120000, shell: process.platform === 'win32',
  })
  if (workspaces.status !== 0) return `${workspaces.stdout || ''}\n${workspaces.stderr || ''}`
  return ''
}

function checkFrontend(name, extra) {
  const source = path.join(examples, name)
  const dest = mkdtempSync(path.join(os.tmpdir(), `sparktide-example-${name}-`))
  cpSync(source, dest, { recursive: true })
  const manifestPath = path.join(dest, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  for (const section of ['dependencies', 'devDependencies']) {
    for (const name of Object.keys(manifest[section] || {})) {
      if (!name.startsWith('@sparktide/')) continue
      const base = `${name.slice(1).replace('/', '-')}-`
      const file = readdirSync(extra).find(item => item.startsWith(base) && item.endsWith('.tgz'))
      if (!file) {
        fail(`${name} 没有对应的本地 tarball`)
        return
      }
      manifest[section][name] = `file:${path.join(extra, file).replace(/\\/g, '/')}`
    }
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  const install = spawnSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], {
    encoding: 'utf8', cwd: dest, timeout: 180000, shell: process.platform === 'win32',
  })
  if (install.status !== 0) {
    console.error(`${install.stdout || ''}\n${install.stderr || ''}`.slice(-3000))
    fail(`${name} 安装本地 tarball 失败`)
    return
  }
  const tscBin = path.join(dest, 'node_modules', 'typescript', 'bin', 'tsc')
  const tsc = spawnSync(process.execPath, [tscBin, '-p', 'tsconfig.json', '--pretty', 'false'], {
    encoding: 'utf8', cwd: dest, timeout: 120000,
  })
  if (tsc.status !== 0) {
    console.error(`${tsc.stdout || ''}\n${tsc.stderr || ''}`)
    fail(`${name} tsc 失败`)
  } else {
    console.log(`${name} tsc 通过。包来自本地 npm pack，未改前端 SDK 仓库，未访问 npm registry 上的 @sparktide 包。`)
  }
}

if (!existsSync(path.join(frontend, 'dist', 'index.d.ts'))) {
  console.log(`跳过前端类型检查：${frontend} 没有 dist。不把公网 npm 安装视为已验证。`)
} else {
  const packed = mkdtempSync(path.join(os.tmpdir(), 'sparktide-example-tgz-'))
  const error = packFrontend(packed)
  if (error) {
    console.error(error.slice(-3000))
    fail('npm pack 失败，前端示例未做类型检查')
  } else {
    for (const js of walk(path.join(examples, 'core-client')).filter(file => file.endsWith('.js'))) {
      const checked = spawnSync(process.execPath, ['--check', js], { encoding: 'utf8' })
      if (checked.status !== 0) fail(`${js} 语法检查失败\n${checked.stderr || ''}`)
      else console.log(`${path.basename(js)} 语法检查通过。`)
    }
    for (const name of ['core-client', 'react-chat', 'vue3-chat', 'vue2-chat']) checkFrontend(name, packed)
  }
}

if (process.exitCode) process.exit(process.exitCode)
console.log('示例检查结束。')

"""验证私有构建产物，并准备公共 Maven 目录、教程锁文件与发行附件。"""
import argparse, base64, hashlib, json, pathlib, re, shutil, tarfile, zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--version', required=True)
parser.add_argument('--artifacts', type=pathlib.Path, required=True)
parser.add_argument('--output', type=pathlib.Path, required=True)
args = parser.parse_args()
if not re.fullmatch(r'\d+\.\d+\.\d+', args.version):
    raise SystemExit('发行版本必须为 X.Y.Z')
root = pathlib.Path(__file__).resolve().parents[1]
source = args.artifacts.resolve()
output = args.output.resolve()
if output.exists() and any(output.iterdir()):
    raise SystemExit('发行附件目录已有内容，拒绝覆盖')
manifests = {}
for component in ['backend', 'frontend', 'platform']:
    folder = source/component
    manifest = json.loads((folder/f'{component}-manifest.json').read_text(encoding='utf-8'))
    if manifest['version'] != args.version or not re.fullmatch(r'[0-9a-f]{40}', manifest['commit']):
        raise SystemExit(f'{component} 版本或提交不合法')
    manifests[component] = manifest
    for line in (folder/f'SHA256SUMS-{component}').read_text(encoding='ascii').splitlines():
        digest, filename = line.split('  ', 1)
        if pathlib.PurePosixPath(filename).name != filename:
            raise SystemExit('校验清单包含非直接文件')
        if hashlib.sha256((folder/filename).read_bytes()).hexdigest() != digest:
            raise SystemExit(f'校验失败：{filename}')

if manifests['backend'].get('sourceIncluded') is not False:
    raise SystemExit('后台包未声明排除源码')
image = manifests['platform']
if image['image'] != f'ghcr.io/sagetripp/sparktide-platform:{args.version}' or not re.fullmatch(r'sha256:[0-9a-f]{64}', image['imageDigest']):
    raise SystemExit('镜像名称或 digest 不合法')
archive = source/'backend'/f'sparktide-backend-maven-{args.version}.zip'
maven = root/'docs/public/maven'
with zipfile.ZipFile(archive) as z:
    entries = z.namelist()
    expected = {f'maven/dev/sparktide/{module}/{args.version}/{module}-{args.version}.{suffix}'
                for module in ['sdk-java', 'sdk-kotlin', 'sdk-spring-boot-starter']
                for suffix in ['jar', 'pom', 'jar.sha256', 'pom.sha256']}
    if set(entries) != expected:
        raise SystemExit('Maven ZIP 文件范围与二进制发行契约不符')
    # 固定版本不可改写；首次发布允许添加文件，重复准备只能校验同一内容。
    for name in entries:
        target = maven/pathlib.PurePosixPath(name).relative_to('maven')
        data = z.read(name)
        if target.exists() and target.read_bytes() != data:
            raise SystemExit(f'拒绝覆盖已存在的 Maven 版本：{target.name}')
    for name in entries:
        target = maven/pathlib.PurePosixPath(name).relative_to('maven')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(z.read(name))

tgz = source/'frontend'/f'sparktide-frontend-sdk-{args.version}.tgz'
with tarfile.open(tgz, 'r:gz') as archive:
    if any(not (p.name in ['package/package.json', 'package/README.md'] or p.name.startswith('package/dist/')) or not p.isfile() for p in archive):
        raise SystemExit('前端安装包包含发行范围之外的文件')
integrity = 'sha512-'+base64.b64encode(hashlib.sha512(tgz.read_bytes()).digest()).decode('ascii')
for framework in ['react', 'vue']:
    example = root/'examples/入门聊天'/f'frontend-{framework}'
    lock = example/'package-lock.json'
    content = json.loads(lock.read_text(encoding='utf-8'))
    content['packages']['node_modules/@sparktide/frontend-sdk']['integrity'] = integrity
    lock.write_text(json.dumps(content, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

output.mkdir(parents=True, exist_ok=True)
for folder in ['backend', 'frontend', 'platform']:
    for file in (source/folder).iterdir():
        if file.is_file(): shutil.copyfile(file, output/file.name)
(output/'release-manifest.json').write_text(json.dumps({'version':args.version,'components':manifests},indent=2)+'\n',encoding='utf-8')
(output/'SHA256SUMS').write_text(''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n' for p in sorted(output.iterdir()) if p.is_file()),encoding='ascii')
print(f'通过：{args.version} 的组件校验、二进制范围、固定版本目录与教程完整性')

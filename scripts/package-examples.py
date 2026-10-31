"""将当前版本的公开示例源码打包到本地文档下载目录，不包含 SDK 实现或制品。"""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'docs/.vitepress/versions.json').read_text(encoding='utf-8'))['current']
source = root / 'examples' / version
destination = root / 'docs/public/版本' / version
allowed = {'.md', '.java', '.kt', '.kts', '.xml', '.json', '.html', '.js', '.mjs', '.ts', '.tsx', '.jsx', '.vue', '.css', '.yml', '.yaml', '.properties'}
excluded = {'node_modules', 'build', 'dist', 'target', '.gradle', '.kotlin', '.local', '.git', 'vendor'}
files = sorted(file for file in source.rglob('*') if file.is_file()
               and not excluded.intersection(file.relative_to(source).parts)
               and (file.suffix in allowed or file.name in {'.gitignore', '.env.example'}))
if not files or not (source / 'README.md').is_file():
    raise SystemExit('缺少示例源码与 README，不能生成空下载包')
destination.mkdir(parents=True, exist_ok=True)
archive = destination / f'sparktide-examples-{version}.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as output:
    for file in files:
        entry = ZipInfo(f'sparktide-examples-{version}/{file.relative_to(source).as_posix()}')
        entry.create_system = 3
        entry.external_attr = 0o100644 << 16
        entry.compress_type = ZIP_DEFLATED
        output.writestr(entry, file.read_text(encoding='utf-8').encode('utf-8'))
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256.txt').write_text(f'{digest}  {archive.name}\n', encoding='ascii')
print(f'已生成 {archive.relative_to(root)}：{len(files)} 个公开示例文件')

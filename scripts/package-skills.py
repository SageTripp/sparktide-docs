"""从版本文档生成 Agent Skill 的离线参考与下载包，不包含私有实现。"""
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import unquote
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'docs/.vitepress/versions.json').read_text(encoding='utf-8'))['current']
source = root / 'skills' / version
docs = root / 'docs' / version
destination = root / 'docs/public/版本' / version
manifest = json.loads((source / 'references.json').read_text(encoding='utf-8'))
destination.mkdir(parents=True, exist_ok=True)
bundles = {}

for name, pages in manifest.items():
    folder = source / name
    selected = {(docs / page).resolve(): Path(page).name for page in pages}
    if len(set(selected.values())) != len(pages):
        raise SystemExit(f'{name} 的参考文件名重复')
    if not (folder / 'SKILL.md').is_file():
        raise SystemExit(f'{name} 缺少 SKILL.md')
    files = [folder / 'SKILL.md']
    for page in pages:
        original = docs / page
        body = re.sub(r'^---\r?\n.*?\r?\n---\r?\n', '', original.read_text(encoding='utf-8'), count=1, flags=re.S)

        def replace_link(match):
            label, target = match.groups()
            if target.startswith(('#', 'https://', 'http://', 'mailto:')):
                return match.group(0)
            path, _, anchor = unquote(target).partition('#')
            resolved = (original.parent / path).resolve()
            if resolved in selected:
                return f'[{label}]({selected[resolved]}' + (f'#{anchor}' if anchor else '') + ')'
            if path.startswith('/'):
                reference = target
            else:
                reference = '/' + resolved.relative_to(root / 'docs').as_posix()
                if anchor:
                    reference += '#' + anchor
            return f'{label}（配套文档：{reference}）'

        body = re.sub(r'\[([^\]\n]+)\]\(([^)\n]+)\)', replace_link, body)
        output = folder / 'references' / original.name
        output.parent.mkdir(exist_ok=True)
        output.write_text(f'<!-- 自动生成；修改 docs/{version}/{page} 后执行 docs:skills。 -->\n\n' + body.lstrip(), encoding='utf-8')
        files.append(output)
    bundles[name] = files

def package(name, entries):
    archive = destination / name
    with ZipFile(archive, 'w', ZIP_DEFLATED) as output:
        for file, relative in entries:
            entry = ZipInfo(relative)
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            entry.compress_type = ZIP_DEFLATED
            output.writestr(entry, file.read_text(encoding='utf-8').encode('utf-8'))
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix('.zip.sha256.txt').write_text(f'{digest}  {archive.name}\n', encoding='ascii')
    print(f'{archive.relative_to(root)}：{len(entries)} 个文件')

for name, files in bundles.items():
    package(f'{name}-skill-{version}.zip', [(file, file.relative_to(source).as_posix()) for file in files])

package(f'sparktide-agent-skills-{version}.zip',
        [(source / 'README.md', 'README.md')] +
        [(file, file.relative_to(source).as_posix()) for files in bundles.values() for file in files])

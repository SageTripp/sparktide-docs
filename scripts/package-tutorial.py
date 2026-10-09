from pathlib import Path
import zipfile, re
root=Path(__file__).resolve().parent.parent
source=root/'examples/入门聊天'
target=root/'docs/public/downloads/sparktide-tutorial.zip'
skip={'.local','.gradle','build','node_modules','dist','data'}
target.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
    for file in sorted(source.rglob('*')):
        rel=file.relative_to(source)
        if file.is_file() and not any(part in skip for part in rel.parts) and file.suffix!='.tgz':
            z.write(file,rel.as_posix())
    entries=z.namelist()
    assert not any(any(part in skip for part in Path(name).parts) for name in entries)
print(f'已打包入门源码：{len(entries)} 个文件；未包含凭据、SDK 包或运行产物')

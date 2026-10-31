"""从保留的品牌原图生成网页图片；本地运行需要 Pillow，不参与站点构建。"""
from pathlib import Path

from PIL import Image


def main():
    public = Path(__file__).resolve().parents[1] / "docs" / "public"
    with Image.open(public / "品牌" / "启澜玻璃标志.png") as hero:
        # 保留原始分辨率与透明通道，优先保证水晶高光和渐变的画质。
        hero.save(public / "品牌" / "启澜玻璃标志.webp", quality=90, method=6)
    with Image.open(public / "sparktide-logo.png") as original:
        # 页面最大显示 32px，96px 覆盖三倍像素密度；缩放后采用无损编码。
        logo = original.resize((96, 96), Image.Resampling.LANCZOS)
        logo.save(public / "sparktide-logo.webp", lossless=True, method=6)
        original.resize((48, 48), Image.Resampling.LANCZOS).save(
            public / "sparktide-favicon.png", optimize=True
        )


if __name__ == "__main__":
    main()

"""把独立构建的 dist 和说明打成可重复的 ZIP；不依赖 LayerWeave 安装。"""
import argparse
import json
from pathlib import Path
import re
import zipfile
from io import BytesIO

ROOT = Path(__file__).resolve().parents[1]


def package(folder, output):
    folder, output = Path(folder).resolve(), Path(output).resolve()
    data = json.loads((folder / "plugin.json").read_text(encoding="utf-8"))
    if data.get("format") != 1 or data.get("kind") != "view-plugin":
        raise ValueError("只打包 format=1 的 view-plugin")
    for key in ("publisher", "name"):
        if not re.fullmatch(r"[a-z][a-z0-9_-]{0,39}", data.get(key, "")):
            raise ValueError(f"无效 {key}")
    if not re.fullmatch(r"(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)", data.get("version", "")):
        raise ValueError("version 需要三段数字")
    files = {folder / "plugin.json", folder / data.get("usage", "README.md")}
    if data.get("license_file"):
        files.add(folder / data["license_file"])
    files.update(p for p in (folder / "dist").rglob("*") if p.is_file())
    entry = folder / data.get("entry", "plugin.js")
    if entry not in files:
        raise ValueError("本仓库发布脚本要求已构建入口与资源放在 dist/；请先 npm run build")
    body = BytesIO()
    with zipfile.ZipFile(body, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(files):
            if not path.resolve().is_relative_to(folder) or path.is_symlink() or not path.is_file():
                raise ValueError(f"发布文件缺失或越界：{path}")
            info = zipfile.ZipInfo(path.relative_to(folder).as_posix(), date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes())
    output.mkdir(parents=True, exist_ok=True)
    destination = output / f"{data['publisher']}.{data['name']}-{data['version']}.zip"
    content = body.getvalue()
    if destination.exists() and destination.read_bytes() != content:
        raise ValueError(f"同版本发布包已存在且内容不同，请升版本：{destination.name}")
    if not destination.exists():
        destination.write_bytes(content)
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("plugin", nargs="?", help="plugins 下的完整 ID；省略时打包全部")
    parser.add_argument("--output", type=Path, default=ROOT / "catalog/releases")
    args = parser.parse_args()
    folders = [ROOT / "plugins" / args.plugin] if args.plugin else sorted((ROOT / "plugins").iterdir())
    for folder in folders:
        if (folder / "plugin.json").is_file():
            print(package(folder, args.output))


if __name__ == "__main__":
    main()

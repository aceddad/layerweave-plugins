"""从不可变的发布 ZIP 生成静态目录；新旧版本一起保留。"""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FIELDS = ("publisher", "name", "kind", "version", "label", "description", "requires")


def build(folder):
    folder = Path(folder).resolve()
    rows, seen = [], set()
    for package in sorted((folder / "releases").rglob("*.zip")):
        with zipfile.ZipFile(package) as archive:
            meta = json.loads(archive.read("plugin.json"))
            localizations = {}
            for lang, relative in meta.get("locales", {}).items():
                display = json.loads(archive.read(relative)).get("display", {})
                localizations[lang] = {"display": {k: display[k] for k in ("label", "description") if k in display}}
        row = {key: meta[key] for key in FIELDS}
        if localizations:
            row["localizations"] = localizations
        row["id"] = meta["publisher"] + "." + meta["name"]
        key = row["id"], row["version"]
        if key in seen:
            raise ValueError(f"重复发布身份与版本：{key}")
        seen.add(key)
        row["archive"] = {"url": package.relative_to(folder).as_posix(), "size": package.stat().st_size,
                          "sha256": hashlib.sha256(package.read_bytes()).hexdigest()}
        rows.append(row)
    output = folder / "index.json"
    output.write_text(json.dumps({"format": 1, "plugins": rows}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=ROOT / "catalog")
    print(build(parser.parse_args().catalog))

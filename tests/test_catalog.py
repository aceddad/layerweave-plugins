"""发布文件的可重复性、哈希和真正离线选装；需要已安装的 LayerWeave 视图。"""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from layerweave.tool.builtin.view.plugins import plugin
from tools.package_plugin import package
from tools.build_index import build

ROOT = Path(__file__).resolve().parents[1]


class CatalogTests(unittest.TestCase):
    def test_reproducible_archives_and_install_all(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            for source in sorted((ROOT / "plugins").iterdir()):
                path = package(source, folder / "catalog/releases")
                self.assertEqual(path.read_bytes(), (ROOT / "catalog/releases" / path.name).read_bytes())
                self.assertEqual(package(source, folder / "catalog/releases"), path)
            catalogue = build(folder / "catalog")
            data = json.loads(catalogue.read_text(encoding="utf-8"))
            self.assertEqual(len(data["plugins"]), 3)
            for row in data["plugins"]:
                path = catalogue.parent / row["archive"]["url"]
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), row["archive"]["sha256"])
                result = plugin("install", row["id"], catalog=catalogue, root=folder / "state")
                self.assertEqual(result["status"], "installed")
                self.assertIsNone(next(p for p in result["plugins"] if p["id"] == row["id"])["problem"])
                self.assertTrue(plugin("info", row["id"], root=folder / "state")["usage"])


if __name__ == "__main__":
    unittest.main()

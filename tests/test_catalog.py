"""发布文件的可重复性、哈希和真正离线选装；需要已安装的 LayerWeave 视图。"""
import hashlib
import json
import re
import shutil
import zipfile
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from layerweave.tool.builtin.view.plugins import plugin
from tools.package_plugin import package, TEXT_SUFFIXES
from tools.build_index import build

ROOT = Path(__file__).resolve().parents[1]


class CatalogTests(unittest.TestCase):
    def test_windows_line_endings_do_not_change_release_archive(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = ROOT / 'plugins/layerweave.web'
            copied = root / 'web'
            shutil.copytree(source, copied)
            reference = package(source, root / 'reference').read_bytes()
            for path in copied.rglob('*'):
                if path.is_file() and (path.suffix.lower() in TEXT_SUFFIXES or path.name == 'LICENSE'):
                    path.write_bytes(path.read_bytes().replace(b'\r\n', b'\n').replace(b'\n', b'\r\n'))
            self.assertEqual(package(copied, root / 'windows').read_bytes(), reference)

    def test_reproducible_archives_and_install_all(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            for source in sorted((ROOT / "plugins").iterdir()):
                path = package(source, folder / "catalog/releases")
                self.assertEqual(path.read_bytes(), (ROOT / "catalog/releases" / path.name).read_bytes())
                self.assertEqual(package(source, folder / "catalog/releases"), path)
            catalogue = build(folder / "catalog")
            data = json.loads(catalogue.read_text(encoding="utf-8"))
            self.assertEqual(len(data["plugins"]), 4)
            for row in data["plugins"]:
                path = catalogue.parent / row["archive"]["url"]
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), row["archive"]["sha256"])
                result = plugin("install", row["id"], catalog=catalogue, root=folder / "state")
                self.assertEqual(result["status"], "installed")
                self.assertIsNone(next(p for p in result["plugins"] if p["id"] == row["id"])["problem"])
                self.assertTrue(plugin("info", row["id"], root=folder / "state")["usage"])
                self.assertEqual(row["license"], "MIT")
                with zipfile.ZipFile(path) as archive:
                    manifest = json.loads(archive.read("plugin.json"))
                    self.assertEqual(manifest["license"], "MIT")
                    self.assertEqual(archive.read(manifest["license_file"]), (ROOT / "LICENSE").read_bytes())

    def test_old_host_selects_previous_release(self):
        with tempfile.TemporaryDirectory() as temporary, patch('layerweave.tool.builtin.view.plugin_manifest.current_version', return_value='0.28.1'):
            result=plugin('market',catalog=ROOT/'catalog/index.json',root=Path(temporary)/'state')
            self.assertEqual(len(result['items']),4)
            self.assertTrue(all(row['version']=='1.0.0' and row['compatible'] for row in result['items'] if row['id'] != 'layerweave.web'))
            self.assertFalse(next(row for row in result['items'] if row['id']=='layerweave.web')['compatible'])

    def test_language_resources_are_complete_and_packed(self):
        placeholders=lambda text: sorted(re.findall(r"\{(\w+)\}",text))
        for folder in (ROOT/'plugins').iterdir():
            packs={lang:json.loads((folder/'locales'/(lang+'.json')).read_text(encoding='utf-8')) for lang in ('zh','en')}
            self.assertEqual(set(packs['zh']['messages']),set(packs['en']['messages']))
            for key,text in packs['zh']['messages'].items():
                self.assertEqual(placeholders(text),placeholders(packs['en']['messages'][key]),key)
            meta=json.loads((folder/'plugin.json').read_text(encoding='utf-8'))
            with zipfile.ZipFile(ROOT/'catalog/releases'/f'{folder.name}-{meta["version"]}.zip') as z:
                self.assertIn('locales/en.json',z.namelist());self.assertIn('README.en.md',z.namelist())
            meta=json.loads((folder/'plugin.json').read_text(encoding='utf-8'))
            self.assertEqual(set(meta['params']),set(packs['en']['display']['params']))
        catalogue=json.loads((ROOT/'catalog/index.json').read_text(encoding='utf-8'))
        self.assertEqual(len(catalogue['plugins']),11)
        for row in catalogue['plugins']:
            if row['version'] in ('1.1.0', '1.1.1'):
                self.assertIn('en',row['localizations'])
                self.assertNotIn('messages',row['localizations']['en'])


if __name__ == "__main__":
    unittest.main()

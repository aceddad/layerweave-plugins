"""官方一览和接缝的浏览器协作验收；从独立发布 ZIP 安装到临时目录。"""
from contextlib import closing, contextmanager
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import threading
import time
import unittest
from urllib.request import urlopen
import zlib

from layerweave.support.api import initialize_database, open_database, transaction
from layerweave.tool.builtin.view.bench import _ev
from layerweave.tool.builtin.view.plugins import plugin, list_plugins
from layerweave.tool.builtin.view.server import make_server
from layerweave.tool.builtin.view.screenshot import DevTools, QUIET, _devtools_port, capture, find_browser

ROOT = Path(__file__).resolve().parents[1]


def png():
    def chunk(kind, body):
        return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 4, 4, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress((b'\0' + b'\xff\x80\0' * 4) * 4)) + chunk(b'IEND', b'')


@contextmanager
def browser(database, state, profile):
    server, url = make_server(database, state_root=state)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    process = subprocess.Popen([find_browser(), '--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run',
        '--no-default-browser-check', *QUIET, f'--user-data-dir={profile}', '--remote-debugging-port=0', '--window-size=1400,900', 'about:blank'],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    tab = control = None
    try:
        port, ws = _devtools_port(profile, time.time() + 30)
        control = DevTools(f'ws://127.0.0.1:{port}{ws}')
        with urlopen(f'http://127.0.0.1:{port}/json/list') as response:
            page = next(p for p in json.loads(response.read()) if p.get('type') == 'page')
        tab = DevTools(page['webSocketDebuggerUrl'], timeout=45)
        yield tab, url
    finally:
        if tab:
            tab.close()
        if control:
            try:
                control.call('Browser.close')
            except (RuntimeError, OSError):
                pass
            control.close()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
        server.shutdown(); server.server_close()


@unittest.skipIf(find_browser() is None, '本机没有浏览器')
class OfficialPageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.state = self.root / 'state'
        image = self.root / 'sample.png'; image.write_bytes(png())
        self.database = initialize_database(self.root / 'project.sqlite3')
        with closing(open_database(self.database)) as c, transaction(c) as w:
            self.project = w.create('project', {'name': '独立插件验收'})['id']
            self.layer = w.create('layer', {'type': 'image', 'name': '图', 'config_ref': 'layers/image.toml', 'axis': {'unit': '秒', 'precision': .001}}, project_id=self.project)['id']
            self.objects = [w.create('object', {'layer': self.layer, 'name': f'图 {i}', 'begin': i, 'end': i+1, 'config_ref': 'objects/image.toml', 'information': {'source': str(image)}}, project_id=self.project)['id'] for i in range(65)]

    def wait(self, tab, expression):
        deadline = time.time() + 20
        while time.time() < deadline:
            if _ev(tab, 'Boolean(' + expression + ')'):
                return
            time.sleep(.05)
        self.fail(expression + ' · ' + str(_ev(tab, 'document.body.textContent.slice(-1500)')))

    def test_market_ui_installs_assets_and_pages(self):
        self.state.mkdir()
        (self.state / 'plugins.json').write_text(json.dumps({'format': 1, 'plugins': [], 'catalog': str(ROOT / 'catalog/index.json')}), encoding='utf-8')
        with browser(self.database, self.state, self.root / 'browser') as (tab, url):
            tab.call('Page.navigate', url=url + f'?project={self.project}&tree=0')
            self.wait(tab, "document.querySelector('.plugin-toggle')")
            _ev(tab, "document.querySelector('.plugin-toggle').click()")
            self.wait(tab, "[...document.querySelectorAll('.plugins-box button')].some(b=>b.textContent==='安装' && !b.disabled)")
            self.assertEqual(list_plugins(self.state)['plugins'], [])
            _ev(tab, "[...document.querySelectorAll('.plugins-box .plugin-row')].find(r=>r.textContent.includes('layerweave.assets')).querySelector('button:last-child').click()")
            self.wait(tab, "[...document.querySelectorAll('button')].some(b=>b.textContent==='一览' && !b.closest('.plugins-box'))")
            self.assertEqual([p['id'] for p in list_plugins(self.state)['plugins']], ['layerweave.assets'])
            _ev(tab, "[...document.querySelectorAll('button')].find(b=>b.textContent==='一览' && !b.closest('.plugins-box')).click()")
            self.wait(tab, "document.querySelectorAll('.grid .tile').length===60")
            self.assertIn('第 1 / 2 页', _ev(tab, "document.querySelector('.pager').textContent"))
            _ev(tab, "[...document.querySelectorAll('.pager button')].find(b=>b.title==='下一页' || b.textContent.includes('›')).click()")
            self.wait(tab, "document.querySelectorAll('.grid .tile').length===5")
            _ev(tab, "window.firstTile=document.querySelector('.tile');window.styleCount=document.querySelectorAll('style').length")
            _ev(tab, "(()=>{const el=document.querySelector('.language');el.value='en';el.dispatchEvent(new Event('change',{bubbles:true}));return true;})()")
            self.wait(tab, "document.querySelector('.pager').textContent.includes('Page 2 / 2')")
            self.assertEqual(_ev(tab, "document.querySelectorAll('.tile').length"),5)
            self.assertTrue(_ev(tab, "window.firstTile===document.querySelector('.tile')"))
            self.assertTrue(_ev(tab, "window.styleCount===document.querySelectorAll('style').length"))
            self.assertIn('Assets',_ev(tab,"document.querySelector('.bar .tabs').textContent"))
            self.assertIn('图 60',_ev(tab,"document.querySelector('.tile').textContent"))

    def test_cuts_and_paginated_screenshots(self):
        for name in ('cuts', 'assets'):
            version = json.loads((ROOT / f'plugins/layerweave.{name}/plugin.json').read_text(encoding='utf-8'))['version']
            plugin('install', file=ROOT / f'catalog/releases/layerweave.{name}-{version}.zip', root=self.state)
        with browser(self.database, self.state, self.root / 'browser') as (tab, url):
            tab.call('Page.navigate', url=url + f'?project={self.project}&view=layerweave.cuts&begin=0&end=3&tree=0')
            self.wait(tab, "document.querySelectorAll('.cut').length===3")
            self.assertIn('紧接', _ev(tab, "document.querySelector('.cut').textContent"))
            _ev(tab, "window.firstCut=document.querySelector('.cut');true")
            _ev(tab, "(()=>{const el=document.querySelector('.language');el.value='en';el.dispatchEvent(new Event('change',{bubbles:true}));return true;})()")
            self.wait(tab, "document.querySelector('.cut').textContent.includes('Adjacent')")
            self.assertTrue(_ev(tab,"window.firstCut===document.querySelector('.cut')"))
        shot = capture(self.database, self.project, self.root / 'cuts.png', view='layerweave.cuts', begin=0, end=3,
                       lang='en', full_page=True, width=900, height=600, state_root=self.state)
        self.assertTrue(shot['ready'])
        shot = capture(self.database, self.project, self.root / 'assets.png', view='layerweave.assets', params=['page=3', 'per=30'],
                       width=900, height=600, state_root=self.state)
        self.assertTrue(shot['ready'])
        self.assertIn('page=3', shot['page'])
        self.assertIn('lang=zh',shot['page'])

    def test_legacy_zip_loads_with_english_host(self):
        plugin('install',file=ROOT/'catalog/releases/layerweave.assets-1.0.0.zip',root=self.state)
        with browser(self.database,self.state,self.root/'legacy-browser') as (tab,url):
            tab.call('Page.navigate',url=url+f'?project={self.project}&view=layerweave.assets&lang=en')
            self.wait(tab,"document.querySelectorAll('.tile').length===60")
            self.assertIn('Page 1 / 2',_ev(tab,"document.querySelector('.pager').textContent"))
            self.assertIn('一览',_ev(tab,"document.querySelector('.bar .tabs').textContent"))


if __name__ == '__main__':
    unittest.main()

"""Web plugin acceptance in a real host; only local fixtures and temporary state."""
from contextlib import closing
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import tempfile
import threading
import time
import unittest
from urllib.parse import urlencode

from layerweave.support.api import initialize_database, open_database, transaction, change_cursor
from layerweave.tool.builtin.view.bench import _ev
from layerweave.tool.builtin.view.plugins import plugin
from layerweave.tool.builtin.view.screenshot import capture, find_browser
from test_pages import browser, png

ROOT = Path(__file__).resolve().parents[1]
WEB_PACKAGE = Path(os.environ.get("LAYERWEAVE_WEB_PACKAGE", ROOT/"catalog/releases/layerweave.web-1.0.0.zip"))


@unittest.skipIf(find_browser() is None, "No local browser")
class WebTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.db = initialize_database(self.root/"project.sqlite3")
        self.state = self.root/"state"
        with closing(open_database(self.db)) as c, transaction(c) as w:
            self.pid = w.create("project", {"name": "Web tests"})["id"]
            layer = w.create("layer", {"type": "text", "config_ref": "layers/text.toml"}, project_id=self.pid)["id"]
            self.object = w.create("object", {"layer": layer, "begin": 0, "end": 1, "config_ref": "objects/text.toml",
                "information": {"text": "report", "source": "site/pages/index.html", "resource_root": "site"}}, project_id=self.pid)["id"]
        site = self.root/"site"
        (site/"pages").mkdir(parents=True)
        (site/"image.png").write_bytes(png())
        (site/"style.css").write_text("h1{color:rgb(0,128,0)}")
        (site/"data.json").write_text('{"value":"version one"}')
        (site/"module.mjs").write_text("""
const data=await fetch('../data.json').then(r=>r.json());
document.querySelector('h1').textContent=data.value;
await document.querySelector('img').decode();
let isolated=false;try{parent.document.body.dataset.probe='unexpected';}catch{isolated=true;}
parent.postMessage({fixture:'local',text:data.value,color:getComputedStyle(document.querySelector('h1')).color,
image:document.querySelector('img').naturalWidth,isolated},'*');
""")
        (site/"pages/index.html").write_text('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../style.css">'
            '<h1>Loading</h1><img src="../image.png"><script type="module" src="../module.mjs"></script>', encoding="utf-8")
        plugin("install", file=WEB_PACKAGE, root=self.state)

    def wait(self, tab, expression):
        deadline = time.time()+20
        while time.time() < deadline:
            if _ev(tab, "Boolean("+expression+")"):
                return
            time.sleep(.05)
        self.fail(expression+" · "+str(_ev(tab, "({messages:window.fixtureMessages,frame:document.querySelector('.lw-web iframe')?.outerHTML,body:document.body.textContent.slice(-1600)})")))

    def instrument(self, tab):
        tab.call("Page.enable")
        tab.call("Page.addScriptToEvaluateOnNewDocument", source=
                 "window.fixtureMessages=[];addEventListener('message',e=>{if(e.data?.fixture)fixtureMessages.push(e.data)});")

    def test_local_resources_object_route_reload_and_language(self):
        with closing(open_database(self.db)) as c:
            before = change_cursor(c)
        with browser(self.db, self.state, self.root/"browser") as (tab, url):
            self.instrument(tab)
            tab.call("Page.navigate", url=url+"?"+urlencode({"project":self.pid,"view":"layerweave.web","object":self.object}))
            self.wait(tab, "window.fixtureMessages?.some(m=>m.fixture==='local')")
            data = _ev(tab, "fixtureMessages.find(m=>m.fixture==='local')")
            self.assertEqual((data["text"], data["color"], data["image"], data["isolated"]),
                             ("version one", "rgb(0, 128, 0)", 4, True))
            _ev(tab, "window.originalFrame=document.querySelector('.lw-web iframe');true")
            _ev(tab, "(()=>{const e=document.querySelector('.language');e.value='en';e.dispatchEvent(new Event('change',{bubbles:true}));})()")
            self.wait(tab, "document.querySelector('.lw-web').textContent.includes('Reload')")
            self.assertTrue(_ev(tab, "originalFrame===document.querySelector('.lw-web iframe')"))
            (self.root/"site/data.json").write_text('{"value":"version two"}')
            _ev(tab, "[...document.querySelectorAll('.lw-web button')].find(b=>b.textContent==='Reload').click()")
            self.wait(tab, "window.fixtureMessages?.some(m=>m.text==='version two')")
            self.assertTrue(_ev(tab, "document.querySelector('.lw-web-external').href.includes('/documents/')"))
        with closing(open_database(self.db)) as c:
            self.assertEqual(change_cursor(c), before)
        shot = capture(self.db, self.pid, self.root/"local.png", view="layerweave.web",
                       params=["file=site/pages/index.html", "resource_root=site"],
                       state_root=self.state, timeout_ms=30000)
        self.assertTrue(shot["ready"])

    def test_inline_html_and_url_modes(self):
        html = "<h1>Inline source</h1><script>parent.postMessage({fixture:'inline'},'*')</script>"
        with browser(self.db, self.state, self.root/"inline") as (tab, url):
            self.instrument(tab)
            tab.call("Page.navigate", url=url+"?"+urlencode({"project":self.pid,"view":"layerweave.web","html":html}))
            self.wait(tab, "window.fixtureMessages?.some(m=>m.fixture==='inline')")
            self.assertTrue(_ev(tab, "document.querySelector('.lw-web a[download]').href.startsWith('blob:')"))
        class Handler(SimpleHTTPRequestHandler):
            def log_message(self, *args): pass
        (self.root/"site/remote.html").write_text("<h1>Remote page</h1><script type='module'>"
            "const data=await fetch('./data.json').then(r=>r.json());"
            "parent.postMessage({fixture:'remote',text:data.value},'*')</script>")
        remote = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=str(self.root/"site")))
        threading.Thread(target=remote.serve_forever, daemon=True).start()
        target = f"http://127.0.0.1:{remote.server_address[1]}/remote.html"
        try:
            with browser(self.db, self.state, self.root/"url") as (tab, url):
                self.instrument(tab)
                tab.call("Page.navigate", url=url+"?"+urlencode({"project":self.pid,"view":"layerweave.web","url":target}))
                self.wait(tab, "window.fixtureMessages?.some(m=>m.fixture==='remote')")
                self.assertEqual(_ev(tab, "fixtureMessages.find(m=>m.fixture==='remote').text"), "version one")
                self.assertEqual(_ev(tab, "document.querySelector('.lw-web-external').href"), target)
                self.assertTrue(_ev(tab, "document.querySelector('.lw-web-hint')!==null"))
        finally:
            remote.shutdown(); remote.server_close()

    def test_missing_file_fails_capture_instead_of_a_blank_success(self):
        with self.assertRaisesRegex(RuntimeError, "不存在|not found"):
            capture(self.db, self.pid, self.root/"missing.png", view="layerweave.web",
                    params=["file=absent.html"], state_root=self.state, timeout_ms=30000)
        self.assertFalse((self.root/"missing.png").exists())

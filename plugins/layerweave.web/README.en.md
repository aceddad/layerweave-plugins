# Web · layerweave.web

Open URLs, HTML source, and local HTML files in a separate plugin page. Use it for generated reports, static interactive documents, running local prototypes, and reference links. It does not change canvas layouts or project objects.

Requires **view 0.31.0+**, host.api 3. The interface follows the host's Chinese/English setting without reloading the displayed page.

## Install and open

```powershell
python -X utf8 -m layerweave.tool.builtin.view.plugins install layerweave.web
python -X utf8 -m layerweave.tool.builtin.view.plugins info layerweave.web
```

Alternatively, use the host's plugin manager or `install --file layerweave.web-1.0.0.zip`. Refresh the view, then choose **Web** in the top bar.

Choose URL, HTML source, or Local HTML, enter a source, and select Open. Reload reopens the current source. URLs and local files have an external browser link; pasted HTML can be downloaded.

## AI and link parameters

Choose exactly one of `url`, `html`, `file`, or `object`. With no parameters, the plugin tries the selected project object, then shows an empty form. `resource_root` optionally sets a local file's resource directory.

```text
http://127.0.0.1:8765/?project=1&view=layerweave.web&file=reports/index.html
http://127.0.0.1:8765/?project=1&view=layerweave.web&object=12
```

Encode URL query values normally. The screenshot command also accepts source parameters:

```powershell
python -X utf8 -m layerweave.tool.builtin.view.screenshot project.sqlite3 1 web.png --view layerweave.web --param file=reports/index.html
python -X utf8 -m layerweave.tool.builtin.view.screenshot project.sqlite3 1 web.png --view layerweave.web --param url=http://127.0.0.1:5199/
python -X utf8 -m layerweave.tool.builtin.view.screenshot project.sqlite3 1 web.png --view layerweave.web --param 'html=<!doctype html><h1>Reading notes</h1>'
```

MCP uses the existing `view_screenshot` command's `view` and `params`. Query `view_plugin info layerweave.web` for the plugin's usage and parameters.

## Project objects

An existing text object's `information` can contain:

```json
{
  "text": "Article analysis report",
  "source": "reports/index.html"
}
```

The plugin checks, in order: nonempty `html`, HTTP(S) `url`, then a `source` containing an HTTP(S) address or a `.html/.htm` path. Local references can include `resource_root`. The selector lists objects with supported page sources; IDs refer to the current project.

The plugin does not save edited addresses into objects. Existing project tools continue to manage content and relations.

## Local resources

Relative file paths start at the **database directory**. The resource root defaults to the HTML file's directory. If `pages/index.html` uses `../styles/main.css`, set the root to the common directory containing pages and styles.

Relative images, CSS, JavaScript modules, and JSON fetches can use this resource route. Routes exist only while the view service runs and add no database records. Opening HTML does not run npm, Python, or build scripts.

Pages using site-root paths such as `/assets/...`, backend services, or Vite compilation should run their own server and be opened as URLs. This also applies to the H3 prototype.

## Display and capture limits

The iframe can execute scripts but does not share the host page's origin privileges. Relative links can navigate inside the frame. The input retains the original source; it does not track cross-site navigation as a full browser address bar would.

Some sites block embedding or require login/storage features unavailable in a frame. Use the external browser link. This plugin does not proxy sites or bypass their restrictions.

Screenshots wait for the frame's load event. Known errors such as missing files or invalid parameters fail explicitly. Browsers do not reliably expose cross-site framing failures to the embedding page, so frame readiness is not an accessibility check for the remote site. It also does not guarantee that every asynchronous application task or animation has completed.

## Extend

Sources live in `src/`, built output in `dist/`. The plugin uses the fixed SDK and host interface. `host.openDocument(file, resource_root?)` returns a temporary local URL and filename. Extend `src/source.ts` to recognize additional project information conventions.

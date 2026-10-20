# LayerWeave official view plugins

[简体中文](README.md) | **English**

Optional plugins for the LayerWeave web view. Installing the host does not install these plugins; its canvas works without them. This repository uses plugin format 1 and host.api 3.

| Plugin | Purpose | Version | Required view |
|---|---|---|---|
| [Assets](plugins/layerweave.assets/README.en.md) | Browse images, videos, audio and text | 1.1.1 | 0.29.0+ |
| [Cuts](plugins/layerweave.cuts/README.en.md) | Compare adjacent frames and follow cuts | 1.1.1 | 0.29.0+ |
| [Preview](plugins/layerweave.preview/README.en.md) | Inspect video and animated images frame by frame | 1.1.1 | 0.29.0+ |
| [Web](plugins/layerweave.web/README.en.md) | Open URLs, HTML source and local HTML pages | 1.0.1 | 0.31.0+ |

All four follow the host's Chinese/English selector. Earlier versions remain in the catalog for older hosts.

## Install

Install a complete LayerWeave host first. Run from its Python environment:

```powershell
python -X utf8 -m layerweave.tool.builtin.view.plugins market
python -X utf8 -m layerweave.tool.builtin.view.plugins info layerweave.preview
python -X utf8 -m layerweave.tool.builtin.view.plugins install layerweave.preview
```

The view's plugin manager also supports discovery, installation, disabling and removal. Use `--catalog` to select another catalog URL or local index.json. For offline installation, use `install --file PATH_TO_ZIP`. Updates require an explicit update action. Ordinary users do not need Node.js.

## Develop

Development requires Node.js 22.12+ and Python 3.11+. Plugins use the host's React and the type snapshot in sdk/host-api-3; they do not ship another React runtime.

```powershell
npm ci
npm run build
python -X utf8 tools/package_plugin.py
python -X utf8 tools/build_index.py
```

Each directory under plugins contains its manifest, source, dist, localized guides and license. Packaging produces deterministic ZIP files; a changed archive cannot replace an existing version. Increase that plugin's version when its files change. Use `--output scratch/releases` for trial packages. The catalog only indexes ZIP files under catalog/releases; unfinished material is excluded.

Test a development folder with `python -X utf8 -m layerweave.tool.builtin.view.plugins add plugins/layerweave.preview`. The [host plugin documentation](https://gitee.com/emotion1354414/layer-weave/blob/visualization/src/layerweave/tool/builtin/view/PLUGINS.md) describes the manifest and runtime API. Each plugin's own guide documents its parameters and examples.

## Check

```powershell
npm test
python -X utf8 -B -m unittest discover -s tests -v
```

Python acceptance tests require an installed LayerWeave host. Browser checks use Chrome, Edge or Chromium; media checks may use FFmpeg. They use temporary projects and plugin state.

## License

Official plugin source code uses [MIT](LICENSE). Current manifests declare license and license_file, and their ZIP archives include the license. Earlier archives retain their original bytes. The host, external services and project media retain their respective terms.

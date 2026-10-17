# Frame Preview

Inspect frames of videos, animated SVGs and animated images by time.

This is an optional plugin, installed separately from the host. Version 1.1.0 requires View 0.29.0 or newer with host.api 3. The header language selector switches between Chinese and English without resetting the plugin's page or selection.

Install it, then select **Frame Preview** in the view header:

```sh
python -m layerweave.tool.builtin.view.plugins install layerweave.preview
python -m layerweave.tool.builtin.view.plugins info layerweave.preview
python -m layerweave.tool.builtin.view.screenshot DATABASE PROJECT_ID output.png --lang en --view layerweave.preview --param object=OBJECT_ID --param step=0.5s
```

Replace DATABASE, PROJECT_ID, any object/root IDs and the output path with actual values. Query project IDs first. `info` reads parameter definitions from plugin.json. Captures wait for the page to finish; they do not modify project content.

For development, run `npm ci` and `npm run build` at the plugin repository root, then use `python -m layerweave.tool.builtin.view.plugins add PATH_TO_PLUGIN_DIRECTORY`. Use only the fixed host-api-3 type snapshot and the runtime host; do not import host internals. UI components call `host.useI18n()`, while ordinary callbacks can use `host.t()`. Translation files live in `locales/`.

Video frames require readable media. Animated-image decoding depends on browser ImageDecoder support. Unsupported formats report the reason; static images are not treated as animations. Layers are not automatically composited into video. SVG previews remove scripts and event attributes.

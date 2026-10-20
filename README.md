# LayerWeave 官方视图插件

这是独立于宿主的选装插件仓库。安装 LayerWeave 不会自动安装这里的插件；零插件也能使用画布。当前发布协议 v1，运行接口为 `host.api = 3`。

| 插件 | 用途 |
|---|---|
| [layerweave.assets · 一览](plugins/layerweave.assets/README.md) | 按种类分页查找图片、视频、音频和文字 |
| [layerweave.cuts · 接缝](plugins/layerweave.cuts/README.md) | 检查前后画面衔接，沿接缝跳转 |
| [layerweave.preview · 预览](plugins/layerweave.preview/README.md) | 检查视频和动态图像的逐帧结果 |
| [layerweave.web · 网页](plugins/layerweave.web/README.md) | 在独立页面打开网址、HTML 源码和本地 HTML 文件 |

## 选装

需要带插件管理器的 LayerWeave 视图。最初三个插件的 1.1.0 提供中英语言包，需要视图 0.29.0+，旧宿主可选择其 1.0.0；网页插件的 1.0.0 已提供中英界面，需要视图 0.31.0+：

```sh
python -m layerweave.tool.builtin.view.plugins market
python -m layerweave.tool.builtin.view.plugins info layerweave.preview
python -m layerweave.tool.builtin.view.plugins install layerweave.preview
```

网页顶栏「插件」也能查询、安装、开关和卸载。想换目录时，用 `--catalog URL或本机index.json`；离线包用 `install --file 路径.zip`。更新只在明确执行 `update` 时发生。

完整协议和宿主接口边界见[视图插件文档](https://gitee.com/emotion1354414/layer-weave/blob/visualization/src/layerweave/tool/builtin/view/PLUGINS.md)。每个插件的 manifest 和 README 是它自身用途与参数的主要说明。

## 开发与发布

这里保存源码、固定的接口类型快照和构建好的发布资源。使用 Node.js 22.12+ 与 Python 3.11+。普通使用者安装 ZIP，不需要 Node。

```sh
npm ci
npm run build
python tools/package_plugin.py
python tools/build_index.py
```

构建与发布步骤分别负责：类型检查和单元测试 → 每个插件独立构建 dist → 每个版本生成 ZIP → 从 ZIP 生成静态目录。原样再次打包得到相同字节；已有版本内容改变会拒绝覆盖，需要升插件自己的 version。第一次正式发布前的本地试包请输出到 scratch，例如 `python tools/package_plugin.py --output scratch/releases`。

开发时使用已安装的 LayerWeave：

```sh
python -m layerweave.tool.builtin.view.plugins add plugins/layerweave.preview
```

插件使用 `host.React`，只从 `sdk/host-api-3` 导入类型。接口快照由宿主构建脚本生成，`snapshot.json` 记录其宿主版本；更新快照时先核对兼容范围。SDK 只有 `.d.ts`，不提供可导入的宿主实现。

新增插件可参照任一现有目录：自己的 publisher/name、独立 version、用途和参数声明、README、src 和 dist。这几个字段不要求源码必须放在官方仓库，第三方也可以维护自己的仓库与目录。

目录只登记 `catalog/releases/` 中的 ZIP；`_unfinished/` 保存未完成的参考材料，不构建、不进入目录、不发布为插件。Python 组件暂不在这里执行安装流程。

## 语言包

三个官方插件的 1.1.0 跟随宿主顶栏切换中文 / English，切换保留当前页、筛选和已解码帧。各插件的 `locales/zh.json` 与 `en.json` 保存界面词条、显示元数据和使用说明路径。原 manifest 身份和参数约定保持不变。

组件内用 `host.useI18n()`，普通回调用 `host.t()`；不要把 locale 加进媒体解码 effect 的依赖。自己的词典缺英文时回退中文，未声明语言包的旧插件继续显示原文。完整格式见[语言包协议](https://gitee.com/emotion1354414/layer-weave/blob/visualization/src/layerweave/tool/builtin/view/LANGUAGES.md)。打包脚本只收集明确声明的语言文件和说明。

## 验收

```sh
npm test
python -X utf8 -B -m unittest discover -s tests -v
```

Python 测试需要先在所用解释器中安装带视图的 LayerWeave，例如使用已构建 wheel；浏览器测试还需 Chrome、Edge 或 Chromium。测试使用临时数据库、临时插件清单和独立浏览器配置，不改真实用户状态。它覆盖可重复打包、目录校验、全部离线安装、网页安装一览与分页、接缝截图、动态 SVG 与 GIF 逐帧读取。

## 目录

| 位置 | 内容 |
|---|---|
| `plugins/<publisher.name>/` | 各插件声明、说明、源码和独立构建结果 |
| `sdk/host-api-3/` | 随 host.api 固定引用的类型快照 |
| `catalog/index.json` | 自动生成的多版本目录 |
| `catalog/releases/` | 不可变的版本 ZIP |
| `tools/` | 构建、打包、目录生成脚本 |
| `tests/` | 发布与真实宿主协作测试 |

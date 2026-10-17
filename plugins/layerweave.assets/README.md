# 一览

按种类分页查看项目中的图片、视频、音频和文字。

由用户选择安装，不随宿主分发。适合查看素材清单、按种类查找项目内容。

安装后在视图顶栏选择「一览」。也可以调用：

```sh
python -m layerweave.tool.builtin.view.plugins install layerweave.assets
python -m layerweave.tool.builtin.view.plugins info layerweave.assets
python -m layerweave.tool.builtin.view.screenshot DATABASE 项目编号 输出.png --view layerweave.assets --param page=2 --param per=30
```

将 DATABASE、项目编号、对象或根层编号、输出路径替换为实际值；编号先查询项目。参数详情由 `info` 从 plugin.json 读取。截图等待页面完成再生成；不会改业务内容。

开发时运行仓库根的 `npm ci`、`npm run build`，再用 `view_plugin add` 链接本目录。源码只通过固定的 host-api-3 类型快照和运行时 host 使用宿主能力；不要导入宿主内部实现。

1.1.0 起支持顶栏中英即时切换，需要视图 0.29.0+（host.api 3）。截图可加 `--lang en`；语言文件在 `locales/`，组件内使用 `host.useI18n()`，普通回调使用 `host.t()`。切换不重置页码、筛选或重新解码媒体。

# 接缝

并排查看同一轨道前后相接的画面，沿接缝跳转。

由用户选择安装，不随宿主分发。适合检查画面衔接以及跳转到下一个片段。

安装后在视图顶栏选择「接缝」。也可以调用：

```sh
python -m layerweave.tool.builtin.view.plugins install layerweave.cuts
python -m layerweave.tool.builtin.view.plugins info layerweave.cuts
python -m layerweave.tool.builtin.view.screenshot DATABASE 项目编号 输出.png --view layerweave.cuts --board 根层编号 --begin 0 --end 10
```

将 DATABASE、项目编号、对象或根层编号、输出路径替换为实际值；编号先查询项目。参数详情由 `info` 从 plugin.json 读取。截图等待页面完成再生成；不会改业务内容。

开发时运行仓库根的 `npm ci`、`npm run build`，再用 `view_plugin add` 链接本目录。源码只通过固定的 host-api-3 类型快照和运行时 host 使用宿主能力；不要导入宿主内部实现。

1.1.0 起支持顶栏中英即时切换，需要视图 0.29.0+（host.api 3）。截图可加 `--lang en`；语言文件在 `locales/`，组件内使用 `host.useI18n()`，普通回调使用 `host.t()`。切换不重置页码、筛选或重新解码媒体。

## 许可证

本插件采用 [MIT](LICENSE)，许可文件随离线 ZIP 提供。

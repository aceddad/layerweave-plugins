# 预览

按时间取帧，分页检查视频、动态 SVG 和动态图像。

由用户选择安装，不随宿主分发。适合逐帧检查运动、媒体生成结果和视频首尾变化。

安装后在视图顶栏选择「预览」。也可以调用：

```sh
python -m layerweave.tool.builtin.view.plugins install layerweave.preview
python -m layerweave.tool.builtin.view.plugins info layerweave.preview
python -m layerweave.tool.builtin.view.screenshot DATABASE 项目编号 输出.png --view layerweave.preview --param object=对象编号 --param step=0.5s
```

将 DATABASE、项目编号、对象或根层编号、输出路径替换为实际值；编号先查询项目。参数详情由 `info` 从 plugin.json 读取。截图等待页面完成再生成；不会改业务内容。

开发时运行仓库根的 `npm ci`、`npm run build`，再用 `view_plugin add` 链接本目录。源码只通过固定的 host-api-3 类型快照和运行时 host 使用宿主能力；不要导入宿主内部实现。

视频取帧需要宿主可读取媒体；动态图像逐帧解码依赖浏览器 ImageDecoder，不能解码时页面说明原因。静态图像不伪装成动画；多个图层不会自动合成为视频。SVG 预览移除脚本和事件属性。

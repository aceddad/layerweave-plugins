# 网页 · layerweave.web

在独立插件页面中查看网址、HTML 源码或本地 HTML 文件。适合 AI 生成的报告、静态交互页面、本机运行的原型以及外部参考链接。它不改变画布，也不修改项目对象。

需要 LayerWeave 视图 **0.31.0+**、host.api 3。插件提供中英界面，跟随宿主切换；切换语言不会重新载入正在看的网页。

## 安装与打开

```powershell
python -X utf8 -m layerweave.tool.builtin.view.plugins install layerweave.web
python -X utf8 -m layerweave.tool.builtin.view.plugins info layerweave.web
```

也可在顶栏“插件”中选装，或用 `install --file layerweave.web-1.0.0.zip` 离线安装。安装后刷新视图，点击顶栏“网页”。

选择“网址”“HTML 源码”或“本地 HTML”，填写内容并点击“打开”。可重新载入当前来源；网址和本地文件可在外部浏览器打开，直接粘贴的 HTML 可下载为文件。

## AI 与链接入口

URL 参数每次选择一个来源：`url`、`html`、`file`、`object`。未传参时先尝试当前选中对象，否则显示输入框。`resource_root` 只用于本地文件的资源目录。

```text
http://127.0.0.1:8765/?project=1&view=layerweave.web&file=reports/index.html
http://127.0.0.1:8765/?project=1&view=layerweave.web&object=12
```

网址、源码和带特殊字符的路径应按正常 URL 参数编码；复杂内容建议通过截图工具的参数传入：

```powershell
python -X utf8 -m layerweave.tool.builtin.view.screenshot project.sqlite3 1 web.png --view layerweave.web --param file=reports/index.html
python -X utf8 -m layerweave.tool.builtin.view.screenshot project.sqlite3 1 web.png --view layerweave.web --param url=http://127.0.0.1:5199/
python -X utf8 -m layerweave.tool.builtin.view.screenshot project.sqlite3 1 web.png --view layerweave.web --param 'html=<!doctype html><meta charset="utf-8"><h1>阅读笔记</h1>'
```

MCP 复用现有 `view_screenshot` 的 `view` 和 `params`，无需另装一套浏览器命令。插件的参数与用途也可通过 `view_plugin info layerweave.web` 查询。

## 从项目对象打开

可以继续使用已有文字对象，AI 通过已有读写工具维护信息：

```json
{
  "text": "文章分析报告",
  "source": "reports/index.html"
}
```

插件读取 `information`，优先顺序为：

1. 非空 `html`：直接渲染 HTML 源码。
2. HTTP(S) `url`：打开网页。
3. `source`：HTTP(S) 地址或 `.html/.htm` 本地路径。

本地文件还可声明 `resource_root`。对象列表只显示有上述网页来源的对象；编号仍属于当前项目。插件不会保存地址输入框到对象里，资料登记与关联继续交给现有工具。

## 本地 HTML 与资源

相对文件路径基于**数据库文件所在目录**。资源目录默认是 HTML 所在目录；如果 `pages/index.html` 需要 `../styles/main.css`，将资源目录设为包含 pages 和 styles 的共同目录。

页面的相对图片、CSS、JavaScript 模块和 JSON 请求可以使用这些资源。资源入口只在当前视图进程中存在，服务退出后失效；项目库不增加记录。打开文件不运行 npm、Python 或构建脚本。

这是相对资源预览。使用 `/assets/...` 这类站点根路径、依赖后端或需要 Vite 编译的应用，应启动自己的服务，再选择“网址”。H3 原型就采用其运行后的本机地址。

## 显示与截图边界

页面放在 iframe 中，HTML 可执行脚本，但不共享 LayerWeave 页面的来源权限。网页内相对链接可继续导航；地址输入框保留最初打开的来源，不冒充完整浏览器的实时地址栏。

有些网站禁止嵌入，或需要 iframe 中不可用的登录与存储环境，此时使用外部浏览器入口。插件不会代理网站或绕过其限制。

截图等待 iframe 的加载事件；缺文件、无效参数等已知错误会明确失败。跨站页面拒绝嵌入时，浏览器不保证向插件提供可靠错误事件，因此“窗口就绪”不能用于判断外站是否可访问。动态应用完成异步内容或动画的时刻也不由此保证。

## 扩展

源码在 `src/`，构建产物在 `dist/`；插件仅通过固定 SDK 类型和 `host` 使用宿主能力。本地文件入口是 `host.openDocument(file, resource_root?)`，返回临时 URL 和文件名。网页来源解析独立放在 `src/source.ts`，可在此扩充其它对象信息约定。

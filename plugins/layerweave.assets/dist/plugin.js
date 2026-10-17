//#region plugins/layerweave.assets/src/assets.css?raw
var e = (e, n) => t.t(e, n), t, n, r = [
	"all",
	"image",
	"video",
	"audio",
	"text"
], i = {
	all: "filters.all",
	image: "kind.image",
	video: "kind.video",
	audio: "kind.audio",
	text: "kind.text"
}, a = {
	image: "var(--image)",
	video: "var(--video)",
	audio: "var(--audio)",
	text: "var(--text-c)"
}, o = [
	30,
	60,
	120
];
function s({ o: r, project: o, frames: s, unit: c }) {
	t.useI18n();
	let { Thumb: l, Frame: u, Waveform: d } = t.components, { kindOf: f, mediaUrl: p, fmt: m } = t.util, h = f(r), g = !!r.media && !r.media.available;
	return /* @__PURE__ */ n("div", {
		className: "tile",
		title: r.media?.source ?? "",
		onClick: () => t.selectObject(r.id)
	}, /* @__PURE__ */ n("div", { className: "thumb" }, g ? e("media.missing") : h === "image" ? /* @__PURE__ */ n(l, {
		project: o,
		o: r,
		width: 320,
		frames: s
	}) : h === "video" ? /* @__PURE__ */ n(u, {
		project: o,
		o: r,
		at: .1,
		frames: s
	}) : h === "audio" ? /* @__PURE__ */ n(d, {
		url: p(r.media.url, r.media?.source),
		className: "tile-wave"
	}) : h === "text" ? /* @__PURE__ */ n("div", { className: "txt" }, r.text) : null, /* @__PURE__ */ n("span", {
		className: "badge",
		style: { background: a[h] ?? "var(--other)" }
	}, i[h] ? e(i[h]) : h)), /* @__PURE__ */ n("div", { className: "info" }, /* @__PURE__ */ n("div", { className: "nm" }, r.name || (r.media?.source || "").split(/[\\/]/).pop() || e("object.unnamed", { value1: r.id })), /* @__PURE__ */ n("div", { className: "meta" }, r.layer.name || e("layer.unnamed", { value1: r.layer.id }), " · ", m(r.begin, c), " – ", m(r.end, c))));
}
function c() {
	t.useI18n();
	let { React: a } = t, { model: c, project: l, frames: u } = t.useView(), [d, f] = a.useState("all"), [p, m] = a.useState(() => t.numParam("page") ?? 1), [h, g] = a.useState(() => t.numParam("per") ?? 60);
	if (a.useEffect(() => {
		c && t.markReady();
	}, [c]), !c || l == null) return null;
	let { kindOf: _, pageSlice: v } = t.util, { Pager: y } = t.components, b = c.allObjects().filter((e) => e.layer.role !== "note" && (d === "all" ? _(e) !== "other" : _(e) === d)), x = v(b, p, h);
	return /* @__PURE__ */ n("main", { className: "assets-view" }, /* @__PURE__ */ n("div", { className: "filters" }, r.map((t) => /* @__PURE__ */ n("button", {
		key: t,
		className: d === t ? "on" : "",
		onClick: () => {
			f(t), m(1);
		}
	}, e(i[t]))), /* @__PURE__ */ n("span", { className: "spacer" }), /* @__PURE__ */ n(y, {
		total: b.length,
		page: x.page,
		per: h,
		onPage: m,
		sizes: o,
		onPer: (e) => {
			g(e), m(1);
		}
	})), /* @__PURE__ */ n("div", { className: "grid" }, !b.length && /* @__PURE__ */ n("p", { className: "hint" }, e("assets.empty")), x.items.map((e) => /* @__PURE__ */ n(s, {
		key: e.id,
		o: e,
		project: l,
		frames: u,
		unit: c.unitOfRoot(e.layer.root)
	}))));
}
function l(e) {
	return t = e, n = e.React.createElement, e.React.Fragment, e.addStyle("/* 一览插件的样式（以前在视图的 styles.css 里） */\n.assets-view { flex: 1; display: flex; flex-direction: column; min-height: 0; }\n.assets-view .filters { display: flex; align-items: center; gap: 4px; padding: 10px 12px; border-bottom: 1px solid var(--line); }\n.assets-view .grid { flex: 1; overflow: auto; padding: 12px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; align-content: start; }\n.tile { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; overflow: hidden; cursor: pointer; }\n.tile:hover { border-color: var(--accent); }\n.tile .thumb { height: 120px; background: #0d0f13; display: flex; align-items: center; justify-content: center; color: var(--dim); position: relative; }\n.tile .thumb img, .tile .thumb video, .tile .thumb canvas { width: 100%; height: 100%; object-fit: contain; }\n.tile .thumb .badge { position: absolute; top: 6px; left: 6px; font-size: 10px; padding: 0 5px; border-radius: 3px; color: #fff; }\n.tile .info { padding: 6px 8px; }\n.tile .info .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.tile .info .meta { color: var(--dim); font-size: 11px; }\n.tile .thumb .txt { padding: 10px; font-size: 12px; color: var(--text); overflow: hidden; max-height: 100%; }\n.assets-view .filters .spacer { flex: 1; }\nbody.full .assets-view, body.full .assets-view .grid { overflow: visible; flex: none; }\n"), {
		name: "assets",
		label: "一览",
		title: "按种类列出项目里所有的对象：图片、视频、音频、文字……分页；点一下回到画布上的位置",
		page: c
	};
}
//#endregion
export { l as default };

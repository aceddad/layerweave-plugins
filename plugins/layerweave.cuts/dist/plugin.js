//#region plugins/layerweave.cuts/src/cuts.ts
function e(e, t, n, r) {
	let i = [];
	for (let a of n) (r.board == null || e.rootsOf(a).includes(r.board)) && a.rows.forEach((n, r) => {
		for (let o of t.visibleTracks(n)) {
			if (t.foldOf(o) != null) continue;
			let s = o.parts.flatMap(({ layer: t, seg: n }) => t.objects.filter((t) => ["image", "video"].includes(e.kindOf(t))).map((e) => ({
				o: e,
				layer: t,
				offset: n.offset,
				root: n.root,
				begin: e.begin + n.offset,
				end: e.end + n.offset,
				lane: 0
			}))).sort((e, t) => e.begin - t.begin || e.end - t.end || e.o.id - t.o.id), c = e.lanes(s), l = [];
			s.forEach((e, t) => {
				let s = l[c[t]];
				s && i.push({
					board: a,
					row: n,
					rowIndex: r,
					track: o,
					a: s,
					b: e,
					gap: e.begin - s.end
				}), l[c[t]] = e;
			});
		}
	});
	let a = r.begin ?? -Infinity, o = r.end ?? Infinity;
	return i.filter((e) => e.b.begin >= a && e.b.begin <= o);
}
var t = (e, t) => `${e.keyOf(t.board)}|${t.rowIndex}|${t.track.key}`;
function n(t, n, r) {
	return [...new Set(e(t, n, [r], {}).map((e) => +e.b.begin.toFixed(6)))].sort((e, t) => e - t);
}
//#endregion
//#region plugins/layerweave.cuts/src/cuts.css?raw
var r = "/* 接缝插件的样式：插件加载时由 host.addStyle 加进页面 */\n.cuts-view { flex: 1; overflow: auto; padding: 12px 16px; }\n.cut-group h3 { font-size: 13px; margin: 14px 0 8px; }\n.cut-group h3 small { color: var(--dim); font-weight: normal; }\n.cut { display: flex; align-items: center; gap: 12px; padding: 8px; margin-bottom: 8px; border: 1px solid var(--line); border-radius: 6px; background: var(--panel); cursor: pointer; }\n.cut:hover { border-color: var(--accent); }\n.cut figure { margin: 0; width: 320px; }\n.cut .shot { width: 320px; height: 180px; background: #0d0f13; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; color: var(--dim); text-align: center; font-size: 12px; }\n.cut .shot img, .cut .shot video { width: 100%; height: 100%; object-fit: contain; }\n.cut .shot.missing { background: repeating-linear-gradient(45deg, #3a2a2a, #3a2a2a 6px, #2a1f1f 6px, #2a1f1f 12px); color: #f2b0b0; }\n.cut figcaption { font-size: 12px; margin-top: 4px; }\n.cut figcaption small { color: var(--dim); }\n.cut-mid { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 90px; color: var(--dim); font-size: 12px; text-align: center; }\n.cut-mid b { font-size: 22px; color: var(--accent); }\n.cut-mid .cross { color: #dfe8ff; }\nbody.full .cuts-view { overflow: visible; flex: none; }\n", i = (e, t) => a.t(e, t), a, o;
function s({ model: e, it: t, end: n, project: r, frames: s }) {
	a.useI18n();
	let { Thumb: c, Frame: l } = a.components, { kindOf: u, lastAt: d, isSec: f } = a.util, p = t.o, m = e.unitOfRoot(t.root);
	return p.media && !p.media.available ? /* @__PURE__ */ o("div", { className: "shot missing" }, i("media.missing"), /* @__PURE__ */ o("br", null), p.media.source) : p.media?.url ? u(p) === "image" ? /* @__PURE__ */ o("div", { className: "shot" }, /* @__PURE__ */ o(c, {
		project: r,
		o: p,
		width: 640,
		frames: s
	})) : /* @__PURE__ */ o("div", { className: "shot" }, /* @__PURE__ */ o(l, {
		project: r,
		o: p,
		at: n ? d(p, f(m)) : .05,
		frames: s
	})) : /* @__PURE__ */ o("div", { className: "shot missing" }, i("media.noFile"));
}
function c({ model: e, cut: t, project: n, frames: r }) {
	a.useI18n();
	let { kindOf: c, fmt: l, fmtSpan: u } = a.util, d = e.unitOfRoot(t.a.root), f = (e, t) => c(e.o) === "video" ? i(t ? "frame.last" : "frame.first") : i("kind.image"), p = (t, n) => l(n - t.offset, e.unitOfRoot(t.root)) + (t.offset ? i("cut.boardTime", { value1: l(n, d) }) : ""), m = Math.abs(t.gap) < 1e-6 ? i("cut.adjacent") : t.gap > 0 ? i("cut.gap", { value1: u(t.gap, d) }) : i("cut.overlap", { value1: u(-t.gap, d) }), h = (e) => `#${e.o.id} ${e.o.name || (e.o.media?.source || "").split(/[\\/]/).pop()}`;
	return /* @__PURE__ */ o("div", {
		className: "cut",
		onClick: () => a.selectObject(t.b.o.id)
	}, /* @__PURE__ */ o("figure", null, /* @__PURE__ */ o(s, {
		model: e,
		it: t.a,
		end: !0,
		project: n,
		frames: r
	}), /* @__PURE__ */ o("figcaption", null, h(t.a), "  ", i("cut.of"), f(t.a, !0), /* @__PURE__ */ o("br", null), /* @__PURE__ */ o("small", null, i("cut.endsAt"), " ", p(t.a, t.a.end)))), /* @__PURE__ */ o("div", { className: "cut-mid" }, /* @__PURE__ */ o("b", null, "→"), /* @__PURE__ */ o("small", null, m), t.a.root !== t.b.root && /* @__PURE__ */ o("small", { className: "cross" }, i("cut.crossSegment"), e.nameOf(t.a.root), " → ", e.nameOf(t.b.root))), /* @__PURE__ */ o("figure", null, /* @__PURE__ */ o(s, {
		model: e,
		it: t.b,
		end: !1,
		project: n,
		frames: r
	}), /* @__PURE__ */ o("figcaption", null, h(t.b), "  ", i("cut.of"), f(t.b, !1), /* @__PURE__ */ o("br", null), /* @__PURE__ */ o("small", null, i("cut.beginsAt"), " ", p(t.b, t.b.begin)))));
}
function l() {
	a.useI18n();
	let { model: n, boards: r, project: s, frames: l } = a.useView();
	if (a.React.useEffect(() => {
		n && a.markReady();
	}, [n]), !n || s == null) return null;
	let u = e(a.util, n, r, {
		board: a.numParam("board"),
		begin: a.numParam("begin"),
		end: a.numParam("end")
	}), d = /* @__PURE__ */ new Map();
	for (let e of u) {
		let n = t(a.util, e);
		d.has(n) || d.set(n, []), d.get(n).push(e);
	}
	return /* @__PURE__ */ o("main", { className: "cuts-view" }, !u.length && /* @__PURE__ */ o("p", { className: "hint" }, i("cuts.empty")), [...d.entries()].map(([e, t]) => {
		let r = t[0], a = r.row.map((e) => n.nameOf(e)).join(" → ") + (r.track.key ? " · " + (r.track.name || r.track.type) : "");
		return /* @__PURE__ */ o("section", {
			key: e,
			className: "cut-group"
		}, /* @__PURE__ */ o("h3", null, a, " ", /* @__PURE__ */ o("small", null, t.length, "  ", i("cuts.countSuffix"))), t.map((e) => /* @__PURE__ */ o(c, {
			key: `${e.a.o.id}-${e.b.o.id}`,
			model: n,
			cut: e,
			project: s,
			frames: l
		})));
	}));
}
function u(e) {
	return a = e, o = e.React.createElement, e.React.Fragment, e.addStyle(r), {
		name: "cuts",
		label: "接缝",
		title: "同一条轨道里前后相接的画面：上一段的最后一帧和下一段的第一帧并排",
		handles: ["image", "video"],
		page: l,
		jumpPoints: (t, r) => n(e.util, t, r)
	};
}
//#endregion
export { u as default };

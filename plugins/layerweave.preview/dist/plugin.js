//#region plugins/layerweave.preview/src/frames.ts
function e(e) {
	let t = /^\s*(\d+(?:\.\d+)?)\s*([fs])\s*$/i.exec(e ?? "");
	if (!t) return null;
	let n = Number(t[1]), r = t[2].toLowerCase();
	return !(n > 0) || r === "f" && !Number.isInteger(n) ? null : {
		unit: r,
		n
	};
}
var t = (e) => `${e.n}${e.unit}`;
function n(e, t, n, r = 1e5) {
	if (!(e > 0) || !(n > 0)) return [];
	let i = Math.min(Math.max(0, t), e), a = [];
	for (let t = 0; a.length < r; t++) {
		let r = +(i + t * n).toFixed(6);
		if (r > e + 1e-9) break;
		a.push(r);
	}
	return a;
}
function r(e, t) {
	let n = 0, r = e.length - 1;
	if (r < 0) return -1;
	for (; n < r;) {
		let i = n + r + 1 >> 1;
		e[i] <= t + 1e-9 ? n = i : r = i - 1;
	}
	return n;
}
function i(e) {
	let { duration: t, from: i, step: a, fps: o, starts: s } = e;
	if (s?.length) {
		if (a.unit === "f") {
			let e = [];
			for (let t = Math.max(0, r(s, i)); t < s.length; t += a.n) e.push({
				t: s[t],
				frame: t
			});
			return e;
		}
		return n(t, i, a.n).map((e) => ({
			t: e,
			frame: r(s, e)
		}));
	}
	return n(t, i, a.unit === "f" ? a.n / Math.max(1, o) : a.n).map((e) => ({
		t: e,
		frame: Math.round(e * o)
	}));
}
var a = (e) => /<(animate|animateTransform|animateMotion|set)\b|@keyframes|animation(-name)?\s*:/i.test(e);
function o(e, t) {
	let n = 0;
	for (let t of e.matchAll(/\bdur\s*=\s*["']\s*([\d.]+)\s*(ms|s)?\s*["']/gi)) n = Math.max(n, Number(t[1]) / (t[2]?.toLowerCase() === "ms" ? 1e3 : 1));
	for (let t of e.matchAll(/animation(?:-duration)?\s*:[^;"'}]*?([\d.]+)(ms|s)\b/gi)) n = Math.max(n, Number(t[1]) / (t[2].toLowerCase() === "ms" ? 1e3 : 1));
	return n > 0 ? n : t;
}
var s = (e) => /\.(svg|gif|webp|apng)$/i.test(e.split(/[?#]/)[0]), c = "/* 预览插件的样式 */\n.preview { flex: 1; display: flex; min-height: 0; }\n.pv-list { width: 220px; flex: none; overflow: auto; border-right: 1px solid var(--line); background: var(--panel); padding: 8px 0; }\n.pv-list .hint { padding: 0 10px 6px; font-size: 12px; }\n.pv-item { padding: 3px 10px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.pv-item small { color: var(--dim); margin-left: 6px; font-size: 11px; }\n.pv-item:hover { background: #232733; }\n.pv-item.on { background: #2a3550; color: var(--sel); }\n.pv-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }\n.pv-bar { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }\n.pv-bar input[type=number] { width: 5em; padding: 1px 4px; }\n.pv-bar select { padding: 1px 4px; }\n.pv-bar .spacer { flex: 1; }\n.pv-status { margin: 8px 12px 0; }\n.pv-grid { flex: 1; overflow: auto; padding: 10px 12px; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; align-content: start; }\n.pv-grid figure { margin: 0; cursor: pointer; }\n.pv-grid .pv-cell { display: block; width: 100%; height: auto; background: #0d0f13; border: 1px solid var(--line); border-radius: 4px; overflow: hidden; }\n.pv-grid .pv-cell[data-state=failed] { border-color: #a33; }\n.pv-grid figcaption { font-size: 11px; color: var(--dim); margin-top: 2px; text-align: center; }\nbody.full .preview, body.full .pv-grid { overflow: visible; flex: none; }\n", l = (e, t) => u.t(e, t), u, d, f = [
	24,
	48,
	96
], p = [
	"1f",
	"2f",
	"5f",
	"0.5s",
	"1s"
], m = new URLSearchParams(location.search), h = class extends Error {
	ui;
	constructor(e) {
		super(e.key), this.ui = e;
	}
}, g = (e) => e instanceof h ? e.ui : e.message || String(e), _ = (e) => typeof e == "string" ? e : l(e.key) + (e.stage ? ": " + l(e.stage) : ""), v = (e) => e.name || (e.media?.source || "").split(/[\\/]/).pop() || l("object.unnamed", { value1: e.id }), y = (e) => u.util.mediaUrl(e.media.url, e.media?.source), b = (e) => e.media?.source || e.media?.url || "";
function x(e, t) {
	let { kindOf: n } = u.util, r = t.length ? new Set(t) : null;
	return e.filter((e) => e.media?.url && e.media.available !== !1 && (!r || r.has(e.layer.id)) && (n(e) === "video" || n(e) === "image" && s(b(e)))).sort((e, t) => Number(n(e) !== "video") - Number(n(t) !== "video"));
}
var S = (e, t, n) => Promise.race([e, new Promise((e, r) => setTimeout(() => r(new h({
	key: "preview.timeout",
	stage: n
})), t))]), C = (e, t) => new Promise((n, r) => {
	let i = () => {
		e.removeEventListener(t, i), e.removeEventListener("error", a), n();
	}, a = () => {
		e.removeEventListener(t, i), e.removeEventListener("error", a), r(new h({ key: "preview.unreadable" }));
	};
	e.addEventListener(t, i), e.addEventListener("error", a);
});
async function w(e) {
	if (!("requestVideoFrameCallback" in e)) return null;
	let t = [];
	try {
		await S(new Promise((n) => {
			let r = (i, a) => {
				t.push(a.mediaTime), t.length >= 6 ? n() : e.requestVideoFrameCallback(r);
			};
			e.requestVideoFrameCallback(r), e.play().catch(() => n());
		}), 1500, "preview.measureFps");
	} catch {}
	e.pause();
	let n = t.slice(1).map((e, n) => e - t[n]).filter((e) => e > .004 && e < .2).sort((e, t) => e - t);
	return n.length ? Math.round(1 / n[n.length >> 1]) : null;
}
async function T(e, t) {
	let n = y(e), { kindOf: r } = u.util;
	if (r(e) === "video") {
		t.muted = !0, t.preload = "auto", t.src = n, await S(C(t, "loadeddata"), 2e4, "preview.readVideo");
		let e = await w(t);
		return {
			kind: "video",
			duration: t.duration,
			fps: e,
			aspect: t.videoWidth / Math.max(1, t.videoHeight)
		};
	}
	let i = await fetch(n);
	if (!i.ok) throw new h({ key: "preview.unreadable" });
	if (/\.svg$/i.test(b(e).split(/[?#]/)[0]) || i.headers.get("content-type")?.includes("svg")) {
		let t = await i.text(), n = !a(t), r = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(t);
		return {
			kind: "svg",
			text: t,
			still: n,
			duration: o(t, Math.max(.5, e.end - e.begin) || 4),
			aspect: r ? Number(r[1]) / Math.max(1, Number(r[2])) : 1
		};
	}
	let s = globalThis.ImageDecoder;
	if (!s) return {
		kind: "error",
		message: { key: "preview.noDecoder" }
	};
	let c = i.headers.get("content-type") || {
		gif: "image/gif",
		webp: "image/webp",
		png: "image/png",
		apng: "image/apng"
	}[b(e).split(".").pop().toLowerCase()] || "image/gif", l = new s({
		data: await i.arrayBuffer(),
		type: c
	});
	await l.tracks.ready;
	let d = Math.min(5e3, l.tracks.selectedTrack?.frameCount ?? 1);
	if (d <= 1) return l.close(), {
		kind: "still",
		message: { key: "preview.staticImage" }
	};
	let f = [], p = 0, m = 1;
	for (let e = 0; e < d; e++) {
		let { image: t } = await l.decode({ frameIndex: e });
		f.push(+p.toFixed(6)), p += (t.duration ?? 1e5) / 1e6, e === 0 && (m = t.displayWidth / Math.max(1, t.displayHeight)), t.close();
	}
	return {
		kind: "frames",
		duration: p,
		starts: f,
		decoder: l,
		aspect: m
	};
}
function E(e) {
	let t = new DOMParser().parseFromString(e, "image/svg+xml");
	t.querySelectorAll("script").forEach((e) => e.remove()), t.querySelectorAll("*").forEach((e) => {
		for (let t of [...e.attributes]) (/^on/i.test(t.name) || /^\s*javascript:/i.test(t.value)) && e.removeAttribute(t.name);
	});
	let n = t.documentElement;
	return n.setAttribute("width", "100%"), n.setAttribute("height", "100%"), new XMLSerializer().serializeToString(n);
}
function D(e, t) {
	let n = e.querySelector("svg");
	n?.pauseAnimations?.(), n?.setCurrentTime?.(t);
	for (let n of e.getAnimations({ subtree: !0 })) n.pause(), n.currentTime = t * 1e3;
}
function O(e, t, n, r) {
	let { width: i, height: a } = e.canvas, o = Math.min(i / n, a / r), s = n * o, c = r * o;
	e.clearRect(0, 0, i, a), e.drawImage(t, (i - s) / 2, (a - c) / 2, s, c);
}
function k() {
	let { locale: n } = u.useI18n(), { React: r } = u, { model: a, selected: o, picked: s } = u.useView(), c = r.useMemo(() => a ? x(a.allObjects(), s) : [], [a, s]), [h, y] = r.useState(() => u.numParam("object") ?? null), [w, k] = r.useState(() => u.numParam("from") ?? 0), [A, j] = r.useState(() => e(m.get("step")) ?? {
		unit: "f",
		n: 1
	}), [M, N] = r.useState(() => u.numParam("fps")), [P, F] = r.useState(() => u.numParam("per") ?? 48), [I, L] = r.useState(() => u.numParam("page") ?? 1), [R, z] = r.useState(null), [B, V] = r.useState(0), H = r.useRef(null), U = r.useRef([]), W = r.useRef(/* @__PURE__ */ new Map());
	r.useEffect(() => {
		for (let [e, t] of W.current) {
			let n = U.current[e];
			n && (n.title = _(t));
		}
	}, [n]);
	let G = c.find((e) => e.id === h) ?? c.find((e) => e.id === o) ?? c[0] ?? null;
	r.useEffect(() => {
		if (!a) return;
		if (!G) {
			u.markReady();
			return;
		}
		let e = !0;
		z(null), V(0);
		let t = H.current ??= document.createElement("video");
		return T(G, t).then((t) => {
			e && z(t);
		}).catch((t) => {
			e && z({
				kind: "error",
				message: g(t)
			});
		}), () => {
			e = !1;
		};
	}, [a != null, G?.id]);
	let K = M ?? (R?.kind === "video" ? R.fps : null) ?? 24, q = r.useMemo(() => !R || R.kind === "still" || R.kind === "error" || R.kind === "svg" && R.still ? [] : i({
		duration: R.duration,
		from: w,
		step: A,
		fps: K,
		starts: R.kind === "frames" ? R.starts : void 0
	}), [
		R,
		w,
		A,
		K
	]), J = u.util.pageSlice(q, I, P);
	if (r.useEffect(() => {
		if (!R) return;
		if (!J.items.length) {
			u.markReady();
			return;
		}
		let e = !0;
		return V(0), W.current.clear(), (async () => {
			for (let t = 0; t < J.items.length && e; t++) {
				let n = J.items[t], r = U.current[t];
				if (r) {
					try {
						if (R.kind === "video") {
							let t = H.current;
							if (t.currentTime = Math.min(n.t, Math.max(0, R.duration - .001)), await S(C(t, "seeked"), 8e3, "preview.seek"), !e) break;
							O(r.getContext("2d"), t, t.videoWidth, t.videoHeight), r.dataset.t = String(t.currentTime);
						} else if (R.kind === "svg") r.innerHTML = E(R.text), D(r, n.t);
						else if (R.kind === "frames") {
							let { image: t } = await R.decoder.decode({ frameIndex: n.frame });
							e && O(r.getContext("2d"), t, t.displayWidth, t.displayHeight), t.close();
						}
						r.dataset.state = "ready";
					} catch (e) {
						r.dataset.state = "failed", W.current.set(t, g(e)), r.title = _(g(e));
					}
					e && V(t + 1);
				}
			}
			e && u.markReady();
		})(), () => {
			e = !1;
		};
	}, [
		R,
		J.page,
		P,
		q
	]), !a) return null;
	let { fmt: Y } = u.util, { Pager: X } = u.components, Z = R && "aspect" in R && R.aspect > 0 ? R.aspect : 16 / 9, Q = G ? R ? R.kind === "error" || R.kind === "still" ? _(R.message) : R.kind === "svg" && R.still ? l("preview.staticSvg") : B < J.items.length ? l("preview.progress", {
		value1: B,
		value2: J.items.length
	}) : "" : l("preview.reading") : s.length ? l("preview.emptySelection") : l("preview.emptyProject");
	return /* @__PURE__ */ d("main", { className: "preview" }, /* @__PURE__ */ d("aside", { className: "pv-list" }, /* @__PURE__ */ d("div", { className: "hint" }, s.length ? l("preview.selectedLayers") : l("filters.all"), " ", c.length, "  ", l("preview.countSuffix")), c.map((e) => /* @__PURE__ */ d("div", {
		key: e.id,
		className: `pv-item${e.id === G?.id ? " on" : ""}`,
		title: `#${e.id} ${b(e)}`,
		onClick: () => {
			y(e.id), L(1);
		}
	}, v(e), /* @__PURE__ */ d("small", null, e.layer.name)))), /* @__PURE__ */ d("section", { className: "pv-main" }, /* @__PURE__ */ d("div", { className: "pv-bar" }, /* @__PURE__ */ d("strong", null, G ? v(G) : l("preview.select")), /* @__PURE__ */ d("label", null, l("preview.start"), " ", /* @__PURE__ */ d("input", {
		type: "number",
		min: 0,
		step: .1,
		value: w,
		onChange: (e) => {
			k(Math.max(0, Number(e.target.value) || 0)), L(1);
		}
	}), "  ", l("time.seconds")), /* @__PURE__ */ d("label", null, l("preview.interval"), " ", /* @__PURE__ */ d("select", {
		value: t(A),
		onChange: (t) => {
			j(e(t.target.value)), L(1);
		}
	}, [.../* @__PURE__ */ new Set([...p, t(A)])].map((e) => /* @__PURE__ */ d("option", {
		key: e,
		value: e
	}, e === "1f" ? l("preview.everyFrame") : e.endsWith("f") ? l("preview.everyFrames", { value1: parseInt(e) }) : l("preview.everySeconds", { value1: parseFloat(e) }))))), R?.kind !== "frames" && /* @__PURE__ */ d("label", { title: l("preview.fpsHint") }, l("preview.fps"), " ", /* @__PURE__ */ d("input", {
		type: "number",
		min: 1,
		max: 240,
		value: K,
		onChange: (e) => {
			N(Math.max(1, Number(e.target.value) || 24)), L(1);
		}
	})), R && "duration" in R && /* @__PURE__ */ d("span", { className: "hint" }, l("preview.total"), " ", Y(R.duration, "秒")), /* @__PURE__ */ d("span", { className: "spacer" }), /* @__PURE__ */ d(X, {
		total: q.length,
		page: J.page,
		per: P,
		onPage: L,
		sizes: f,
		onPer: (e) => {
			F(e), L(1);
		}
	})), Q && /* @__PURE__ */ d("p", { className: "hint pv-status" }, Q), /* @__PURE__ */ d("div", { className: "pv-grid" }, J.items.map((e, t) => /* @__PURE__ */ d("figure", {
		key: `${G?.id}:${e.t}:${e.frame}`,
		onClick: () => G && u.selectObject(G.id)
	}, R?.kind === "svg" ? /* @__PURE__ */ d("div", {
		className: "pv-cell",
		ref: (e) => {
			U.current[t] = e;
		},
		style: { aspectRatio: String(Z) }
	}) : /* @__PURE__ */ d("canvas", {
		className: "pv-cell",
		ref: (e) => {
			U.current[t] = e;
		},
		width: Math.round(320 * Math.min(2, devicePixelRatio)),
		height: Math.round(320 * Math.min(2, devicePixelRatio) / Z),
		style: { aspectRatio: String(Z) }
	}), /* @__PURE__ */ d("figcaption", null, l("preview.frameCaption", {
		time: Y(e.t, "秒"),
		frame: e.frame
	})))))));
}
function A(e) {
	return u = e, d = e.React.createElement, e.React.Fragment, e.addStyle(c), {
		name: "preview",
		label: "预览",
		title: "把视频、会动的 SVG、GIF 的帧罗列出来：默认逐帧，可以改开始时刻和间隔；一页一屏",
		handles: ["video", "image"],
		page: k
	};
}
//#endregion
export { A as default };

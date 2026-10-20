//#region plugins/layerweave.web/src/source.ts
var e = class extends Error {
	key;
	constructor(e) {
		super(e), this.key = e;
	}
};
function t(t) {
	let n = t.mode === "html" ? t.value : t.value.trim();
	if (!n.trim()) throw new e("web.emptySource");
	if (t.mode === "url") {
		let t;
		try {
			t = new URL(n);
		} catch {
			throw new e("web.httpOnly");
		}
		if (!["http:", "https:"].includes(t.protocol)) throw new e("web.httpOnly");
		return {
			mode: "url",
			value: t.href
		};
	}
	return {
		...t,
		value: n,
		root: t.root?.trim() || void 0
	};
}
function n(n) {
	let r = [
		"url",
		"html",
		"file",
		"object"
	].filter((e) => n.has(e));
	if (r.length > 1) throw new e("web.oneSource");
	if (!r.length) return null;
	let i = r[0], a = n.get(i);
	if (i === "object") {
		let t = Number(a);
		if (!Number.isInteger(t) || t < 1) throw new e("web.objectMissing");
		return t;
	}
	return t({
		mode: i,
		value: a,
		root: n.get("resource_root") || void 0
	});
}
function r(e) {
	if (!e || typeof e != "object") return null;
	let t = e;
	return typeof t.html == "string" && t.html.trim() ? {
		mode: "html",
		value: t.html
	} : typeof t.url == "string" && /^https?:\/\//i.test(t.url) ? {
		mode: "url",
		value: t.url
	} : typeof t.source == "string" ? /^https?:\/\//i.test(t.source) ? {
		mode: "url",
		value: t.source
	} : /\.html?$/i.test(t.source) ? {
		mode: "file",
		value: t.source,
		root: typeof t.resource_root == "string" ? t.resource_root : void 0
	} : null : null;
}
//#endregion
//#region plugins/layerweave.web/src/web.css?raw
var i = ".lw-web { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }\n.lw-web-tools { flex: none; padding: 12px 16px; background: var(--panel, #1c2028); border-bottom: 1px solid var(--line, #343b48); }\n.lw-web-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }\n.lw-web-row label { display: flex; gap: 8px; align-items: center; font-size: 13px; }\n.lw-web-address { flex: 1; min-width: 260px; }\n.lw-web-tools input, .lw-web-tools select { padding: 5px 8px; }\n.lw-web-tools textarea { display: block; width: 100%; height: 110px; resize: vertical; margin-top: 10px; padding: 10px; font: 13px/1.5 Consolas, monospace; color: inherit; background: #141820; border: 1px solid #343b48; border-radius: 5px; }\n.lw-web-secondary { margin-top: 8px; color: var(--dim, #adb7c4); }\n.lw-web-root input { width: 300px; max-width: 45vw; }\n.lw-web-status { margin-left: auto; font-size: 12px; }\n.lw-web iframe { display: block; flex: 1; width: 100%; min-height: 320px; border: 0; background: white; color-scheme: normal; }\n.lw-web-hint { flex: none; margin: 0; padding: 6px 16px; font-size: 12px; color: var(--dim, #adb7c4); }\n.lw-web-error { color: #ffb4b4; margin: 14px 18px; }\n.lw-web-empty { margin: 40px auto; padding: 0 24px; max-width: 720px; line-height: 1.8; color: var(--dim, #adb7c4); }\n", a, o, s, c = (e) => a.t(e);
function l() {
	a.useI18n();
	let { React: i } = a, { model: l, selected: u } = a.useView(), [d, f] = i.useState("url"), [p, m] = i.useState(""), [h, g] = i.useState(""), [_, v] = i.useState(null), [y, b] = i.useState(null), [x, S] = i.useState(!1), C = i.useRef(!1), w = i.useRef(0), [T, E] = i.useState(""), D = i.useMemo(() => l?.allObjects().filter((e) => r(e.information)) ?? [], [l]), O = async (e) => {
		let n = ++w.current;
		b(null), S(!0), v(null);
		try {
			e = t(e), f(e.mode), m(e.value), g(e.root ?? "");
			let r = e.mode === "file" ? (await a.openDocument(e.value, e.root)).url : e.mode === "url" ? e.value : void 0;
			if (n !== w.current) return;
			v({
				source: e,
				url: r,
				html: e.mode === "html" ? e.value : void 0,
				serial: n
			});
		} catch (e) {
			n === w.current && (S(!1), b(e instanceof Error ? e : Error(String(e))));
		}
	};
	i.useEffect(() => {
		if (!C.current) try {
			let t = n(new URLSearchParams(location.search));
			if ((typeof t == "number" || t === null) && !l) return;
			if (C.current = !0, typeof t == "number") {
				let n = l?.allObjects().find((e) => e.id === t), i = r(n?.information);
				if (!i) throw new e("web.objectMissing");
				E(String(t)), O(i);
			} else if (t) O(t);
			else {
				let e = r(D.find((e) => e.id === u)?.information);
				e ? (E(String(u)), O(e)) : a.markReady();
			}
		} catch (e) {
			C.current = !0, b(e);
		}
	}, [l, u]), i.useEffect(() => () => {
		w.current++;
	}, []);
	let k = i.useMemo(() => _?.html === void 0 ? null : URL.createObjectURL(new Blob([_.html], { type: "text/html;charset=utf-8" })), [_?.html]);
	i.useEffect(() => () => {
		k && URL.revokeObjectURL(k);
	}, [k]);
	let A = y instanceof e ? c(y.key) : y?.message;
	if (y && a.capture) throw Error(A);
	let j = c(d === "url" ? "web.urlHint" : d === "file" ? "web.fileHint" : "web.htmlHint"), M = "allow-scripts allow-forms allow-popups allow-downloads" + (_?.source.mode === "url" && new URL(_.url, location.href).origin !== location.origin ? " allow-same-origin" : "");
	return /* @__PURE__ */ o("main", { className: "lw-web" }, /* @__PURE__ */ o("form", {
		className: "lw-web-tools",
		onSubmit: (e) => {
			e.preventDefault(), O({
				mode: d,
				value: p,
				root: h
			});
		}
	}, /* @__PURE__ */ o("div", { className: "lw-web-row" }, /* @__PURE__ */ o("label", null, c("web.source"), " ", /* @__PURE__ */ o("select", {
		"aria-label": c("web.source"),
		value: d,
		onChange: (e) => {
			f(e.target.value), m("");
		}
	}, /* @__PURE__ */ o("option", { value: "url" }, c("web.url")), /* @__PURE__ */ o("option", { value: "html" }, c("web.html")), /* @__PURE__ */ o("option", { value: "file" }, c("web.file")))), d !== "html" && /* @__PURE__ */ o("input", {
		className: "lw-web-address",
		"aria-label": c("web.address"),
		value: p,
		placeholder: j,
		onChange: (e) => m(e.target.value)
	}), /* @__PURE__ */ o("button", { type: "submit" }, c("web.open")), /* @__PURE__ */ o("button", {
		type: "button",
		disabled: !_ || x,
		onClick: () => _ && void O(_.source)
	}, c("web.reload")), _?.url && /* @__PURE__ */ o("a", {
		className: "lw-web-external",
		href: _.url,
		target: "_blank",
		rel: "noopener noreferrer"
	}, c("web.external")), k && /* @__PURE__ */ o("a", {
		href: k,
		download: "page.html"
	}, c("web.download"))), d === "html" && /* @__PURE__ */ o("textarea", {
		"aria-label": c("web.html"),
		value: p,
		placeholder: j,
		spellCheck: !1,
		onChange: (e) => m(e.target.value)
	}), /* @__PURE__ */ o("div", { className: "lw-web-row lw-web-secondary" }, d === "file" && /* @__PURE__ */ o("label", { className: "lw-web-root" }, c("web.resourceRoot"), " ", /* @__PURE__ */ o("input", {
		value: h,
		"aria-label": c("web.resourceRoot"),
		placeholder: c("web.rootHint"),
		onChange: (e) => g(e.target.value)
	})), D.length > 0 && /* @__PURE__ */ o("label", null, c("web.projectObject"), " ", /* @__PURE__ */ o("select", {
		value: T,
		"aria-label": c("web.projectObject"),
		onChange: (e) => {
			E(e.target.value);
			let t = r(D.find((t) => String(t.id) === e.target.value)?.information);
			t && O(t);
		}
	}, /* @__PURE__ */ o("option", { value: "" }, c("web.choose")), D.map((e) => /* @__PURE__ */ o("option", {
		key: e.id,
		value: e.id
	}, "#", e.id, " ", e.name || e.media?.source || c("web.unnamed"))))), /* @__PURE__ */ o("span", {
		className: "lw-web-status",
		role: "status"
	}, x ? c("web.loading") : _ ? c("web.opened") : ""))), A && /* @__PURE__ */ o("p", {
		className: "lw-web-error",
		role: "alert"
	}, A), _ ? /* @__PURE__ */ o(s, null, _.source.mode === "url" && /* @__PURE__ */ o("p", { className: "lw-web-hint" }, c("web.embedHint")), /* @__PURE__ */ o("iframe", {
		key: _.serial,
		title: c("plugin.label"),
		src: _.url,
		srcDoc: _.html,
		sandbox: M,
		referrerPolicy: "no-referrer",
		onLoad: () => {
			S(!1), a.markReady();
		},
		onError: () => {
			S(!1), b(new e("web.loadError"));
		}
	})) : !x && !y && /* @__PURE__ */ o("p", { className: "lw-web-empty" }, c("web.start")));
}
function u(e) {
	return a = e, o = e.React.createElement, s = e.React.Fragment, e.addStyle(i), {
		label: e.t("plugin.label"),
		title: e.t("plugin.title"),
		page: l
	};
}
//#endregion
export { u as default };

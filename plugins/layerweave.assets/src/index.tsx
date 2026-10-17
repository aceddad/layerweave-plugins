const tr: PluginHost['t'] = (key, values) => host.t(key, values);
// 点一下回到画布上的对应位置。按种类筛，分页（一页 60 张，一屏左右；地址 page=、per= 是初始的页码和张数）。
// 只用宿主给的东西（host）：React 是宿主那一份，JSX 编译成 h(...)，h 在插件被加载时从 host.React 拿
import type {PluginHost, ViewPlugin} from '../../../sdk/host-api-3';
import type {ObjWithLayer} from '../../../sdk/host-api-3';
import css from './assets.css?raw';

let host: PluginHost;
let h: PluginHost['React']['createElement'];
let Fragment: PluginHost['React']['Fragment'];

const FILTERS = ['all', 'image', 'video', 'audio', 'text'];
const LABEL: Record<string, string> = {all: "filters.all", image: "kind.image", video: "kind.video", audio: "kind.audio", text: "kind.text"};
const COLOR: Record<string, string> = {image: 'var(--image)', video: 'var(--video)', audio: 'var(--audio)', text: 'var(--text-c)'};
const SIZES = [30, 60, 120];

function Tile({o, project, frames, unit}: {o: ObjWithLayer; project: number; frames: boolean; unit: string}) {
  host.useI18n();
  const {Thumb, Frame, Waveform} = host.components, {kindOf, mediaUrl, fmt} = host.util;
  const k = kindOf(o), missing = !!o.media && !o.media.available;
  return (
    <div className="tile" title={o.media?.source ?? ''} onClick={() => host.selectObject(o.id)}>
      <div className="thumb">
        {missing ? tr("media.missing")
          : k === 'image' ? <Thumb project={project} o={o} width={320} frames={frames} />
          : k === 'video' ? <Frame project={project} o={o} at={0.1} frames={frames} />
          : k === 'audio' ? <Waveform url={mediaUrl(o.media!.url!, o.media?.source)} className="tile-wave" />
          : k === 'text' ? <div className="txt">{o.text}</div> : null}
        <span className="badge" style={{background: COLOR[k] ?? 'var(--other)'}}>{LABEL[k] ? tr(LABEL[k]) : k}</span>
      </div>
      <div className="info">
        <div className="nm">{o.name || (o.media?.source || '').split(/[\\/]/).pop() || tr("object.unnamed", {value1: o.id})}</div>
        <div className="meta">{o.layer.name || tr("layer.unnamed", {value1: o.layer.id})} · {fmt(o.begin, unit)} – {fmt(o.end, unit)}</div>
      </div>
    </div>
  );
}

function AssetsPage() {
  host.useI18n();
  const {React} = host, {model, project, frames} = host.useView();
  const [kind, setKind] = React.useState('all');
  const [page, setPage] = React.useState(() => host.numParam('page') ?? 1);
  const [per, setPer] = React.useState(() => host.numParam('per') ?? 60);
  React.useEffect(() => { if (model) host.markReady(); }, [model]);
  if (!model || project == null) return null;
  const {kindOf, pageSlice} = host.util, {Pager} = host.components;
  const all = model.allObjects().filter((o) => o.layer.role !== 'note' && (kind === 'all' ? kindOf(o) !== 'other' : kindOf(o) === kind));
  const shown = pageSlice(all, page, per);
  return (
    <main className="assets-view">
      <div className="filters">
        {FILTERS.map((f) => <button key={f} className={kind === f ? 'on' : ''} onClick={() => { setKind(f); setPage(1); }}>{tr(LABEL[f])}</button>)}
        <span className="spacer" />
        <Pager total={all.length} page={shown.page} per={per} onPage={setPage} sizes={SIZES} onPer={(n) => { setPer(n); setPage(1); }} />
      </div>
      <div className="grid">
        {!all.length && <p className="hint">{tr("assets.empty")}</p>}
        {shown.items.map((o) => <Tile key={o.id} o={o} project={project} frames={frames} unit={model.unitOfRoot(o.layer.root)} />)}
      </div>
    </main>
  );
}

export default function assets(given: PluginHost): ViewPlugin {
  host = given;
  h = given.React.createElement;
  Fragment = given.React.Fragment;
  given.addStyle(css);
  return {name: 'assets', label: '一览', title: '按种类列出项目里所有的对象：图片、视频、音频、文字……分页；点一下回到画布上的位置', page: AssetsPage};
}

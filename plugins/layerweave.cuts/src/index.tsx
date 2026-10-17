const tr: PluginHost['t'] = (key, values) => host.t(key, values);
// 接缝插件（视图的第一个插件）：同一条轨道里前后相接的图片和视频，上一段的最后一帧和下一段的第一帧并排，用来查衔接——
// 比如上一段球落在地上，下一段却从桌上开始。另外给键盘 [ ] 提供跳转点（接缝的时刻）。
// 只用宿主给的东西（host）：React 是宿主那一份，JSX 编译成 h(...)，h 在插件被加载时从 host.React 拿
import type {PluginHost, ViewPlugin} from '../../../sdk/host-api-3';
import type {Model} from '../../../sdk/host-api-3';
import {cutGroupKey, cutList, cutPoints} from './cuts';
import type {Cut, CutItem} from './cuts';
import css from './cuts.css?raw';

let host: PluginHost;
let h: PluginHost['React']['createElement'];
let Fragment: PluginHost['React']['Fragment'];

function Shot({model, it, end, project, frames}: {model: Model; it: CutItem; end: boolean; project: number; frames: boolean}) {
  host.useI18n();
  const {Thumb, Frame} = host.components, {kindOf, lastAt, isSec} = host.util;
  const o = it.o, unit = model.unitOfRoot(it.root);
  if (o.media && !o.media.available) return <div className="shot missing">{tr("media.missing")}<br />{o.media.source}</div>;
  if (!o.media?.url) return <div className="shot missing">{tr("media.noFile")}</div>;
  if (kindOf(o) === 'image') return <div className="shot"><Thumb project={project} o={o} width={640} frames={frames} /></div>;
  return <div className="shot"><Frame project={project} o={o} at={end ? lastAt(o, isSec(unit)) : 0.05} frames={frames} /></div>;
}

function CutRow({model, cut, project, frames}: {model: Model; cut: Cut; project: number; frames: boolean}) {
  host.useI18n();
  const {kindOf, fmt, fmtSpan} = host.util;
  const unit = model.unitOfRoot(cut.a.root);
  const what = (it: CutItem, end: boolean) => (kindOf(it.o) === 'video' ? (end ? tr("frame.last") : tr("frame.first")) : tr("kind.image"));
  const when = (it: CutItem, t: number) => fmt(t - it.offset, model.unitOfRoot(it.root)) + (it.offset ? tr("cut.boardTime", {value1: fmt(t, unit)}) : '');
  const gap = Math.abs(cut.gap) < 1e-6 ? tr("cut.adjacent") : cut.gap > 0 ? tr("cut.gap", {value1: fmtSpan(cut.gap, unit)}) : tr("cut.overlap", {value1: fmtSpan(-cut.gap, unit)});
  const name = (it: CutItem) => `#${it.o.id} ${it.o.name || (it.o.media?.source || '').split(/[\\/]/).pop()}`;
  return (
    <div className="cut" onClick={() => host.selectObject(cut.b.o.id)}>
      <figure><Shot model={model} it={cut.a} end project={project} frames={frames} />
        <figcaption>{name(cut.a)}  {tr("cut.of")}{what(cut.a, true)}<br /><small>{tr("cut.endsAt")} {when(cut.a, cut.a.end)}</small></figcaption></figure>
      <div className="cut-mid"><b>→</b><small>{gap}</small>
        {cut.a.root !== cut.b.root && <small className="cross">{tr("cut.crossSegment")}{model.nameOf(cut.a.root)} → {model.nameOf(cut.b.root)}</small>}</div>
      <figure><Shot model={model} it={cut.b} end={false} project={project} frames={frames} />
        <figcaption>{name(cut.b)}  {tr("cut.of")}{what(cut.b, false)}<br /><small>{tr("cut.beginsAt")} {when(cut.b, cut.b.begin)}</small></figcaption></figure>
    </div>
  );
}

function CutsPage() {
  host.useI18n();
  const {model, boards, project, frames} = host.useView();
  host.React.useEffect(() => { if (model) host.markReady(); }, [model]);
  if (!model || project == null) return null;
  const cuts = cutList(host.util, model, boards, {board: host.numParam('board'), begin: host.numParam('begin'), end: host.numParam('end')});
  const groups = new Map<string, Cut[]>();
  for (const c of cuts) { const key = cutGroupKey(host.util, c); if (!groups.has(key)) groups.set(key, []); groups.get(key)!.push(c); }
  return (
    <main className="cuts-view">
      {!cuts.length && <p className="hint">{tr("cuts.empty")}</p>}
      {[...groups.entries()].map(([key, list]) => {
        const c = list[0], where = c.row.map((r) => model.nameOf(r)).join(' → ') + (c.track.key ? ' · ' + (c.track.name || c.track.type) : '');
        return <section key={key} className="cut-group">
          <h3>{where} <small>{list.length}  {tr("cuts.countSuffix")}</small></h3>
          {list.map((cut) => <CutRow key={`${cut.a.o.id}-${cut.b.o.id}`} model={model} cut={cut} project={project} frames={frames} />)}
        </section>;
      })}
    </main>
  );
}

export default function cuts(given: PluginHost): ViewPlugin {
  host = given;
  h = given.React.createElement;
  Fragment = given.React.Fragment;
  given.addStyle(css);
  return {
    name: 'cuts', label: '接缝', title: '同一条轨道里前后相接的画面：上一段的最后一帧和下一段的第一帧并排',
    handles: ['image', 'video'], page: CutsPage,
    jumpPoints: (model, board) => cutPoints(given.util, model, board),
  };
}

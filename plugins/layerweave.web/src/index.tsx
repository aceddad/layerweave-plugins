import type {PluginHost, ViewPlugin} from '../../../sdk/host-api-3';
import {checked, fromInformation, fromQuery, SourceError} from './source';
import type {Mode, Source} from './source';
import css from './web.css?raw';

let host: PluginHost;
let h: PluginHost['React']['createElement'];
let Fragment: PluginHost['React']['Fragment'];
const tr = (key: string) => host.t(key);
type Frame = {source: Source; url?: string; html?: string; serial: number};

function WebPage() {
  host.useI18n();
  const {React} = host, {model, selected} = host.useView();
  const [mode, setMode] = React.useState<Mode>('url');
  const [value, setValue] = React.useState('');
  const [root, setRoot] = React.useState('');
  const [frame, setFrame] = React.useState<Frame | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(false);
  const initialized = React.useRef(false), serial = React.useRef(0);
  const [object, setObject] = React.useState('');
  const candidates = React.useMemo(() => model?.allObjects().filter(o => fromInformation(o.information)) ?? [], [model]);

  const open = async (source: Source) => {
    const request = ++serial.current;
    setError(null); setLoading(true); setFrame(null);
    try {
      source = checked(source);
      setMode(source.mode); setValue(source.value); setRoot(source.root ?? '');
      const url = source.mode === 'file' ? (await host.openDocument(source.value, source.root)).url
        : source.mode === 'url' ? source.value : undefined;
      if (request !== serial.current) return;
      setFrame({source, url, html: source.mode === 'html' ? source.value : undefined, serial: request});
    } catch (e) {
      if (request === serial.current) { setLoading(false); setError(e instanceof Error ? e : new Error(String(e))); }
    }
  };

  React.useEffect(() => {
    if (initialized.current) return;
    try {
      const initial = fromQuery(new URLSearchParams(location.search));
      if ((typeof initial === 'number' || initial === null) && !model) return;
      initialized.current = true;
      if (typeof initial === 'number') {
        const o = model?.allObjects().find(o => o.id === initial);
        const source = fromInformation(o?.information);
        if (!source) throw new SourceError('web.objectMissing');
        setObject(String(initial)); void open(source);
      } else if (initial) {
        void open(initial);
      } else {
        const source = fromInformation(candidates.find(o => o.id === selected)?.information);
        if (source) { setObject(String(selected)); void open(source); }
        else host.markReady();
      }
    } catch (e) { initialized.current = true; setError(e as Error); }
  }, [model, selected]);
  React.useEffect(() => () => { serial.current++; }, []);

  const download = React.useMemo(() => frame?.html !== undefined
    ? URL.createObjectURL(new Blob([frame.html], {type: 'text/html;charset=utf-8'})) : null, [frame?.html]);
  React.useEffect(() => () => { if (download) URL.revokeObjectURL(download); }, [download]);
  const message = error instanceof SourceError ? tr(error.key) : error?.message;
  if (error && host.capture) throw new Error(message);
  const placeholder = tr(mode === 'url' ? 'web.urlHint' : mode === 'file' ? 'web.fileHint' : 'web.htmlHint');
  const sandbox = 'allow-scripts allow-forms allow-popups allow-downloads' +
    (frame?.source.mode === 'url' && new URL(frame.url!, location.href).origin !== location.origin ? ' allow-same-origin' : '');

  return <main className="lw-web">
    <form className="lw-web-tools" onSubmit={e => { e.preventDefault(); void open({mode, value, root}); }}>
      <div className="lw-web-row">
        <label>{tr('web.source')} <select aria-label={tr('web.source')} value={mode}
          onChange={e => { setMode(e.target.value as Mode); setValue(''); }}>
          <option value="url">{tr('web.url')}</option><option value="html">{tr('web.html')}</option><option value="file">{tr('web.file')}</option>
        </select></label>
        {mode !== 'html' && <input className="lw-web-address" aria-label={tr('web.address')} value={value} placeholder={placeholder}
          onChange={e => setValue(e.target.value)} />}
        <button type="submit">{tr('web.open')}</button>
        <button type="button" disabled={!frame || loading} onClick={() => frame && void open(frame.source)}>{tr('web.reload')}</button>
        {frame?.url && <a className="lw-web-external" href={frame.url} target="_blank" rel="noopener noreferrer">{tr('web.external')}</a>}
        {download && <a href={download} download="page.html">{tr('web.download')}</a>}
      </div>
      {mode === 'html' && <textarea aria-label={tr('web.html')} value={value} placeholder={placeholder}
        spellCheck={false} onChange={e => setValue(e.target.value)} />}
      <div className="lw-web-row lw-web-secondary">
        {mode === 'file' && <label className="lw-web-root">{tr('web.resourceRoot')} <input value={root}
          aria-label={tr('web.resourceRoot')} placeholder={tr('web.rootHint')} onChange={e => setRoot(e.target.value)} /></label>}
        {candidates.length > 0 && <label>{tr('web.projectObject')} <select value={object}
          aria-label={tr('web.projectObject')} onChange={e => {
            setObject(e.target.value);
            const source = fromInformation(candidates.find(o => String(o.id) === e.target.value)?.information);
            if (source) void open(source);
          }}>
          <option value="">{tr('web.choose')}</option>
          {candidates.map(o => <option key={o.id} value={o.id}>#{o.id} {o.name || o.media?.source || tr('web.unnamed')}</option>)}
        </select></label>}
        <span className="lw-web-status" role="status">{loading ? tr('web.loading') : frame ? tr('web.opened') : ''}</span>
      </div>
    </form>
    {message && <p className="lw-web-error" role="alert">{message}</p>}
    {frame ? <>
      {frame.source.mode === 'url' && <p className="lw-web-hint">{tr('web.embedHint')}</p>}
      <iframe key={frame.serial} title={tr('plugin.label')} src={frame.url} srcDoc={frame.html}
        sandbox={sandbox}
        referrerPolicy="no-referrer" onLoad={() => { setLoading(false); host.markReady(); }}
        onError={() => { setLoading(false); setError(new SourceError('web.loadError')); }} />
    </> : !loading && !error && <p className="lw-web-empty">{tr('web.start')}</p>}
  </main>;
}

export default function web(given: PluginHost): ViewPlugin {
  host = given; h = given.React.createElement; Fragment = given.React.Fragment;
  given.addStyle(css);
  return {label: given.t('plugin.label'), title: given.t('plugin.title'), page: WebPage};
}

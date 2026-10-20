export type Mode = 'url' | 'html' | 'file';
export type Source = {mode: Mode; value: string; root?: string};
export class SourceError extends Error {
  constructor(readonly key: string) { super(key); }
}

export function checked(source: Source): Source {
  const value = source.mode === 'html' ? source.value : source.value.trim();
  if (!value.trim()) throw new SourceError('web.emptySource');
  if (source.mode === 'url') {
    let url: URL;
    try { url = new URL(value); } catch { throw new SourceError('web.httpOnly'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new SourceError('web.httpOnly');
    return {mode: 'url', value: url.href};
  }
  return {...source, value, root: source.root?.trim() || undefined};
}

export function fromQuery(query: URLSearchParams): Source | number | null {
  const keys = ['url', 'html', 'file', 'object'].filter((key) => query.has(key));
  if (keys.length > 1) throw new SourceError('web.oneSource');
  if (!keys.length) return null;
  const key = keys[0], value = query.get(key)!;
  if (key === 'object') {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) throw new SourceError('web.objectMissing');
    return id;
  }
  return checked({mode: key as Mode, value, root: query.get('resource_root') || undefined});
}

export function fromInformation(info: unknown): Source | null {
  if (!info || typeof info !== 'object') return null;
  const data = info as Record<string, unknown>;
  if (typeof data.html === 'string' && data.html.trim()) return {mode: 'html', value: data.html};
  if (typeof data.url === 'string' && /^https?:\/\//i.test(data.url)) return {mode: 'url', value: data.url};
  if (typeof data.source !== 'string') return null;
  if (/^https?:\/\//i.test(data.source)) return {mode: 'url', value: data.source};
  if (/\.html?$/i.test(data.source)) return {mode: 'file', value: data.source,
    root: typeof data.resource_root === 'string' ? data.resource_root : undefined};
  return null;
}

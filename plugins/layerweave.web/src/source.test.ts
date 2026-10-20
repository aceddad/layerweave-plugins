import {describe, expect, it} from 'vitest';
import {checked, fromInformation, fromQuery} from './source';

describe('web source routing', () => {
  it('retains HTML markup and local Windows paths', () => {
    const html = '<!doctype html><p>阅读</p>';
    expect(fromQuery(new URLSearchParams({html}))).toEqual({mode: 'html', value: html, root: undefined});
    expect(fromQuery(new URLSearchParams({file: 'D:\\资料\\index.html', resource_root: 'D:\\资料'})))
      .toEqual({mode: 'file', value: 'D:\\资料\\index.html', root: 'D:\\资料'});
  });
  it('keeps HTTPS query strings and fragments', () => {
    expect(checked({mode: 'url', value: ' https://example.org/?a=1&b=2#part '}))
      .toEqual({mode: 'url', value: 'https://example.org/?a=1&b=2#part'});
  });
  it('does not interpret executable schemes as websites', () => {
    for (const value of ['javascript:alert(1)', 'data:text/html,hello', 'file:///C:/test.html', 'example.org'])
      expect(() => checked({mode: 'url', value})).toThrow('web.httpOnly');
  });
  it('reports conflicting sources and invalid object targets', () => {
    expect(() => fromQuery(new URLSearchParams({url: 'https://example.org', file: 'index.html'}))).toThrow('web.oneSource');
    for (const object of ['0', '-2', '1.2', 'abc']) expect(() => fromQuery(new URLSearchParams({object}))).toThrow('web.objectMissing');
    expect(fromQuery(new URLSearchParams({object: '17'}))).toBe(17);
    expect(fromQuery(new URLSearchParams())).toBeNull();
  });
  it('reads existing object information without a new object type', () => {
    expect(fromInformation({source: 'assets/report.HTML', resource_root: 'assets'}))
      .toEqual({mode: 'file', value: 'assets/report.HTML', root: 'assets'});
    expect(fromInformation({source: 'https://example.org/'})).toEqual({mode: 'url', value: 'https://example.org/'});
    expect(fromInformation({html: '<b>body</b>', source: 'report.html'})).toEqual({mode: 'html', value: '<b>body</b>'});
    expect(fromInformation({source: 'image.png'})).toBeNull();
  });
});

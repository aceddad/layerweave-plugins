// 插件的纯计算只消费宿主契约；不引用宿主源码。真实宿主协作另由 Python 浏览器测试覆盖。
import {describe, expect, it} from 'vitest';
import type {Board, Model, Obj, PluginHost, Track} from '../../../sdk/host-api-3';
import {cutList, cutPoints} from './cuts';

const board = (rows: number[][]): Board => ({rows, x: 0, y: 0, pps: null});
const obj = (id: number, begin: number, end: number, type = 'image') => ({id, begin, end, type} as Obj);
const util = {
  kindOf: (o: Obj) => o.type,
  keyOf: (b: Board) => b.rows[0][0], rootsOf: (b: Board) => b.rows.flat(),
  lanes: (items: unknown[]) => items.map(() => 0),
} as Pick<PluginHost['util'], 'kindOf' | 'keyOf' | 'rootsOf' | 'lanes'>;
const fixture = (overlap = false, folded = false) => {
  const track = {key: 'art', parts: overlap
    ? [{layer: {objects: [obj(3, 0, 3), obj(4, 1, 2), obj(5, 3, 4)]}, seg: {root: 1, offset: 0}}]
    : [{layer: {objects: [obj(3, 1, 4), obj(4, 4, 8, 'video'), obj(5, 9, 10), obj(6, 0, 5, 'text'), obj(7, 0, 5, 'audio')]}, seg: {root: 1, offset: 0}},
       {layer: {objects: [obj(14, 0, 4)]}, seg: {root: 10, offset: 10}}]} as unknown as Track;
  return {visibleTracks: (row: number[]) => row.includes(1) ? [track] : [], foldOf: () => folded ? {by: 'ai'} : null} as unknown as Model;
};

describe('接缝', () => {
  it('图片视频跨接续段形成接缝，文字音频不进入结果', () => {
    expect(cutList(util, fixture(), [board([[1, 10]]), board([[20]])], {}).map((c) => [c.a.o.id, c.b.o.id, c.gap]))
      .toEqual([[3, 4, 0], [4, 5, 1], [5, 14, 0]]);
  });
  it('按下一段开始时间与画板筛选', () => {
    expect(cutList(util, fixture(), [board([[1, 10]])], {begin: 5, end: 9}).map((c) => c.b.o.id)).toEqual([5]);
    expect(cutList(util, fixture(), [board([[1, 10]])], {board: 20})).toEqual([]);
  });
  it('遵循宿主给出的小行分配，不把重叠对象错误相连', () => {
    const host = {...util, lanes: () => [0, 1, 0]};
    expect(cutList(host, fixture(true), [board([[1]])], {}).map((c) => [c.a.o.id, c.b.o.id])).toEqual([[3, 5]]);
  });
  it('折叠轨道不列接缝', () => {
    expect(cutList(util, fixture(false, true), [board([[1, 10]])], {})).toEqual([]);
  });
  it('跳转点是下一段的起点', () => {
    expect(cutPoints(util, fixture(), board([[1, 10]]))).toEqual([4, 9, 10]);
  });
});

export class RefMap {
  map = new Map<any, number>();

  hasRef(o: any) {
    return this.map.has(o);
  }

  getRef(o: any) {
    return this.map.get(o);
  }

  addRef(o: any, ref: number) {
    this.map.set(o, ref);
  }
}

export class ImportMap {
  private _map = new Map<string, string>();
  add(source: string) {
    const id = contentHash('ld_', source, { start: 0, end: source.length });
    this._map.set(id, source);
    return id;
  }

  get entries() {
    return this._map;
  }
}

export function contentHash(
  baseName: string,
  str: string,
  range: { start: number; end: number },
  fill: number = '_'.charCodeAt(0)
) {
  const { start, end } = range;
  const maxLen = 10 - baseName.length;
  const bits = new Int8Array({ length: maxLen }).fill(
    (Math.abs(fill - 97) % (122 - 97)) + 97
  );
  for (let i = 0, len = end - start + 1; i < len; i++) {
    const u = i % maxLen;
    const c = str.charCodeAt(i + start) ^ bits[u];

    bits[u] = (Math.abs(c - 97) % (122 - 97)) + 97;
  }

  const retval = String.fromCharCode(...bits);

  return baseName + retval;
}

export class Literal {
  constructor(public value: string) {}
}

export const primitives = ['number', 'bigint', 'boolean'];

export class RefMap {
  map = new Map();
  resolve(ref: any, fn: Function, ...args: any[]) {
    if (this.map.has(ref)) {
      return this.map.get(ref);
    }
    const retval = fn.apply(null, args);
    this.map.set(ref, retval);
    return retval;
  }
}

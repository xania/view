const arrayPool: any[] = [];

export function rent() {
  if (arrayPool.length > 0) {
    return arrayPool.pop()!;
  }
  return [];
}

export function release(arr: any[]) {
  arrayPool.push(arr);
}

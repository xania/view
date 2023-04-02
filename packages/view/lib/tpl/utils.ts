﻿export function isIterable<T>(obj: any): obj is Iterable<T> {
  if (!obj) return false;
  return (
    obj.constructor !== String &&
    Symbol.iterator &&
    obj?.[Symbol.iterator] instanceof Function
  );
}

export function isAsyncIterable<T>(obj: any): obj is AsyncIterable<T> {
  return (
    Symbol.asyncIterator && obj?.[Symbol.asyncIterator] instanceof Function
  );
}

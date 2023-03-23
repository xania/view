import { Template } from '../tpl';

export function ready(result: Template): Promise<any> {
  if (result instanceof Array) {
    return Promise.all(result);
  }
  if (result instanceof Promise) {
    return result;
  }
  return Promise.resolve();
}

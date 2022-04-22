import { createContainer, ViewContainer } from '../container';

export function useStore<T>(): ViewContainer<T> {
  return createContainer<T>();
}

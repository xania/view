export interface Viewable<T = any> {
  view(data?: T): JSX.Element;
}

export function isViewable(value: any): value is Viewable {
  return value && value.view instanceof Function;
}

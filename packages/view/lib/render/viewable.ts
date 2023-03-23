export interface Viewable {
  view(): JSX.Element;
}

export function isViewable(value: any): value is Viewable {
  return (
    value !== null && value !== undefined && value['view'] instanceof Function
  );
}

export type Template<T = any> = JSX.MaybePromise<
  T | null | undefined | Template<T>[]
>;

export type TemplateValue<T> = T extends Template<infer E> ? E : never;

export type Template<T> = any;
//  JSX.MaybeArray<
//   JSX.MaybePromise<T | JSX.Nothing | Template<T>[]>
// >;

export type TemplateValue<T> = T extends Template<infer E> ? E : never;

export type Sequence<T> = Template<T>;
//   NonNullable<T> | JSX.MaybePromise<NonNullable<T>>[]
// >;

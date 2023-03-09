export type Optional<T> = {
  [P in keyof T]?: Optional<T[P]>;
};

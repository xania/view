// interface Observable<T> {
//   next(value: T, meta?: any): void;
// }

// export function useState<T>(value: T, distinct: boolean = true) {
//   return new State(value, distinct);
// }

// export class State<T> implements JSX.State<T> {
//   observers: Observable<T>[] = [];
//   _metaKey = Symbol();
//   constructor(public current?: T, private distinct: boolean = true) {}

//   subscribe<O extends JSX.StateObserver<T, any>>(
//     observer: O,
//     meta: any
//   ): JSX.Unsubscribable {
//     const { observers } = this;
//     const len = observers.length;
//     observers[len] = observer;

//     if (this.current) {
//       observer.next(this.current, meta);
//     }

//     if (meta) {
//       (observer as any)[this._metaKey] = meta;
//     }

//     return {
//       unsubscribe() {
//         const idx = observers.indexOf(observer);
//         if (idx >= 0) observers.splice(idx, 1);
//       },
//     };
//   }

//   update(valueOrFunc: T | Func<T | undefined, T>) {
//     const { current: preValue } = this;

//     const newValue =
//       valueOrFunc instanceof Function ? valueOrFunc(preValue) : valueOrFunc;
//     if (!this.distinct || newValue !== preValue) {
//       this.current = newValue;
//       for (const o of this.observers) {
//         o.next(newValue, (o as any)[this._metaKey]);
//       }
//     }
//   }

//   bind<U, S>(func: (value: T | undefined, acc: U) => S) {
//     return (e: U) => this.map((x) => func(x, e));
//   }

//   reduce<U>(valueOrFunc: (value: T | undefined, acc: U) => T) {
//     return (acc: U) => this.update((curr) => valueOrFunc(curr, acc));
//   }

//   set(newValue: T) {
//     const { current: value } = this;
//     if (newValue !== value) {
//       this.current = newValue;
//       for (const o of this.observers) {
//         o.next(newValue, (o as any)[this._metaKey]);
//       }
//     }
//   }

//   when(func: (x?: T) => boolean) {
//     return this.map(func);
//   }
//   map<U>(func: (x?: T) => U): MappedState<T | undefined, U> {
//     const { observers } = this;
//     const mappedState = new MappedState<T | undefined, U>(this.current, func);
//     observers.push(mappedState);

//     return mappedState;
//   }

//   toString() {
//     return this.current;
//   }
// }

// class MappedState<T, U> extends State<U> {
//   /**
//    *
//    */
//   constructor(current: T, private mapper: (value: T) => U) {
//     super(mapper(current));
//   }

//   next(newValue: T) {
//     this.set(this.mapper(newValue));
//   }

//   then(func: (u: U) => void) {
//     return this.subscribe(
//       {
//         next: func,
//       },
//       undefined
//     );
//   }
// }

// type Func<P, T> = (p: P) => T;

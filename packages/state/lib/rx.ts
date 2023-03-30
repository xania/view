import type { Value } from './observable/value';

export namespace Rx {
  // export const Mode = {
  //   synced: 0,
  //   dirty: 1,
  //   stale: 2,
  // } as const;

  // export type Mode = typeof Mode[keyof typeof Mode];

  export const STALE = 0 as const;

  export type StateInput<T> = AsyncIterable<T> | Observable<T> | Value<T>;

  export interface Stateful<T = any> extends Observable<T> {
    dirty: boolean | typeof STALE;
    depth?: number;
    version?: number;
    deps?: Stateful<any> | Stateful<any>[];

    snapshot?: T;
    observers?: NextObserver<T>[];
    operators?: StateOperator<T>[];
  }

  // export interface Computed<T = any> extends Stateful<T> {
  //   deps: Stateful[];
  // }

  export type Observable<T> = {
    subscribe(observer: NextObserver<T>): Subscription;
  };

  export type StateOperator<T = any> =
    | MapOperator<T>
    | JoinOperator
    | ConnectOperator<T>
    | PropertyOperator<T, keyof T>
    | BindOperator<T>
    | SignalOperator<T>;

  export enum StateOperatorType {
    Map,
    Bind,
    Connect,
    Property,
    /**
     * join is used when a target state has multiple sources
     */
    Join,
    Signal,
  }

  export interface JoinOperator {
    type: StateOperatorType.Join;
    target: Rx.Stateful<any>;
  }

  export interface SignalOperator<T = any> {
    type: StateOperatorType.Signal;
    target: Rx.Stateful<T>;
    key: symbol;
  }

  export interface MapOperator<T, U = any> {
    type: StateOperatorType.Map;
    func: (t: T, prev?: U | undefined) => U | undefined;
    target: Stateful<U>;
  }

  export interface BindOperator<T, U = any> {
    type: StateOperatorType.Bind;
    binder: (x: T) => StateInput<U>;
    target: Stateful<U>;
    connectOp: ConnectOperator<U>;
    boundState?: Stateful<U>;
  }

  export interface ConnectOperator<T> {
    type: StateOperatorType.Connect;
    target: Stateful<T>;
  }

  export interface PropertyOperator<T, K extends keyof T> {
    type: StateOperatorType.Property;
    name: K;
    target: Stateful<T[K]>;
  }

  export type StateObserver<T> = NextObserver<T>;

  export interface NextObserver<T, U = any> {
    next: (value: T, prev?: U) => U;
    error?: (err: any) => void;
    complete?: () => void;
  }

  export interface Subscription {
    unsubscribe(): void;
  }

  export interface Subscribable<T> {
    snapshot?: T;
    observers?: NextObserver<T>[];
    subscribe<O extends NextObserver<T>>(observer: O): Subscription;
  }
}

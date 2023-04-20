// import { Graph, RenderContext } from '../../render/render-context';
// import { Command, ListMutationCommand } from '../commands';
// import { State, Stateful } from '../state';

// export * from './mutation';

// export function List<T>(props: ListExpression<T>) {
//   return new ListExpression<T>(props.source, props.children);
// }

// export class ListExpression<T = any> {
//   constructor(
//     public source: State<T[]> | T[],
//     public children: JSX.Sequence<
//       (item: State<T>, dispose: Command) => JSX.Element
//     >
//   ) {}
// }

// export function listSource<T>(
//   initial?: JSX.MaybePromise<T[]>,
//   predicate?: Predicate<T>
// ) {
//   return new ListSource(initial, predicate);
// }

// type Predicate<T> = (x: T) => boolean;

// export class ListSource<T = any> extends State<T[]> {
//   // public itemKey: number = this.key + 1;
//   // public childrenKey: number = this.key + 2;

//   constructor(
//     initial?: JSX.MaybePromise<T[] | undefined>,
//     public predicate?: Predicate<T>
//   ) {
//     super(initial);
//   }

//   push(itemOrGetter: T | ((arr: T[]) => T)): ListMutationCommand<T> {
//     return new ListMutationCommand(this, {
//       type: 'add',
//       itemOrGetter,
//     });
//   }

//   filter(predicate: (item: T) => boolean) {
//     return new ListMutationCommand(this, {
//       type: 'filter',
//       list: this,
//       filter: predicate,
//     });
//   }

//   each(command: Command | ((row: State<T>) => Command)) {
//     const row = new State<T>();
//     row.key = this.key + ROW_KEY_OFFSET;
//     return new ListMutationCommand(this, {
//       type: 'each',
//       list: this,
//       command: command instanceof Function ? command(row) : command,
//     });
//   }
// }

// export class ItemState<T = any> extends State<T> {
//   constructor(public listContext: RenderContext, public list: State<T[]>) {
//     super();
//     this.key = list.key + ROW_KEY_OFFSET;
//   }
// }

// export const ROW_KEY_OFFSET = 1;
// export const GRAPHS_KEY_OFFSET = 2;
// // export const FILTER_KEY_OFFSET = 3;

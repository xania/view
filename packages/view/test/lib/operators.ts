import { Computed, Join, Property, State } from '../../reactivity';
import {
  ComputedOperator,
  OperatorEnum,
  OperatorProvider,
  GetOperator,
  SetOperator,
} from './graph';

type Node = State | Property | Computed | Join;

export const operationProvider: OperatorProvider = {
  get(node: Node) {
    if (node instanceof Property) {
      return {
        type: OperatorEnum.Get,
        source: node.parent.key,
        target: node.key,
        prop: node.name,
      } satisfies GetOperator;
    } else if (node instanceof Computed) {
      return {
        type: OperatorEnum.Computed,
        source: node.parent.key,
        target: node.key,
        compute: node.compute,
      } satisfies ComputedOperator;
    } else if (node instanceof Join) {
      return node.sources.map(
        (src, idx) =>
          ({
            type: OperatorEnum.Set,
            source: src.key,
            target: node.key,
            prop: idx,
          } satisfies SetOperator)
      );
    } else {
      // return {
      //   type: OperatorEnum.Set
      // }
      // console.error('Unsupported node');
    }
    return null;
  },
};

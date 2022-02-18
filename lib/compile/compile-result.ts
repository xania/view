import { Removable } from '../abstractions/disposable';
import { ContainerMutation } from '../container/mutation';
import { RenderTarget } from '../renderable/render-target';

export interface CompileResult {
  listen(): void;
  execute(items: ArrayLike<any>): (Removable & RenderTarget)[];
  next(mut: ContainerMutation<any>): void;
}

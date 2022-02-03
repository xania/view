import { ContainerMutation } from '../container/mutation';
import { RenderTarget } from '../renderable/render-target';

export interface CompileResult {
  listen(): void;
  execute(items: ArrayLike<any>): RenderTarget[];
  next(mut: ContainerMutation<any>): void;
}

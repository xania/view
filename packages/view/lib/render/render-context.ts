import { Scope } from '../state';

export class RenderContext {
  public signalBindings: [JSX.State, Text][] = [];
  public scope: Scope = new Scope();
}

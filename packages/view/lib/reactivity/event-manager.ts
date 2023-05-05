import { Sandbox } from "./sandbox";

export interface EventManager<TElement> {
  // addListener(eventName: string, sandbox: Sandbox): any;

  applyEvent(
    sandbox: Sandbox,
    target: TElement,
    eventName: string,
    eventHandler: JSX.EventHandler
  ): void;
}

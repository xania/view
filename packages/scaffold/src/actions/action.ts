import { ActionContext } from "./action-context";

export type Action = (context: ActionContext) => void | Promise<void>;

import { ActionContext } from "./action-context";

export type Action = (context: ActionContext) => any | Promise<any>;

import { Route } from '../core';

export interface ViewContext {
  route: Route;
}

export interface CssClasses {
  outlet__root: string;
  outlet: string;
  ['outlet__root--collapsed']: string;
  ['page-container']: string;
  ['page-container--inactive']: string;
  ['page-container--loading']: string;
  ['page-container--active']: string;
}

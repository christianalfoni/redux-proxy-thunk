import { Action, ActionCreator, Middleware } from 'redux'
export interface State {
  [key: string]: State | string | number | boolean | object | null | undefined
}

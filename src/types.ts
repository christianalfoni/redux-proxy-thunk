import { Action, ActionCreator, Middleware } from 'redux'
import { ThunkAction } from 'redux-thunk'

export type Options = {
  debug: boolean
}

// A type which can be extended by
// interface Action<Payload> extends IAction<Payload, typeof state, typeof effects> {}
export interface IAction<Payload, C extends Config<any, any, any>> {
  (
    context: {
      state: C['state']
      effects: C['effects']
    },
    payload: Payload
  ): any
}

export interface Store<
  S extends State,
  E extends BaseEffects,
  A extends BaseActions<S, E>
> {
  reducers: {
    [key: string]: (state: S, action: any) => S
  }
  actions: ActionsWithoutContext<A>
  middleware: Middleware<any, any>
}

export interface Config<
  S extends State,
  E extends BaseEffects,
  A extends BaseActions<S, E>
> {
  state: S
  effects?: E
  actions?: A
}

export enum LogType {
  RENDER = 'RENDER',
  MUTATION = 'MUTATION',
  FLUSH = 'FLUSH',
  COMPONENT_RENDER = 'COMPONENT RENDER',
}

interface NestedState {
  [key: string]:
    | NestedState
    | string
    | number
    | boolean
    | object
    | null
    | undefined
}

export interface State {
  [key: string]: NestedState
}

interface GenericAction<S extends State, E extends BaseEffects> {
  (
    context: {
      state: S
      effects: E
    },
    payload?: any
  ): any
}

export interface BaseActions<S extends State, E extends BaseEffects> {
  [key: string]: BaseActions<S, E> | GenericAction<S, E>
}

type Func = (...args: any[]) => any

export interface BaseEffects {
  [key: string]: BaseEffects | Func
}

export type ActionsWithoutContext<U extends BaseActions<any, any>> = {
  [N in keyof U]: U[N] extends (context: any) => any
    ? ActionCreator<Action<any>>
    : U[N] extends (context: any, payload: infer P) => any
    ? ActionCreator<ThunkAction<Action, State, P, ReturnType<U[N]>>>
    : U[N] extends BaseActions<any, any>
    ? ActionsWithoutContext<U[N]>
    : never
}

import { State } from './types'
import { getTarget, performMutation } from './utils'
import { Action } from 'redux'

// Used to give debugging information about what type of mutations
// are being performed
const arrayMutationMethods = new Set([
  'push',
  'shift',
  'pop',
  'unshift',
  'splice',
  'reverse',
  'sort',
  'copyWithin',
])

const arrayImmutableItemsMethods = new Set(['filter', 'map', 'reduce'])

export const IS_PROXY = Symbol('IS_PROXY')

function createTrackMutationsProxy(
  dispatch,
  getState,
  path,
  objectCache: WeakMap<object, object>
) {
  return new Proxy(Array.isArray(getTarget(path, getState())) ? [] : {}, {
    getOwnPropertyDescriptor(_, prop) {
      const target = getTarget(path, getState())

      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
    ownKeys() {
      const target = getTarget(path, getState())

      return Reflect.ownKeys(target)
    },
    has(_, prop) {
      const target = getTarget(path, getState())

      return Reflect.has(target, prop)
    },
    get(_, prop) {
      if (prop === IS_PROXY) {
        return true
      }

      if (typeof prop === 'symbol') {
        return prop
      }

      const target = getTarget(path, getState())
      const newPath = path.concat(prop)

      if (typeof target[prop] === 'function') {
        return (...args) => {
          if (arrayMutationMethods.has(prop.toString())) {
            dispatch({
              type: 'mutation',
              path,
              mutation: prop.toString().toUpperCase(),
              args,
            })
            switch (prop) {
              case 'push':
              case 'unshift':
                return target.length + args.length
              case 'shift':
                return target[0]
              case 'pop':
                return target[target.length - 1]
              case 'splice':
                return Object.freeze(target.slice().splice(...args))
              case 'reverse':
              case 'sort':
              case 'copyWithin':
                const newTarget = path.reduce(
                  (aggr, key) => aggr[key],
                  getState()
                )

                return objectCache
                  .set(
                    newTarget,
                    createTrackMutationsProxy(
                      dispatch,
                      getState,
                      path,
                      objectCache
                    )
                  )
                  .get(newTarget)
              default:
                return undefined
            }
          }

          if (arrayImmutableItemsMethods.has(prop.toString())) {
            return target[prop](...args)
          }

          return target[prop].call(
            createTrackMutationsProxy(dispatch, getState, path, objectCache),
            ...args
          )
        }
      }

      if (typeof target[prop] === 'object' && target[prop] !== null) {
        return (
          objectCache.get(target[prop]) ||
          objectCache
            .set(
              target[prop],
              createTrackMutationsProxy(
                dispatch,
                getState,
                newPath,
                objectCache
              )
            )
            .get(target[prop])
        )
      }

      return target[prop]
    },
    set(_, prop, value) {
      dispatch({
        type: 'mutation',
        path: path.concat(prop),
        mutation: 'SET',
        value,
      })
      return true
    },
    deleteProperty(_, prop) {
      dispatch({
        type: 'mutation',
        path: path.concat(prop),
        mutation: 'DELETE',
      })
      return true
    },
  })
}

export function createReducer<S extends State>(initialState: S)
export function createReducer<S extends State, N extends string>(
  namespace: N,
  initialState: S
)
export function createReducer() {
  const namespace = arguments.length > 1 ? arguments[0] : null
  const initialState = arguments.length > 1 ? arguments[1] : arguments[0]

  return (state, action) => {
    if (
      action.type === 'mutation' &&
      (!namespace || action.path[0] === namespace)
    ) {
      switch (action.mutation) {
        case 'SET':
          return performMutation(
            state,
            namespace,
            action.path,
            (target, key) => {
              target[key] = action.value
            }
          )
        case 'DELETE':
          return performMutation(
            state,
            namespace,
            action.path,
            (target, key) => {
              delete target[key]
            }
          )
        case 'PUSH':
          return performMutation(
            state,
            namespace,
            action.path,
            (target, key) => {
              target[key] = target[key].concat(...action.args)
            }
          )
        case 'SHIFT':
          return performMutation(
            state,
            namespace,
            action.path,
            (target, key) => {
              target[key] = target[key].slice(1)
            }
          )
        case 'POP':
          return performMutation(
            state,
            namespace,
            action.path,
            (target, key) => {
              target[key] = target[key].slice(0, target[key].length - 1)
            }
          )
        case 'UNSHIFT':
          return performMutation(
            state,
            namespace,
            action.path,
            (target, key) => {
              target[key] = [...action.args, ...target[key]]
            }
          )
        case 'SPLICE':
          return performMutation(
            state,
            namespace,
            action.path,
            (target, key) => {
              const newArray = target[key].slice()
              newArray.splice(...action.args)
              target[key] = newArray
            }
          )
        case 'REVERSE':
          return performMutation(
            state,
            namespace,
            action.path,
            (target, key) => {
              target[key] = target[key].slice().reverse()
            }
          )
        case 'SORT':
          return performMutation(
            state,
            namespace,
            action.path,
            (target, key) => {
              target[key] = target[key].slice().sort(...action.args)
            }
          )
        case 'COPYWITHIN':
          return performMutation(
            state,
            namespace,
            action.path,
            (target, key) => {
              target[key] = target[key].slice().copyWithin(...action.args)
            }
          )
        default:
          return state
      }
    }

    return state ? state : initialState // TODO: initial freeze
  }
}

export function createAction<P extends any, S extends State>(
  action: P extends void
    ? (context: { state: S }) => any
    : (context: { state: S }, payload: P) => any
): (payload: P) => Action<P>
export function createAction<P extends any, S extends State, E extends object>(
  action: P extends void
    ? (context: { state: S; effects: E }) => any
    : (context: { state: S; effects: E }, payload: P) => any
): (payload: P) => Action<P> {
  return ((payload: P) => (dispatch, getState, effects) => {
    const proxy: S = createTrackMutationsProxy(
      dispatch,
      getState,
      [],
      new WeakMap()
    )

    return action(
      {
        state: proxy,
        effects,
      },
      payload as any
    )
  }) as any
}

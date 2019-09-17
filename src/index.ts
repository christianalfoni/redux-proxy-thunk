import {
  State,
  LogType,
  BaseActions,
  BaseEffects,
  Store,
  Config,
  Options,
} from './types'
import {
  log,
  configureUtils,
  getTarget,
  createNestedStructure,
  performMutation,
} from './utils'
import thunk from 'redux-thunk'
export { IAction } from './types'

// Used to give debugging information about what type of mutations
// are being performed
const arrayMutations = new Set([
  'push',
  'shift',
  'pop',
  'unshift',
  'splice',
  'reverse',
  'sort',
  'copyWithin',
])

// Creates the store itself by preparing the state, converting actions to callable
// functions and manage their execution to notify state changes
export function create<
  S extends State,
  E extends BaseEffects,
  A extends BaseActions<S, E>
>(config: Config<S, E, A>, options: Options = { debug: true }): Store<S, E, A> {
  // We force disable debugging in production and in test
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.NODE_ENV === 'test'
  ) {
    options.debug = false
  }

  configureUtils(options)

  function createTrackMutationsProxy(
    dispatch,
    getState,
    path,
    objectCache: WeakMap<object, object>
  ) {
    return new Proxy(
      {},
      {
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
          if (typeof prop === 'symbol') {
            return prop
          }

          const target = getTarget(path, getState())
          const newPath = path.concat(prop)

          if (typeof target[prop] === 'function') {
            return (...args) => {
              if (arrayMutations.has(prop.toString())) {
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

              return target[prop](...args)
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
      }
    )
  }

  function createAction(
    target: object,
    key: string,
    name: string,
    func: (...args) => any
  ) {
    target[key] = (payload) => (dispatch, getState) => {
      const proxy = createTrackMutationsProxy(
        dispatch,
        getState,
        [],
        new WeakMap()
      )

      return func(
        {
          state: proxy,
          effects: config.effects,
        },
        payload
      )
    }

    return target
  }

  const actions = config.actions || {}

  return {
    actions: createNestedStructure(actions, createAction),
    reducers: Object.keys(config.state).reduce(
      (aggr, key) =>
        Object.assign(aggr, {
          ...aggr,
          [key]: (state, action) => {
            if (action.type === 'mutation' && action.path[0] === key) {
              switch (action.mutation) {
                case 'SET':
                  return performMutation(state, action.path, (target, key) => {
                    target[key] = action.value
                  })
                case 'DELETE':
                  return performMutation(state, action.path, (target, key) => {
                    delete target[key]
                  })
                case 'PUSH':
                  return performMutation(state, action.path, (target, key) => {
                    target[key] = target[key].concat(...action.args)
                  })
                case 'SHIFT':
                  return performMutation(state, action.path, (target, key) => {
                    target[key] = target[key].slice(1)
                  })
                case 'POP':
                  return performMutation(state, action.path, (target, key) => {
                    target[key] = target[key].slice(0, target[key].length - 1)
                  })
                case 'UNSHIFT':
                  return performMutation(state, action.path, (target, key) => {
                    target[key] = [...action.args, ...target[key]]
                  })
                case 'SPLICE':
                  return performMutation(state, action.path, (target, key) => {
                    const newArray = target[key].slice()
                    newArray.splice(...action.args)
                    target[key] = newArray
                  })
                case 'REVERSE':
                  return performMutation(state, action.path, (target, key) => {
                    target[key] = target[key].slice().reverse()
                  })
                case 'SORT':
                  return performMutation(state, action.path, (target, key) => {
                    target[key] = target[key].slice().sort(...action.args)
                  })
                case 'COPYWITHIN':
                  return performMutation(state, action.path, (target, key) => {
                    target[key] = target[key].slice().copyWithin(...action.args)
                  })
                default:
                  return state
              }
            }

            return state ? state : config.state[key] // initial freeze
          },
        }),
      {}
    ),
    middleware: thunk,
  }
}

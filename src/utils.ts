import { LogType, Options } from './types'

let _options: Options

export function configureUtils(options: Options) {
  _options = options
}

export function log(type: LogType, message: string, ...data) {
  return _options.debug && console.log(`# ${type}: ${message}`, ...data)
}

export function getTarget(paths: string[], source: any) {
  return paths.reduce((aggr, key) => aggr[key], source)
}

// Creates a nested structure and handling functions with a factory
// Used to create actions
export function createNestedStructure(
  structure: object,
  factory: (target: object, key: string, path: string, func: Function) => any,
  path: string[] = []
) {
  return Object.keys(structure).reduce((aggr, key) => {
    const funcOrNested = structure[key]
    const newPath = path.concat(key)

    if (typeof funcOrNested === 'function') {
      return factory(aggr, key, newPath.join('.'), funcOrNested)
    }

    return Object.assign(aggr, {
      [key]: createNestedStructure(funcOrNested, factory, newPath),
    })
  }, {})
}

export function performMutation(state, path: string[], cb) {
  const namespacedPath = path.slice(1)
  const key = namespacedPath.pop() as string
  const target = namespacedPath.reduce((aggr, key) => aggr[key], state)
  const targetCopy = Array.isArray(target) ? target.slice() : { ...target }

  cb(targetCopy, key)

  if (state === target) {
    return Object.freeze(targetCopy)
  }

  const newState = { ...state }

  let currentState = newState

  const copyPath = namespacedPath.slice()
  while (copyPath.length) {
    const nestedKey = copyPath.shift() as string
    const nestedTarget = currentState[nestedKey]
    currentState[nestedKey] = Array.isArray(nestedTarget)
      ? nestedTarget.slice()
      : { ...nestedTarget }
    currentState = currentState[nestedKey]
  }

  const freezePath = namespacedPath.slice()
  while (freezePath.length) {
    Object.freeze(freezePath.reduce((aggr, key) => aggr[key], newState))
    freezePath.pop()
  }

  return Object.freeze(newState)
}

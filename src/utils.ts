export function getTarget(paths: string[], source: any) {
  return paths.reduce((aggr, key) => aggr[key], source)
}

export function performMutation(state, namespace: string, path: string[], cb) {
  const namespacedPath = path.slice(namespace ? 1 : 0)
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

    if (copyPath.length) {
      currentState[nestedKey] = Array.isArray(nestedTarget)
        ? nestedTarget.slice()
        : { ...nestedTarget }
      currentState = currentState[nestedKey]
    } else {
      currentState[nestedKey] = targetCopy
    }
  }

  const freezePath = namespacedPath.slice()
  while (freezePath.length) {
    Object.freeze(freezePath.reduce((aggr, key) => aggr[key], newState))
    freezePath.pop()
  }

  return Object.freeze(newState)
}

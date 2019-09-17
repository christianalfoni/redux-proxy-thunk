import { createReducer, createAction } from './'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import thunk from 'redux-thunk'
import { Provider, useSelector } from 'react-redux'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

const waitForUseEffect = () => new Promise((resolve) => setTimeout(resolve))

describe('React', () => {
  test('should initialize with reducers', () => {
    const reducer = createReducer({
      foo: 'bar',
    })
    const store = createStore(reducer)

    expect(store.getState()).toEqual({
      foo: 'bar',
    })
  })
  test('should initialize namespaced reducers', () => {
    const app = createReducer('app', {
      foo: 'bar',
    })
    const other = createReducer('other', {
      bar: 'baz',
    })
    const store = createStore(
      combineReducers({
        app,
        other,
      })
    )

    expect(store.getState()).toEqual({
      app: {
        foo: 'bar',
      },
      other: {
        bar: 'baz',
      },
    })
  })
  test('should dispatch mutations to reducers', () => {
    type State = {
      foo: string
    }

    const reducer = createReducer<State>({
      foo: 'bar',
    })
    const test = createAction<void, State>(({ state }) => {
      state.foo = 'bar2'
    })
    const store = createStore(reducer, applyMiddleware(thunk))

    store.dispatch(test())
    expect(store.getState()).toEqual({
      foo: 'bar2',
    })
  })

  test('should freeze state', () => {
    type State = {
      foo: {
        bar: Array<{ mip: string }>
      }
    }
    const reducer = createReducer<State>({
      foo: {
        bar: [
          {
            mip: 'mop',
          },
        ],
      },
    })
    const test = createAction<void, State>(({ state }) => {
      state.foo.bar[0].mip = 'mop2'
    })
    const store = createStore(reducer, applyMiddleware(thunk))

    store.dispatch(test())

    const state = store.getState() as State

    expect(Object.isFrozen(state))
    expect(Object.isFrozen(state.foo))
    expect(Object.isFrozen(state.foo.bar))
    // @ts-ignore
    expect(Object.isFrozen(state.foo.bar[0]))
  })

  test('should alway see latest state', () => {
    type State = {
      foo: {
        bar: string
      }
    }
    const reducer = createReducer<State>({
      foo: {
        bar: 'baz',
      },
    })
    const test = createAction<void, State>(({ state }) => {
      const foo = state.foo
      foo.bar += '!'
      foo.bar += '!'
    })
    const store = createStore(reducer, applyMiddleware(thunk))

    store.dispatch(test())
    expect(store.getState()).toEqual({
      foo: {
        bar: 'baz!!',
      },
    })
  })

  test('should be able to mutate with iterators', () => {
    type State = {
      foo: {
        bar: Array<{ title: string }>
      }
    }
    const reducer = createReducer<State>({
      foo: {
        bar: [{ title: 'foo' }],
      },
    })
    const test = createAction<void, State>(({ state }) => {
      state.foo.bar.forEach((item) => {
        item.title += '!!!'
      })
    })
    const store = createStore(reducer, applyMiddleware(thunk))

    store.dispatch(test())
    expect(store.getState()).toEqual({
      foo: {
        bar: [
          {
            title: 'foo!!!',
          },
        ],
      },
    })
  })

  test('should be able to replace objects', () => {
    type State = {
      foo: {
        bar: Array<{ title: string; isAwesome: boolean }>
      }
    }
    const reducer = createReducer<State>({
      foo: {
        bar: [
          { title: 'foo', isAwesome: true },
          { title: 'bar', isAwesome: false },
        ],
      },
    })
    const test = createAction<void, State>(({ state }) => {
      state.foo.bar = state.foo.bar.filter((item) => item.isAwesome)
    })
    const store = createStore(reducer, applyMiddleware(thunk))

    store.dispatch(test())

    expect(store.getState()).toEqual({
      foo: {
        bar: [
          {
            title: 'foo',
            isAwesome: true,
          },
        ],
      },
    })
  })

  test('should handle async changes', async () => {
    type State = {
      foo: {
        bar: string
      }
    }
    const reducer = createReducer<State>({
      foo: {
        bar: 'baz',
      },
    })
    const test = createAction<void, State>(async ({ state }) => {
      const foo = state.foo
      foo.bar += '!'
      await Promise.resolve()
      foo.bar += '!'
    })
    const store = createStore(reducer, applyMiddleware(thunk))

    store.dispatch(test())

    await Promise.resolve()

    expect(store.getState()).toEqual({
      foo: {
        bar: 'baz!!',
      },
    })
  })
  describe('MUTATION RESULTS', () => {
    test('SET should return value set', () => {
      expect.assertions(1)
      type State = {
        foo: {
          bar: string
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: 'baz',
        },
      })
      const test = createAction<void, State>(({ state }) => {
        expect((state.foo.bar = 'baz2')).toBe('baz2')
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
    })
    test('DELETE should return boolean', () => {
      expect.assertions(1)
      type State = {
        foo: {
          bar: string
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: 'baz',
        },
      })
      const test = createAction<void, State>(({ state }) => {
        expect(delete state.foo.bar).toBe(true)
      })
      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
    })
    test('PUSH should return new length', () => {
      expect.assertions(1)
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: [],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        expect(state.foo.bar.push('foo')).toBe(1)
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
    })
    test('SHIFT should return first value', () => {
      expect.assertions(1)
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo'],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        expect(state.foo.bar.shift()).toBe('foo')
      })
      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
    })
    test('POP should return last value', () => {
      expect.assertions(1)
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo', 'bar'] as string[],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        expect(state.foo.bar.pop()).toBe('bar')
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
    })
    test('UNSHIFT should return new length', () => {
      expect.assertions(1)
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo'],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        expect(state.foo.bar.unshift('bar')).toBe(2)
      })
      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
    })
    test('SPLICE should return removed elements', () => {
      expect.assertions(1)
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo', 'bar', 'baz'],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        expect(state.foo.bar.splice(1, 1)).toEqual(['bar'])
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
    })
    test('REVERSE should return the reversed target', () => {
      expect.assertions(1)
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo', 'bar', 'baz'],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        expect(state.foo.bar.reverse()).toBe(state.foo.bar)
      })
      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
    })
    test('SORT should return the new sorted target', () => {
      expect.assertions(1)
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer({
        foo: {
          bar: ['foo', 'bar', 'baz'],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        expect(state.foo.bar.sort()).toBe(state.foo.bar)
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
    })
  })
  describe('MUTATIONS', () => {
    test('SET', () => {
      type State = {
        foo: {
          bar: string
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: 'baz',
        },
      })
      const test = createAction<void, State>(({ state }) => {
        state.foo.bar = 'baz2'
      })
      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
      expect(store.getState()).toEqual({
        foo: {
          bar: 'baz2',
        },
      })
    })
    test('DELETE', () => {
      type State = {
        foo: {
          bar: string
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: 'baz',
        },
      })

      const test = createAction<void, State>(({ state }) => {
        delete state.foo.bar
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
      expect(store.getState()).toEqual({
        foo: {},
      })
    })
    test('PUSH', () => {
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: [],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        state.foo.bar.push('foo')
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['foo'],
        },
      })
    })
    test('SHIFT', () => {
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo', 'bar'],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        state.foo.bar.shift()
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['bar'],
        },
      })
    })
    test('POP', () => {
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo', 'bar'] as string[],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        state.foo.bar.pop()
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['foo'],
        },
      })
    })
    test('UNSHIFT', () => {
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo'],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        state.foo.bar.unshift('bar')
      })
      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['bar', 'foo'],
        },
      })
    })
    test('SPLICE', () => {
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo', 'bar'] as string[],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        state.foo.bar.splice(1, 1, 'baz')
      })
      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['foo', 'baz'],
        },
      })
    })
    test('REVERSE', () => {
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo', 'bar'] as string[],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        state.foo.bar.splice(1, 1, 'baz')
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['foo', 'baz'],
        },
      })
    })
    test('SORT', () => {
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo', 'bar'] as string[],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        state.foo.bar.sort()
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['bar', 'foo'],
        },
      })
    })
    test('COPYWITHIN', () => {
      type State = {
        foo: {
          bar: string[]
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: ['foo', 'bar'] as string[],
        },
      })
      const test = createAction<void, State>(({ state }) => {
        state.foo.bar.copyWithin(0, 1)
      })

      const store = createStore(reducer, applyMiddleware(thunk))

      store.dispatch(test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['bar', 'bar'],
        },
      })
    })
  })
  describe('COMPONENTS', () => {
    test('should expose state', () => {
      type State = {
        foo: {
          bar: string
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: 'baz',
        },
      })

      const store = createStore(reducer)
      const FooComponent: React.FunctionComponent = () => {
        const foo = useSelector((state) => state.foo)

        return <h1>{foo.bar}</h1>
      }

      const tree = renderer.create(
        <Provider store={store}>
          <FooComponent />
        </Provider>
      )

      expect(tree.toJSON()).toMatchSnapshot()
    })

    test('should render when updating state', () => {
      type State = {
        foo: {
          bar: string
        }
      }
      const reducer = createReducer<State>({
        foo: {
          bar: 'baz',
        },
      })
      const test = createAction<void, State>(({ state }) => {
        state.foo.bar = 'baz2'
      })

      const store = createStore(reducer, applyMiddleware(thunk))
      const FooComponent: React.FunctionComponent = () => {
        const foo = useSelector((state) => state.foo)

        return <h1>{foo.bar}</h1>
      }

      const tree = renderer.create(
        <Provider store={store}>
          <FooComponent />
        </Provider>
      )

      expect(tree.toJSON()).toMatchSnapshot()

      renderer.act(() => {
        store.dispatch(test())
      })

      expect(tree.toJSON()).toMatchSnapshot()
    })
  })
})

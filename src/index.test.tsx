import { create } from './'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { Provider, useSelector } from 'react-redux'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

const waitForUseEffect = () => new Promise((resolve) => setTimeout(resolve))

describe('React', () => {
  test('should initialize with reducers', () => {
    const { reducers } = create({
      state: {
        foo: {
          bar: 'baz',
        },
      },
    })
    const store = createStore(combineReducers(reducers))

    expect(store.getState()).toEqual({
      foo: {
        bar: 'baz',
      },
    })
  })
  test('should dispatch mutations to reducers', () => {
    const { reducers, actions, middleware } = create({
      state: {
        foo: {
          bar: 'baz',
        },
      },
      actions: {
        test({ state }) {
          state.foo.bar = 'baz2'
        },
      },
    })
    const store = createStore(
      combineReducers(reducers),
      applyMiddleware(middleware)
    )

    store.dispatch(actions.test())
    expect(store.getState()).toEqual({
      foo: {
        bar: 'baz2',
      },
    })
  })
  test('should freeze state', () => {
    const { reducers, actions, middleware } = create({
      state: {
        foo: {
          bar: [
            {
              mip: 'mop',
            },
          ],
        },
      },
      actions: {
        test({ state }) {
          state.foo.bar[0].mip = 'mop2'
        },
      },
    })
    const store = createStore(
      combineReducers(reducers),
      applyMiddleware(middleware)
    )

    store.dispatch(actions.test())

    const state = store.getState()

    expect(Object.isFrozen(state))
    expect(Object.isFrozen(state.foo))
    expect(Object.isFrozen(state.bar))
    // @ts-ignore
    expect(Object.isFrozen(state.foo.bar[0]))
  })
  test('should alway see latest state', () => {
    const { reducers, actions, middleware } = create({
      state: {
        foo: {
          bar: 'baz',
        },
      },
      actions: {
        test({ state }) {
          const foo = state.foo
          foo.bar += '!'
          foo.bar += '!'
        },
      },
    })
    const store = createStore(
      combineReducers(reducers),
      applyMiddleware(middleware)
    )

    store.dispatch(actions.test())
    expect(store.getState()).toEqual({
      foo: {
        bar: 'baz!!',
      },
    })
  })
  test('should handle async changes', async () => {
    const { reducers, actions, middleware } = create({
      state: {
        foo: {
          bar: 'baz',
        },
      },
      actions: {
        test: async ({ state }) => {
          const foo = state.foo
          foo.bar += '!'
          await Promise.resolve()
          foo.bar += '!'
        },
      },
    })
    const store = createStore(
      combineReducers(reducers),
      applyMiddleware(middleware)
    )

    store.dispatch(actions.test())

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
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: 'baz',
          },
        },
        actions: {
          test({ state }) {
            expect((state.foo.bar = 'baz2')).toBe('baz2')
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
    })
    test('DELETE should return boolean', () => {
      expect.assertions(1)
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: 'baz',
          },
        },
        actions: {
          test({ state }) {
            expect(delete state.foo.bar).toBe(true)
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
    })
    test('PUSH should return new length', () => {
      expect.assertions(1)
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: [] as string[],
          },
        },
        actions: {
          test({ state }) {
            expect(state.foo.bar.push('foo')).toBe(1)
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
    })
    test('SHIFT should return first value', () => {
      expect.assertions(1)
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo'] as string[],
          },
        },
        actions: {
          test({ state }) {
            expect(state.foo.bar.shift()).toBe('foo')
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
    })
    test('POP should return last value', () => {
      expect.assertions(1)
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo', 'bar'] as string[],
          },
        },
        actions: {
          test({ state }) {
            expect(state.foo.bar.pop()).toBe('bar')
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
    })
    test('UNSHIFT should return new length', () => {
      expect.assertions(1)
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo'] as string[],
          },
        },
        actions: {
          test({ state }) {
            expect(state.foo.bar.unshift('bar')).toBe(2)
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
    })
    test('SPLICE should return removed elements', () => {
      expect.assertions(1)
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo', 'bar', 'baz'] as string[],
          },
        },
        actions: {
          test({ state }) {
            expect(state.foo.bar.splice(1, 1)).toEqual(['bar'])
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
    })
    test('REVERSE should return the reversed target', () => {
      expect.assertions(1)
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo', 'bar', 'baz'] as string[],
          },
        },
        actions: {
          test({ state }) {
            expect(state.foo.bar.reverse()).toBe(state.foo.bar)
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
    })
    test('SORT should return the new sorted target', () => {
      expect.assertions(1)
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo', 'bar', 'baz'] as string[],
          },
        },
        actions: {
          test({ state }) {
            expect(state.foo.bar.sort()).toBe(state.foo.bar)
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
    })
  })
  describe('MUTATIONS', () => {
    test('SET', () => {
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: 'baz',
          },
        },
        actions: {
          test({ state }) {
            state.foo.bar = 'baz2'
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
      expect(store.getState()).toEqual({
        foo: {
          bar: 'baz2',
        },
      })
    })
    test('DELETE', () => {
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: 'baz',
          },
        },
        actions: {
          test({ state }) {
            delete state.foo.bar
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
      expect(store.getState()).toEqual({
        foo: {},
      })
    })
    test('PUSH', () => {
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: [] as string[],
          },
        },
        actions: {
          test({ state }) {
            state.foo.bar.push('foo')
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['foo'],
        },
      })
    })
    test('SHIFT', () => {
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo', 'bar'] as string[],
          },
        },
        actions: {
          test({ state }) {
            state.foo.bar.shift()
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['bar'],
        },
      })
    })
    test('POP', () => {
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo', 'bar'] as string[],
          },
        },
        actions: {
          test({ state }) {
            state.foo.bar.pop()
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['foo'],
        },
      })
    })
    test('UNSHIFT', () => {
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo'] as string[],
          },
        },
        actions: {
          test({ state }) {
            state.foo.bar.unshift('bar')
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['bar', 'foo'],
        },
      })
    })
    test('SPLICE', () => {
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo', 'bar'] as string[],
          },
        },
        actions: {
          test({ state }) {
            state.foo.bar.splice(1, 1, 'baz')
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['foo', 'baz'],
        },
      })
    })
    test('REVERSE', () => {
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo', 'bar'] as string[],
          },
        },
        actions: {
          test({ state }) {
            state.foo.bar.splice(1, 1, 'baz')
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['foo', 'baz'],
        },
      })
    })
    test('SORT', () => {
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo', 'bar'] as string[],
          },
        },
        actions: {
          test({ state }) {
            state.foo.bar.sort()
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['bar', 'foo'],
        },
      })
    })
    test('COPYWITHIN', () => {
      const { reducers, actions, middleware } = create({
        state: {
          foo: {
            bar: ['foo', 'bar'] as string[],
          },
        },
        actions: {
          test({ state }) {
            state.foo.bar.copyWithin(0, 1)
          },
        },
      })
      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )

      store.dispatch(actions.test())
      expect(store.getState()).toEqual({
        foo: {
          bar: ['bar', 'bar'],
        },
      })
    })
  })
  describe('COMPONENTS', () => {
    test('should expose state', () => {
      const { reducers, middleware } = create({
        state: {
          foo: {
            bar: 'baz',
          },
        },
      })

      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )
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
      const { actions, reducers, middleware } = create({
        state: {
          foo: {
            bar: 'baz',
          },
        },
        actions: {
          test({ state }) {
            state.foo.bar = 'baz2'
          },
        },
      })

      const store = createStore(
        combineReducers(reducers),
        applyMiddleware(middleware)
      )
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
        store.dispatch(actions.test())
      })

      expect(tree.toJSON()).toMatchSnapshot()
    })
  })
})

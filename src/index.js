// @flow
import React, { Component, createContext } from 'react'
import shallowEqual from 'fbjs/lib/shallowEqual'

class Prevent extends Component<*> {
  shouldComponentUpdate = ({ state, select }) =>
    select.some(
      selector => !shallowEqual(this.props.state[selector], state[selector]),
    )

  render() {
    const { actions, select, state, children } = this.props
    const selected = select.reduce((r, v) => ({ ...r, [v]: state[v] }), {})
    return children({ state: selected, actions })
  }
}

export const initStore: Function = store => {
  let self
  const Context = createContext()

  const getState = () =>
    self ? self.state : console.error('Provider is not rendered yet')

  const actions = Object.keys(store.actions).reduce(
    (r, v) => ({
      ...r,
      [v]: () =>
        self
          ? self.setState(store.actions[v](self.state))
          : console.error('Provider is not rendered yet'),
    }),
    {},
  )

  const Consumer = ({ children, select }) => (
    <Context.Consumer>
      {({ state, actions }) => (
        <Prevent select={select} state={state} actions={actions}>
          {children}
        </Prevent>
      )}
    </Context.Consumer>
  )

  class Provider extends Component<*> {
    state = store.initialState

    componentDidMount() {
      self = this
    }

    render() {
      return (
        <Context.Provider
          value={{
            state: this.state,
            actions,
          }}
        >
          {this.props.children}
        </Context.Provider>
      )
    }
  }

  return {
    Provider,
    Consumer,
    actions,
    getState,
  }
}
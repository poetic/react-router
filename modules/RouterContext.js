import invariant from 'invariant'
import React from 'react'

import deprecateObjectProperties from './deprecateObjectProperties'
import getRouteParams from './getRouteParams'
import { isReactChildren } from './RouteUtils'
import warning from './routerWarning'

const { array, func, object } = React.PropTypes

/**
 * A <RouterContext> renders the component tree for a given router state
 * and sets the history object and the current location in context.
 */
const RouterContext = React.createClass({

  propTypes: {
    history: object,
    router: object.isRequired,
    location: object.isRequired,
    routes: array.isRequired,
    params: object.isRequired,
    components: array.isRequired,
    createElement: func.isRequired
  },

  getDefaultProps() {
    return {
      createElement: React.createElement
    }
  },

  childContextTypes: {
    history: object,
    location: object.isRequired,
    router: object.isRequired
  },

  getChildContext() {
    let { router, history, location } = this.props
    if (!router) {
      warning(false, '`<RouterContext>` expects a `router` rather than a `history`')

      router = {
        ...history,
        setRouteLeaveHook: history.listenBeforeLeavingRoute
      }
      delete router.listenBeforeLeavingRoute
    }

    if (__DEV__) {
      location = deprecateObjectProperties(location, '`context.location` is deprecated, please use a route component\'s `props.location` instead. http://tiny.cc/router-accessinglocation')
    }

    return { history, location, router }
  },

  createElement(component, props) {
    return component == null ? null : this.props.createElement(component, props)
  },

  render() {
    const {
      history,
      previousLocation,
      location,
      routes,
      allRoutes,
      params,
      components
    } = this.props

    const allElements = getAllElements(allRoutes)

    function getAllElements (route, props = {}) {
      if (route === null) {
        return route
      }

      if (Array.isArray(route)) {
        return route.map(function (route) {
          return getAllElements(route, {key: route.path})
        })
      }

      if (route.component) {
        const isActive = routes.indexOf(route) > -1

        props = Object.assign({
          isActive,
          history,
          previousLocation,
          location,
          params,
          route,
          routeParams: getRouteParams(route, params),
          routes
        }, props)

        const children = route.childRoutes &&
          route.childRoutes.length &&
          getAllElements(route.childRoutes)

        if (children) {
          props.children = children
        }

        return React.createElement(
          route.component,
          props
        )
      }

      throw new Error('route is not null and it does not have a component: ', route)
    }

    if (Array.isArray(allElements)) {
      if (allElements.length === 1) {
        return allElements[0]
      } else {
        return this.createElement('div', {children: allElements})
      }
    } else {
      return allElements
    }
  }

})

export default RouterContext

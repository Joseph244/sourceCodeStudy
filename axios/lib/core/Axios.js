'use strict'

var utils = require('./../utils')
var buildURL = require('../helpers/buildURL')
var InterceptorManager = require('./InterceptorManager')
var dispatchRequest = require('./dispatchRequest')
var mergeConfig = require('./mergeConfig')

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig // 实例化的配置项
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  }
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = arguments[1] || {}
    config.url = arguments[0]
  } else {
    config = config || {}
  }

  config = mergeConfig(this.defaults, config)

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase()
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase()
  } else {
    config.method = 'get'
  }

  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined]
  var promise = Promise.resolve(config) // 作用是生成Promise实例，并将config作为参数传递给下一个promise调用方法中

  this.interceptors.request.forEach(function unshiftRequestInterceptors(
    interceptor
  ) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected) // 向chain的开头添加拦截器的resolve方法和reject方法，两个两个的插入
  })

  this.interceptors.response.forEach(function pushResponseInterceptors(
    interceptor
  ) {
    chain.push(interceptor.fulfilled, interceptor.rejected) // 把拦截器添加到chain的尾部
  })

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift()) // shift：把数组的第一个元素从其中删除，并返回第一个元素的值
  }

  return promise
}

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config)
  return buildURL(config.url, config.params, config.paramsSerializer).replace(
    /^\?/,
    ''
  )
}

// Provide aliases for supported request methods
utils.forEach(
  ['delete', 'get', 'head', 'options'],
  function forEachMethodNoData(method) {
    /*eslint func-names:0*/
    Axios.prototype[method] = function(url, config) {
      return this.request(
        mergeConfig(config || {}, {
          method: method,
          url: url
        })
      )
    }
  }
)

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(
      mergeConfig(config || {}, {
        method: method,
        url: url,
        data: data
      })
    )
  }
})

module.exports = Axios

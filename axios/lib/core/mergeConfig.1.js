'use strict'

var utils = require('../utils')

/**
 * 合并默认配置和传入配置
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} 合并之后的配置项
 */
module.exports = function mergeConfig(config1, config2) {
  config2 = config2 || {}
  var config = {}

  // 只取config2的属性key
  var valueFromConfig2Keys = ['url', 'method', 'data']
  //
  var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params']
  // 合并时以config2为主的属性key
  var defaultToConfig2Keys = [
    'baseURL',
    'transformRequest',
    'transformResponse',
    'paramsSerializer',
    'timeout',
    'timeoutMessage',
    'withCredentials',
    'adapter',
    'responseType',
    'xsrfCookieName',
    'xsrfHeaderName',
    'onUploadProgress',
    'onDownloadProgress',
    'decompress',
    'maxContentLength',
    'maxBodyLength',
    'maxRedirects',
    'transport',
    'httpAgent',
    'httpsAgent',
    'cancelToken',
    'socketPath',
    'responseEncoding'
  ]
  var directMergeKeys = ['validateStatus']

  /**
   * 在基准属性值source基础上合并传入的属性值target
   *
   * @param {value} target 传入的属性值
   * @param {value} source 基准属性值
   * @returns {value} 合并之后的属性值
   */
  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      // isPlainObjec为判断是否为对象的方法
      return utils.merge(target, source)
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source)
    } else if (utils.isArray(source)) {
      return source.slice()
    }
    return source
  }

  // 合并某个属性的值
  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      // 判断isUndefined
      config[prop] = getMergedValue(config1[prop], config2[prop])
    } else if (!utils.isUndefined(config1[prop])) {
      config[prop] = getMergedValue(undefined, config1[prop])
    }
  }

  /**
   * 只取config2中的属性： valueFromConfig2Keys中的属性
   * config2有就用config2，没有就不设置
   */
  utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(undefined, config2[prop])
    }
  })

  utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties)

  /**
   * config2优先的配置属性： defaultToConfig2Keys中的属性
   * config2有就用config2，config1有就用config1
   */
  utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(undefined, config2[prop])
    } else if (!utils.isUndefined(config1[prop])) {
      config[prop] = getMergedValue(undefined, config1[prop])
    }
  })

  utils.forEach(directMergeKeys, function merge(prop) {
    if (prop in config2) {
      config[prop] = getMergedValue(config1[prop], config2[prop])
    } else if (prop in config1) {
      config[prop] = getMergedValue(undefined, config1[prop])
    }
  })

  // 合并已定义属性数组
  var axiosKeys = valueFromConfig2Keys
    .concat(mergeDeepPropertiesKeys)
    .concat(defaultToConfig2Keys)
    .concat(directMergeKeys)

  // 合并已定义数组之外的其他属性
  var otherKeys = Object.keys(config1)
    .concat(Object.keys(config2))
    .filter(function filterAxiosKeys(key) {
      return axiosKeys.indexOf(key) === -1
    })

  utils.forEach(otherKeys, mergeDeepProperties)

  return config
}

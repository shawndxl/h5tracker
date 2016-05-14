/*<jdists encoding="fndep" import="./storage-list.js" depend="createStorageList">*/
var createStorageList = require('./storage-list').createStorageList;
/*</jdists>*/

/*<jdists encoding="fndep" import="./event.js" depend="createEmitter">*/
var createEmitter = require('./event').createEmitter;
/*</jdists>*/

/*<jdists encoding="fndep" import="./storage-sender.js" depend="createStorageSender">*/
var createStorageSender = require('./storage-sender').createStorageSender;
/*</jdists>*/

/*<function name="createStorage" depend="createStorageList,createEmitter,createStorageSender">*/
var storageSender = createStorageSender();

/**
 * 创建存储器
 *
 * @param {string} appName 应用名
 * @param {string} trackerName 追踪器名
 * @return {Object} 返回存储器
 */
function createStorage(appName, trackerName) {

  var instance = createEmitter();

  var storageListSend = createStorageList(appName, trackerName, 'send');
  var storageListLog = createStorageList(appName, trackerName, 'log');
  storageSender.scan();

  /**
   * 记录日志
   *
   * @param {Object} data 日志数据
   * @return {string} 返回记录 ID
   */
  function log(data) {
    storageListLog.clean();

    return storageListLog.push(data);
  }
  instance.log = log;

  /**
   * 拼装 URL 调用参数
   *
   * @param {Object} data 参数
   * @return {string} 返回拼接的字符串
   */
  function queryFrom(data) {
    var result = [];
    Object.keys(data).forEach(function(key) {
      if (data[key] === null) {
        return;
      }
      result.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    });
    return result.join('&');
  }

  /**
   * 发送数据
   *
   * @param {Object} data 发送数据
   * @param {string} accept 接收地址
   * @return {string} 返回记录 ID
   '''<example>'''
   * @example send():base
    ```js
    var storage = app.createStorage('h5t', 'scan');
    storage.send({
      hisType: 'pageview'
    }, '/host/path/to/t.gif');

    var data = JSON.parse(localStorage['h5t@storageList/h5t/scan/send']);

    console.log(data[0].data.accept);
    // > /host/path/to/t.gif

    console.log(data[0].data.query);
    // > hisType=pageview
    ```
   * @example send():acceptStyle
    ```js
    var storage = app.createStorage('h5t', 'scan2');
    storage.send({
      hisType: 'pageview'
    }, '/host/path/to/t.gif', 'path');

    var data = JSON.parse(localStorage['h5t@storageList/h5t/scan2/send']);

    console.log(data[0].data.acceptStyle);
    // > path
    ```
   '''</example>'''
   */
  function send(data, accept, acceptStyle) {
    storageListSend.clean();
    var id = storageListSend.push({
      accept: accept,
      acceptStyle: acceptStyle, // 发送格式 "path" | "query"
      query: queryFrom(data),
    });
    storageSender.scan();
  }
  instance.send = send;

  return instance;
}
/*</function>*/
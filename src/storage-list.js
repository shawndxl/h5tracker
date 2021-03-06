(function () {

  /*<jdists encoding="fndep" import="./common.js" depend="newGuid,format">*/
  var newGuid = require('./common').newGuid;
  var format = require('./common').format;
  /*</jdists>*/

  /*<jdists encoding="fndep" import="../node_modules/jsets/jsets.js" depend="createGetter">*/
  var createGetter = require('jsets').createGetter;
  /*</jdists>*/

  /*<jdists encoding="fndep" import="./storage-keys.js" depend="storageKeys">*/
  var storageKeys = require('./storage-keys').storageKeys;
  /*</jdists>*/

  /*<function name="createStorageList" depend="newGuid,format,storageKeys,createGetter">*/
  /**
   * 创建存储列表
   *
   * @param {string} appName 应用名
   * @param {string} trackerName 追踪器名
   * @param {string} listName 列表名称
   * @param {Object} storageConfig 存储配置项
   * @return {Object} 返回存储列表对象
   '''<example>'''
   * @example createStorageList():localStorageProxy assigned
    ```js
    var localStorageProxy = {};
    var oldLocalStorageProxy = app.storageConfig.localStorageProxy;
    app.storageConfig.localStorageProxy = localStorageProxy;

    var sessionManager = app.createSessionManager(app.storageConfig);
    var storageList = app.createStorageList('h5t', 'base1', 'log', app.storageConfig);
    storageList.push({
      level: 'info',
      message: 'click button1'
    });
    var data = JSON.parse(localStorageProxy['h5t@storageList/h5t/base1/log']);
    console.log(data.length);
    // > 1
    app.storageConfig.localStorageProxy = oldLocalStorageProxy;
    ```
   * @example createStorageList():storageExpires => 10000
    ```js
    var oldStorageExpires = app.storageConfig.storageExpires;
    app.storageConfig.storageExpires = 10000;

    var localStorage = app.storageConfig.localStorageProxy;
    var storageList = app.createStorageList('h5t', 'base2', 'log', app.storageConfig);
    storageList.push({
      level: 'info',
      message: 'click button1'
    });
    var data = JSON.parse(localStorage['h5t@storageList/h5t/base2/log']);
    console.log(data[0].expires);
    // > 10000

    app.storageConfig.storageExpires = oldStorageExpires;
    ```
   '''</example>'''
   */
  function createStorageList(appName, trackerName, listName, storageConfig) {

    // 参数默认值
    var storageInstance = storageConfig.localStorageProxy;

    var instance = {};
    var scope = {
      name: listName,
      app: appName,
      tracker: trackerName,
    };
    /**
     * 时间戳字段名
     */
    var storageListTSKey = format(storageKeys.storageListTS, scope);
    var storageListKey = format(storageKeys.storageList, scope);

    /**
     * 记录列表
     */
    var list;

    /**
     * 更新时间戳
     *
     * @type {[type]}
     */
    var timestamp = null;

    /**
     * 记录最小过期时间
     *
     * @type {Number}
     */
    var minExpiresTime = null;

    /**
     * 加载列表
     */
    function load() {
      if (storageInstance[storageListTSKey] !== timestamp) {
        list = null;
      }
      if (!list) {
        try {
          list = JSON.parse(storageInstance[storageListKey] || '[]');
          timestamp = storageInstance[storageListTSKey];
        } catch (ex) {
          list = [];
        }
      }
    }

    /**
     * 保存列表
     */
    function save() {
      storageInstance[storageListTSKey] = newGuid();
      storageInstance[storageListKey] = JSON.stringify(list);
    }

    /**
     * 追加数据到列表中
     *
     * @param {Object} data 保存数据
     * @param {Number} expire 过期时间，单位：秒
     '''<example>'''
     * @example push():base
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var storageList = app.createStorageList('h5t', 'push_case_1', 'log', app.storageConfig);
      storageList.push({
        level: 'info',
        message: 'click button1'
      });
      storageList.push({
        level: 'info',
        message: 'click button2'
      });
      var data = JSON.parse(localStorage['h5t@storageList/h5t/push_case_1/log']);
      console.log(data.length);
      // > 2
      console.log(data[0].data.message);
      // > click button1
      console.log(data[1].data.message);
      // > click button2
      ```
     * @example push():storageMaxCount = 5
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var oldStorageMaxCount = app.storageConfig.storageMaxCount;
      app.storageConfig.storageMaxCount = 5;
      var storageList = app.createStorageList('h5t', 'push_case_2', 'log', app.storageConfig);
      for (var i = 0; i < 6; i++ ) {
        storageList.push({
          level: 'info',
          message: 'click button' + i
        });
      }
      var data = JSON.parse(localStorage['h5t@storageList/h5t/push_case_2/log']);
      console.log(data.length);
      // > 5
      app.storageConfig.storageMaxCount = oldStorageMaxCount;
      ```
     '''</example>'''
     */
    function push(data) {
      load();

      var id = newGuid();
      var birthday = Date.now();
      while (list.length >= storageConfig.storageMaxCount) { // 清除历史数据
        list.shift();
      }
      list.push({
        id: id,
        birthday: birthday,
        expires: storageConfig.storageExpires,
        tried: 0, // 尝试发送次数
        data: data
      });

      save();
      return id;
    }
    instance.push = push;

    /**
     * 列表数组
     *
     * @return {Object} 返回最后一个元素，如果列表为空则返回 undefined
     '''<example>'''
     * @example toArray():base
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var storageList = app.createStorageList('h5t', 'toArray', 'log', app.storageConfig);
      storageList.push({
        level: 'info',
        message: 'click button1'
      });
      storageList.push({
        level: 'info',
        message: 'click button2'
      });
      var data = JSON.parse(localStorage['h5t@storageList/h5t/toArray/log']);
      var items = storageList.toArray();
      console.log(items.pop().data.message);
      // > click button2
      console.log(items.pop().data.message);
      // > click button1
      ```
     '''</example>'''
     */
    function toArray() {
      load();
      return list.slice();
    }
    instance.toArray = toArray;

    /**
     * 清除清除过期数据
     *
     * @return {Number} 返回被清除的记录数
     '''<example>'''
     * @example clean():base
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var storageList = app.createStorageList('h5t', 'clean', 'log', app.storageConfig);
      storageList.push({
        level: 'info',
        message: 'click button1'
      });
      storageList.push({
        level: 'info',
        message: 'click button2'
      });
      storageList.push({
        level: 'info',
        message: 'click button3'
      });

      var data = JSON.parse(localStorage['h5t@storageList/h5t/clean/log']);
      data[1].birthday = 0;
      localStorage['h5t@storageList/h5t/clean/log'] = JSON.stringify(data);

      storageList.clean();
      data = JSON.parse(localStorage['h5t@storageList/h5t/clean/log']);
      console.log(data.length);
      // > 2
      console.log(data[0].data.message);
      // > click button1
      console.log(data[1].data.message);
      // > click button3
      ```
     * @example clean():localStorage JSON error
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var storageList = app.createStorageList('h5t', 'clean_case2', 'log', app.storageConfig);
      localStorage['h5t@storageList/h5t/clean_case2/log'] = '#error';
      storageList.clean();
      var data = JSON.parse(localStorage['h5t@storageList/h5t/clean_case2/log']);
      console.log(data);
      // > []
      ```
     * @example clean():localStorage timestamp change
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var storageList = app.createStorageList('h5t', 'clean_case3', 'log', app.storageConfig);
      storageList.push({
        level: 'info',
        message: 'click button1'
      });
      var data = JSON.parse(localStorage['h5t@storageList/h5t/clean_case3/log']);
      data[0].birthday = 0;
      localStorage['h5t@storageList/h5t/clean_case3/log'] = JSON.stringify(data);
      localStorage['h5t@storageList/h5t/clean_case3/log/ts'] = 0;
      storageList.clean();
      data = JSON.parse(localStorage['h5t@storageList/h5t/clean_case3/log']);
      console.log(data);
      // > []

      console.log(localStorage['h5t@storageList/h5t/clean_case3/log/ts'] !== '0');
      // > true
      ```
     * @example clean():×2
      ```js
      var storageList = app.createStorageList('h5t', 'clean_case4', 'log', app.storageConfig);
      storageList.clean();
      storageList.clean();
      ```
     * @example clean():minExpiresTime
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var storageList = app.createStorageList('h5t', 'clean_case5', 'log', app.storageConfig);
      storageList.push({
        level: 'info',
        message: 'click button1'
      });
      storageList.push({
        level: 'info',
        message: 'click button2'
      });
      var data = JSON.parse(localStorage['h5t@storageList/h5t/clean_case5/log']);
      data[0].expires = 0.001;
      localStorage['h5t@storageList/h5t/clean_case5/log'] = JSON.stringify(data);
      storageList.clean();
      storageList.clean();
      setTimeout(function () {
        storageList.clean();
        data = JSON.parse(localStorage['h5t@storageList/h5t/clean_case5/log']);
        console.log(data.length);
        // > 1
        // * done
      }, 100);
      ```
     '''</example>'''
     */
    function clean() {
      load();

      var count = 0;
      var now = Date.now();

      if (minExpiresTime !== null) {
        if (minExpiresTime < now) { // 有记录要过期
          minExpiresTime = null;
        } else { // 没有记录需要清除
          return count;
        }
      }

      list = list.filter(function(item) {
        var expiresTime = item.birthday + item.expires * 1000;
        if (expiresTime < now) { // 已经过期
          count++;
          return false;
        }
        if (minExpiresTime !== null) {
          minExpiresTime = Math.min(minExpiresTime, expiresTime);
        } else {
          minExpiresTime = expiresTime;
        }
        return true;
      });
      save();
      return count;
    }
    instance.clean = clean;

    /**
     * 移除记录
     *
     * @param {string} id 记录标识
     * @return {boolean} 返回是否移除成功
     '''<example>'''
     * @example remove():base
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var storageList = app.createStorageList('h5t', 'remove', 'log', app.storageConfig);
      var id1 = storageList.push({
        level: 'info',
        message: 'click button1'
      });
      var id2 = storageList.push({
        level: 'info',
        message: 'click button2'
      });
      storageList.clean();
      storageList.remove(id1);
      var data = JSON.parse(localStorage['h5t@storageList/h5t/remove/log']);
      console.log(data.length);
      // > 1
      console.log(data[0].id === id2);
      // > true
      ```
     '''</example>'''
     */
    function remove(id) {
      load();

      list = list.filter(function(item) {
        if (id === item.id) {
          if (item.birthday + item.expires * 1000 === minExpiresTime) {
            minExpiresTime = null;
          }
          return false;
        }
        return true;
      });

      save();
    }
    instance.remove = remove;

    /**
     * 更新数据
     *
     * @param {string} id 记录标识
     * @param {Object} item 修改项
     * @return {boolean} 返回是否修改成功
     '''<example>'''
     * @example update():base
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var storageList = app.createStorageList('h5t', 'update', 'send', app.storageConfig);
      var id1 = storageList.push({
        level: 'info',
        message: 'click button1'
      });
      storageList.update(id1, {
        tried: 2
      });
      var data = JSON.parse(localStorage['h5t@storageList/h5t/update/send']);
      console.log(data[0].tried === 2);
      // > true
      ```
     * @example update():not exists
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var storageList = app.createStorageList('h5t', 'update_case2', 'send', app.storageConfig);
      var id1 = storageList.push({
        level: 'info',
        message: 'click button1'
      });
      storageList.update('null', {
        level: 'debug'
      });
      var data = JSON.parse(localStorage['h5t@storageList/h5t/update_case2/send']);
      console.log(data[0].data.level);
      // > info
      ```
     '''</example>'''
     */
    function update(id, item) {
      var data = instance.get(id);
      if (!data) {
        return;
      }
      Object.keys(item).forEach(function(key) {
        data[key] = item[key];
      });
      save();
      return true;
    }
    instance.update = update;

    /**
     * 查询数据
     *
     * @param {string} id 记录标识
     * @return {boolean} 返回记录数据
     '''<example>'''
     * @example get():base
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var storageList = app.createStorageList('h5t', 'get', 'send', app.storageConfig);
      var id1 = storageList.push({
        level: 'info',
        message: 'click button1'
      });
      var item = storageList.get(id1);
      var data = JSON.parse(localStorage['h5t@storageList/h5t/get/send']);
      console.log(item.id === id1);
      // > true
      ```
     '''</example>'''
     */
    instance.get = createGetter(instance, function(id) {
      load();
      var result;
      list.some(function(item) {
        if (id === item.id) {
          result = item;
          return item;
        }
      });
      return result;
    }, true);


    return instance;
  }
  /*</function>*/

  exports.createStorageList = createStorageList;

})();
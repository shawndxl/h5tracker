(function() {

  /*<jdists encoding="fndep" import="./event.js" depend="createEmitter">*/
  var createEmitter = require('./event').createEmitter;
  /*</jdists>*/

  /*<jdists encoding="fndep" import="../node_modules/jsets/jsets.js" depend="createGetter,createSetter">*/
  var createGetter = require('jsets').createGetter;
  var createSetter = require('jsets').createSetter;
  /*</jdists>*/

  /*<jdists encoding="fndep" import="./storage.js" depend="createStorage">*/
  var createStorage = require('./storage').createStorage;
  /*</jdists>*/

  /*<jdists encoding="fndep" import="./common.js" depend="newGuid">*/
  var newGuid = require('./common').newGuid;
  /*</jdists>*/

  /*<function name="createTracker" depend="createEmitter,createGetter,createSetter,createStorage,newGuid">*/
  /**
   * 创建追踪器
   *
   * @param {string} name 追踪器名称
   * @return {Object} 返回追踪器实例
   '''<example>'''
   * @example createTracker():base
    ```js
    var tracker = app.createTracker('h5t', 'base', app.sessionManager, app.storageSender, app.storageConfig);
    var count = 0;
    tracker.error('error1');
    tracker.send({
      ht: 'pageview'
    });
    tracker.on('log', function (data) {
      console.log(count++);
      // > 1

      console.log(data.level);
      // > error

      console.log(data.message);
      // > error1
    });
    tracker.create({
      accept: 'http://host/path/to',
      data: {
        do: 'h5t.com',
        lo: '/home'
      },
      event: {
        send: function (data) {
          console.log(count++);
          // > 2

          console.log(data.do);
          // > h5t.com

          console.log(data.lo);
          // > /home
        },
        log: function (data) {
          console.log(count++);
          // > 0

          console.log(data.level);
          // > error

          console.log(data.message);
          // > error1
        }
      },
    });
    ```
   '''</example>'''
   */
  function createTracker(appName, trackerName, sessionManager, storageSender, storageConfig) {
    /**
     * 追踪器实例
     *
     * @type {Object}
     */
    var instance = createEmitter();
    instance.name = trackerName;

    var storage = createStorage(appName, trackerName, storageConfig);
    storage.on('send', function() { // 立即触发日志发送
      storageSender.scan();
    });

    /**
     * 字段列表
     *
     * @type {Object}
     */
    var fields = {};
    /**
     * 设置获取字段
     *
     '''<example>'''
     * @example set() & get():base
      ```js
      var tracker = app.createTracker('h5t', 'setter', app.sessionManager, app.storageSender, app.storageConfig);
      tracker.set({
        x: 1,
        y: 2
      });
      tracker.get(function (y, x) {
        console.log(x, y);
        // > 1 2
      });

      ```
     '''</example>'''
     */
    instance.set = createSetter(instance, function(name, value) {
      fields[name] = value;
    }, true);
    instance.get = createGetter(instance, function(name) {
      return fields[name];
    }, true);


    /**
     * 行为数组
     *
     * @type {Array}
     */
    var actionList = [];
    /**
     * 配置项
     *
     * @type {Object}
     */
    var options;

    /**
     * 发送数据
     *
     * @param {Object} data 发送日志
     '''<example>'''
     * @example send():field is null
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var tracker = app.createTracker('h5t', 'send_case_1', app.sessionManager, app.storageSender, app.storageConfig);
      tracker.set({
        x: 1,
        y: 2,
        rid: null,
        uid: null,
        sid: null,
        seq: null,
        time: null
      });
      tracker.send({z: 3});
      tracker.send({
        z: null,
        rid: null
      });
      tracker.create({
        accept: '/host/case1',
        data: {
          z: 'z3'
        }
      });

      var data = JSON.parse(localStorage['h5t@storageList/h5t/send_case_1/send']);

      console.log(data[0].data.query);
      // > z=3&x=1&y=2

      console.log(data[1].data.query);
      // > x=1&y=2
      ```
     * @example send():accept is null
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var tracker = app.createTracker('h5', 'send_case_2', app.sessionManager, app.storageSender, app.storageConfig);
      tracker.send({z: 3});
      tracker.create({});

      console.log(typeof localStorage['h5t@storageList/h5t/send_case_2/send']);
      // > undefined
      ```
     * @example send():event {}
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var tracker = app.createTracker('h5t', 'send_case_3', app.sessionManager, app.storageSender, app.storageConfig);
      tracker.send({message: 'case_3'});
      tracker.create({
        accept: '/host/case3',
        event: {}
      });
      ```
     * @example send():string
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var tracker = app.createTracker('h5t', 'send_case_4', app.sessionManager, app.storageSender, app.storageConfig);
      tracker.send('pageview');
      tracker.create({
        accept: '/host/case4'
      });

      var data = JSON.parse(localStorage['h5t@storageList/h5t/send_case_4/send']);
      console.log(/ht=pageview/.test(data[0].data.query));
      // > true
      ```
     '''</example>'''
     */
    function send(data) {
      if (actionList) {
        actionList.push({
          name: 'send',
          data: data
        });
        return;
      }
      /*<safe>*/
      if (!options.accept) {
        console.error('options.accept is undefined.');
        return;
      }
      /*</safe>*/
      // merge data
      var item = {
        rid: newGuid(), // record id
        uid: sessionManager.get('uid'),
        sid: sessionManager.get('sid'),
        seq: sessionManager.get('seq'),
        time: (Date.now() - sessionManager.get('birthday')).toString(36)
      };
      if (options.data) {
        Object.keys(options.data).forEach(function(key) {
          item[key] = options.data[key];
        });
      }
      Object.keys(fields).forEach(function(key) {
        item[key] = fields[key];
      });
      if (typeof data === 'string') {
        data = {
          ht: data // hit type // "event" | "pageview" | "appview"
        };
      }
      Object.keys(data).forEach(function(key) {
        item[key] = data[key];
      });
      emitEvent('send', item);
      storage.send(item, options.accept, options.acceptStyle);
    }
    instance.send = send;

    /**
     * 打印日志
     *
     * @param {Object|String} data 日志参数
     '''<example>'''
     * @example log():case 1
      ```js
      var localStorage = app.storageConfig.localStorageProxy;
      var tracker = app.createTracker('h5t', 'log_case_1', app.sessionManager, app.storageSender, app.storageConfig);
      tracker.set({
        x: 1,
        y: 2
      });
      tracker.log('default log.');
      tracker.log({
        'level': 'warn',
        'message': 'hello'
      });
      tracker.debug('debug log.');
      tracker.info('info log.');
      tracker.warn('warn log.');
      tracker.fatal('fatal log.');
      tracker.create({});

      var data = JSON.parse(localStorage['h5t@storageList/h5t/log_case_1/log']);

      data.forEach(function (item) {
        console.log(item.data.level, item.data.message);
      });
      // > debug default log.
      // > warn hello
      // > debug debug log.
      // > info info log.
      // > warn warn log.
      // > fatal fatal log.
      ```
     * @example log():level is undefined
      ```js
      var tracker = app.createTracker('h5t', 'log_case_2', app.sessionManager, app.storageSender, app.storageConfig);
      tracker.log({});
      tracker.create({});
      ```
     * @example log():event {}
      ```js
      var tracker = app.createTracker('h5t', 'log_case_3', app.sessionManager, app.storageSender, app.storageConfig);
      tracker.log('case3');
      tracker.create({
        event: {}
      });
      ```
     '''</example>'''
     */
    function log(data) {
      if (typeof data === 'string') {
        data = {
          message: data,
          level: 'debug'
        };
      }
      /*<safe>*/
      if (!data.level) {
        console.error('log level is undefined.');
        return;
      }
      /*</safe>*/
      if (actionList) {
        actionList.push({
          name: 'log',
          data: data
        });
        return;
      }
      var item = {};
      Object.keys(data).forEach(function(key) {
        item[key] = data[key];
      });
      emitEvent('log', item);
      /*<debug>*/
      // console[data.level].call(console, data.message);
      /*</debug>*/
      storage.log(item);
    }
    instance.log = log;

    ['debug', 'info', 'warn', 'error', 'fatal'].forEach(function(level) {
      instance[level] = function(message) {
        log({
          level: level,
          message: message
        });
      };
    });

    // h5t('tracker.error', 'eraaesfads')
    /**
     * 创建
     * @param {Object} options 配置对象
     '''<example>'''
     * @example create():opts in undefined
      ```js
      var tracker = app.createTracker('h5t', 'create_case_1', app.sessionManager, app.storageSender, app.storageConfig);
      tracker.create();
      ```
     * @example create():duplicate create
      ```js
      var tracker = app.createTracker('h5t', 'create_case_2', app.sessionManager, app.storageSender, app.storageConfig);
      tracker.create({});
      tracker.create({});
      ```
     '''</example>'''
     */
    function create(opts) {
      /*<safe>*/
      if (!actionList) {
        console.error('Cannot duplicate create tracker.');
        return;
      }
      if (!opts) {
        console.error('Parameter "opts" cannot be empty.');
        return;
      }
      /*</safe>*/
      options = opts;
      var temp = actionList;
      actionList = null;
      temp.forEach(function(item) {
        instance[item.name](item.data);
      });
    }
    instance.create = create;

    /**
     * 配置事件通知
     */
    function emitEvent(name) {
      if (options && options.event) {
        var fn = options.event[name];
        if (typeof fn === 'function') {
          fn.apply(instance, [].slice.call(arguments, 1));
        }
      }
      instance.emit.apply(instance, arguments);
    }
    instance.emitEvent = emitEvent;

    return instance;
  }
  /*</function>*/
  exports.createTracker = createTracker;

})();
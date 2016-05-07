'use strict';

/**
 * 模拟 DOM
 */
class EventTarget {
  constructor() {
    this._listeners = [];
  }

  addEventListener(eventName, handler) {
    if (typeof handler === 'function') {
      this._listeners.push([eventName, handler]);
    }
  }

  dispatchEvent(eventName) {
    var eventData = {
      name: eventName
    };
    if (eventName instanceof HTMLEvents) {
      eventName = eventName.type;
    }
    var self = this;
    this._listeners.forEach(function(item) {
      if (item[0] === eventName) {
        item[1].call(self, eventData);
      }
    });
  }
}

class Node extends EventTarget {
  constructor(nodeName) {
    super();
    this._nodeName = nodeName;
    this._childNodes = [];
  }

  appendChild(node) {
    this._childNodes.push(node);
  }

  get childNodes() {
    return this._childNodes;
  }
}

class HTMLElement extends Node {
  constructor(tagName) {
    super(tagName);
    this._tagName = tagName;
    this._style = {};
    this._id = undefined;
  }
  get style() {
    return this._style;
  }
  set id(value) {
    this._id = value;
  }
  get id() {
    return this._id;
  }
}

class HTMLIFrameElement extends HTMLElement {
  constructor() {
    super('iframe');
    this._src = undefined;
  }
  get src() {
    return this._src;
  }
  set src(value) {
    this._src = value;
    this.dispatchEvent('load');
  }
}

class HTMLHtmlElement extends HTMLElement {
  constructor() {
    super('html');
  }
}

class HTMLDocument extends Node {
  constructor() {
    super('#document');
    this._documentElement = new HTMLHtmlElement();
    this.appendChild(this._documentElement);
  }

  createElement(tagName) {
    tagName = tagName.toLowerCase();
    switch (tagName) {
      case 'iframe':
        return new HTMLIFrameElement();
    }
    return new HTMLElement(tagName);
  }

  createEvent(eventType) {
    switch (eventType) {
      case 'HTMLEvents':
        return new HTMLEvents();
    }
  }

  get documentElement() {
    return this._documentElement;
  }

  getElementById(id) {
    var result;

    function scan(childNodes) {
      childNodes.every(function(node) {
        if (node.id === id) {
          result = node;
        } else {
          scan(node.childNodes);
        }
        return !result;
      });
    }
    scan(this.childNodes);
    return result;
  }
}

class HTMLWindow extends EventTarget {
  constructor() {
    super();
    this._document = new HTMLDocument();
  }

  get document() {
    return this._document;
  }
}

class HTMLEvents {
  initEvent(type, bubbles, cancelable) {
    this._type = type;
    this._bubbles = bubbles;
    this._cancelable = cancelable;
  }
  get type() {
    return this._type;
  }
}

var window = new HTMLWindow();
exports.window = window;
exports.document = window.document;

/**
 * MDN docs about needed APIs
 * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements
 */

type EventTypeT = keyof HTMLElementEventMap | string;
type HandlerNameT = string;
type IEventOptions = string;

interface ConstructableComponent<T extends Component> {
  new (): T;
  prototype: T;
  _attrs: Map<string, string>;
  _propsObservers: Map<string, Set<string>>;
  observedAttributes: Array<string> | undefined;
  template: HTMLTemplateElement;
}

export class Component extends HTMLElement {
  shadowRoot: ShadowRoot;
  _events: Map<EventTypeT, Array<[HandlerNameT, IEventOptions]>>;
  _wasInit: boolean | undefined;
  _deferredObservers: Map<string, any>;

  static _attrs: Map<string, string>;
  static _propsObservers: Map<string, Set<string>>;
  static template: HTMLTemplateElement;

  static get observedAttributes(): Array<string> | undefined {
    return this._attrs ? [...this._attrs.keys()] : undefined;
  }

  constructor() {
    super();

    if (this._events === undefined) {
      this._events = new Map();
    }
    const template = (this.constructor as typeof Component).template;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  /**
   * Private API
   */

  private _handler = (event: Event) => {
    const target = event.target as Element;

    for (let [name, selector] of this._events.get(event.type)!) {
      if (selector === ":host") {
        if (target === this) {
          this[name as keyof this](event);
        }
      } else if (selector === "*") {
        if (this.shadowRoot.contains(target)) {
          this[name as keyof this](event);
        }
      } else {
        if (target.matches(selector)) {
          this[name as keyof this](event);
        }
      }
    }
  };

  private _registerEvents() {
    const eventsTypes: Set<string> = new Set();
    const eventsTypesShadowRoot: Set<string> = new Set();

    for (let [eventType, handlers] of this._events) {
      for (let [, selector] of handlers) {
        if (selector === ":host") {
          eventsTypes.add(eventType);
        } else {
          eventsTypesShadowRoot.add(eventType);
        }
      }
    }

    for (let eventType of eventsTypes) {
      this.addEventListener(eventType, this._handler, false);
    }

    for (let eventType of eventsTypesShadowRoot) {
      this.shadowRoot.addEventListener(eventType, this._handler, false);
    }
  }

  private _unregisterEvents() {
    const eventsTypes: Set<string> = new Set();
    const eventsTypesShadowRoot: Set<string> = new Set();

    for (let [eventType, handlers] of this._events) {
      for (let [, selector] of handlers) {
        if (selector === ":host") {
          eventsTypes.add(eventType);
        } else {
          eventsTypesShadowRoot.add(eventType);
        }
      }
    }

    for (let eventType of eventsTypes) {
      this.removeEventListener(eventType, this._handler, false);
    }

    for (let eventType of eventsTypesShadowRoot) {
      this.shadowRoot.removeEventListener(eventType, this._handler, false);
    }
  }

  init() {}

  destroy() {}

  /**
   * Custom elements events
   */

  connectedCallback() {
    this._registerEvents();

    if (Component.prototype.init !== this.init) {
      this.init();
    }

    this._wasInit = true;
    updateDeferredObservers(this);
  }

  disconnectedCallback() {
    this._unregisterEvents();

    if (Component.prototype.destroy !== this.destroy) {
      this.destroy();
    }
  }

  attributeChangedCallback(attr: string, oldValue: string | undefined, newValue: string | undefined) {
    const attrs = (this.constructor as typeof Component)._attrs;

    if (attrs != null && oldValue !== newValue) {
      const attrName = attrs.get(attr);
      if (attrName) {
        this[attrName as keyof this](newValue, oldValue);
      }
    }
  }
}

export function on<T extends Component>(eventName: EventTypeT, options?: IEventOptions) {
  return function(target: T, key: HandlerNameT) {
    if (target._events == null) {
      target._events = new Map();
    }

    let eventList = target._events.get(eventName);

    if (!eventList) {
      eventList = [];
      target._events.set(eventName, eventList);
    }

    eventList.push([key, options || "*"]);
  };
}

export function attr<T extends Component, K extends string>(attrName?: string) {
  return function(target: T, key: K) {
    const Class = target.constructor as typeof Component;

    if (Class._attrs === undefined) {
      Class._attrs = new Map();
    }

    Class._attrs.set(attrName || key, key);
  };
}

function updateObservers<T extends Component, K extends string>(target: T, key: K, value: any) {
  const Class = target.constructor as typeof Component;

  const observers = Class._propsObservers.get(key);
  if (observers) {
    for (let observer of observers) {
      target[observer as keyof typeof target](value);
    }
  }
}

function updateDeferredObservers<T extends Component>(target: T) {
  if (target._deferredObservers) {
    for (let [key, value] of target._deferredObservers) {
      updateObservers(target, key, value);
    }

    target._deferredObservers.clear();
  }
}

export function prop<T extends Component, K extends string>() {
  return function(target: T, key: K) {
    const hiddenKey = "__propDecorator__" + key;

    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,

      get(this: typeof target) {
        return this[hiddenKey as keyof typeof target];
      },

      set(this: typeof target, newValue: any) {
        const oldValue = this[hiddenKey as keyof typeof target];
        const shouldUpdate = !Object.is(oldValue, newValue);
        this[hiddenKey as keyof typeof target] = newValue;

        if (shouldUpdate) {
          if (this._wasInit === true) {
            updateObservers(this, key, newValue);
          } else {
            if (this._deferredObservers === undefined) {
              this._deferredObservers = new Map();
            }

            this._deferredObservers.set(key, newValue);
          }
        }
      },
    });
  };
}

export function observer<T extends Component, K extends string>(prop: string) {
  return function(target: T, key: K) {
    const Class = target.constructor as typeof Component;

    if (Class._propsObservers === undefined) {
      Class._propsObservers = new Map();
    }

    let observers = Class._propsObservers.get(prop);
    if (observers === undefined) {
      observers = new Set();
      Class._propsObservers.set(prop, observers);
    }

    observers.add(key);
  };
}

export function selector<T extends Component>(selector: string) {
  return function(target: T, key: string) {
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: false,
      get(this: T) {
        return this.shadowRoot.querySelector(selector);
      },
    });
  };
}

export function define(template: HTMLTemplateElement) {
  return function(target: ConstructableComponent<any>) {
    const customElementName = target.name.replace(/[A-Z]/g, str => "-" + str.toLowerCase()).replace(/^\-/, "");

    if (customElements.get(customElementName)) {
      throw new Error(`You have multiple duplicated definition of <${customElementName}>`);
    }

    const Target = target;
    Target.template = template;
    customElements.define(customElementName, Target);
    return Target;
  };
}

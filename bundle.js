(function (jsPDF) {
'use strict';

const template = document.createElement("template");
        template.innerHTML = `<style>
  :host {
    width: 100%;
    height: 100%;
    display: block;
    position: relative;
  }

  .body {
    height: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: 1fr auto;
  }

  .tools {
    grid-column: 1 / 3;
  }

  .main {
    padding: 20px;
  }
</style>

<div class="body">
  <div class="main">
    <x-file-loader id="fileLoader"></x-file-loader>
  </div>
  <x-preview id="preview" size="200" class="preview"></x-preview>
  <x-header class="tools"></x-header>
</div>
`;

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

/**
 * MDN docs about needed APIs
 * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements
 */
class Component extends HTMLElement {
    constructor() {
        super();
        /**
         * Private API
         */
        this._handler = (event) => {
            const target = event.target;
            for (let [name, selector] of this._events.get(event.type)) {
                if (selector === ":host") {
                    if (target === this) {
                        this[name](event);
                    }
                }
                else if (selector === "*") {
                    if (this.shadowRoot.contains(target)) {
                        this[name](event);
                    }
                }
                else {
                    if (target.matches(selector)) {
                        this[name](event);
                    }
                }
            }
        };
        if (this._events === undefined) {
            this._events = new Map();
        }
        const template = this.constructor.template;
        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    static get observedAttributes() {
        return this._attrs ? [...this._attrs.keys()] : undefined;
    }
    _registerEvents() {
        const eventsTypes = new Set();
        const eventsTypesShadowRoot = new Set();
        for (let [eventType, handlers] of this._events) {
            for (let [, selector] of handlers) {
                if (selector === ":host") {
                    eventsTypes.add(eventType);
                }
                else {
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
    _unregisterEvents() {
        const eventsTypes = new Set();
        const eventsTypesShadowRoot = new Set();
        for (let [eventType, handlers] of this._events) {
            for (let [, selector] of handlers) {
                if (selector === ":host") {
                    eventsTypes.add(eventType);
                }
                else {
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
    init() { }
    destroy() { }
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
    attributeChangedCallback(attr, oldValue, newValue) {
        const attrs = this.constructor._attrs;
        if (attrs != null && oldValue !== newValue) {
            const attrName = attrs.get(attr);
            if (attrName) {
                this[attrName](newValue, oldValue);
            }
        }
    }
}
function on(eventName, options) {
    return function (target, key) {
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
function attr(attrName) {
    return function (target, key) {
        const Class = target.constructor;
        if (Class._attrs === undefined) {
            Class._attrs = new Map();
        }
        Class._attrs.set(attrName || key, key);
    };
}
function updateObservers(target, key, value) {
    const Class = target.constructor;
    const observers = Class._propsObservers.get(key);
    if (observers) {
        for (let observer of observers) {
            target[observer](value);
        }
    }
}
function updateDeferredObservers(target) {
    if (target._deferredObservers) {
        for (let [key, value] of target._deferredObservers) {
            updateObservers(target, key, value);
        }
        target._deferredObservers.clear();
    }
}
function prop() {
    return function (target, key) {
        const hiddenKey = "__propDecorator__" + key;
        Object.defineProperty(target, key, {
            configurable: true,
            enumerable: true,
            get() {
                return this[hiddenKey];
            },
            set(newValue) {
                const oldValue = this[hiddenKey];
                const shouldUpdate = !Object.is(oldValue, newValue);
                this[hiddenKey] = newValue;
                if (shouldUpdate) {
                    if (this._wasInit === true) {
                        updateObservers(this, key, newValue);
                    }
                    else {
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
function observer(prop) {
    return function (target, key) {
        const Class = target.constructor;
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
function selector(selector) {
    return function (target, key) {
        Object.defineProperty(target, key, {
            configurable: true,
            enumerable: false,
            get() {
                return this.shadowRoot.querySelector(selector);
            },
        });
    };
}
function define(template) {
    return function (target) {
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

const MIME_TYPE_PNG = "image/png";
const MIME_TYPE_JPEG = "image/jpeg";
let XApp = XApp_1 = class XApp extends Component {
    handleImages(event) {
        for (let image of event.detail) {
            this.$preview.push(image);
        }
    }
    handleClear() {
        document.querySelector("x-app").remove();
        document.body.appendChild(new XApp_1());
    }
    handleDownload() {
        const items = this.$preview.getPages();
        const doc = new jsPDF("p", "mm", "a4");
        const WIDTH = 210;
        const HEIGHT = 297;
        for (let [index, item] of items.entries()) {
            if (index > 0) {
                doc.addPage();
            }
            const [width, height] = item.width > item.height
                ? [WIDTH, WIDTH * item.height / item.width]
                : [HEIGHT * item.width / item.height, HEIGHT];
            const type = getImageType(item.mimeType);
            doc.addImage(item.base64, type, 0, 0, width, height);
        }
        doc.save("untitled.pdf");
    }
};
__decorate([
    selector("#preview")
], XApp.prototype, "$preview", void 0);
__decorate([
    on("images")
], XApp.prototype, "handleImages", null);
__decorate([
    on("clear")
], XApp.prototype, "handleClear", null);
__decorate([
    on("download")
], XApp.prototype, "handleDownload", null);
XApp = XApp_1 = __decorate([
    define(template)
], XApp);
function getImageType(mimeType) {
    switch (mimeType) {
        case MIME_TYPE_PNG:
            return "png";
        case MIME_TYPE_JPEG:
            return "jpg";
    }
    throw new TypeError(`unknown mime type of ${mimeType}`);
}
var XApp_1;

const template$2 = document.createElement("template");
        template$2.innerHTML = `<style>
  :host {
    height: 100%;
    display: block;
    user-select: none;
    cursor: default;
  }

  * {
    box-sizing: border-box;
  }

  .body {
    width: 100%;
    height: 100%;
    display: flex;
    background-color: #ddd;
    border: dashed 5px transparent;
    border-radius: 10px;
    transition: background-color 250ms;
  }

  .body--dragOver {
    background-color: #666;
    border: dashed 5px #333;
  }

  .body--dragOver>.title {
    color: white;
  }

  .title {
    margin: auto;
  }
</style>
<div id="body" class="body">
  <div class="title">File uploader</div>
</div>
`;

function readFiles(files) {
    const promises = files.map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        filename: file.name,
                        base64: reader.result,
                        width: img.width,
                        height: img.height,
                        mimeType: String(file.type),
                    });
                };
                img.onerror = reject;
                img.onabort = reject;
                img.src = reader.result;
            };
            reader.onerror = reject;
            reader.onabort = reject;
            reader.readAsDataURL(file);
        });
    });
    return Promise.all(promises);
}

const MIME_TYPE_PNG$1 = "image/png";
const MIME_TYPE_JPEG$1 = "image/jpeg";
function getDropImageFiles(dataTransfer) {
    const { files } = dataTransfer;
    const imagesFiles = [];
    for (let i = 0; i < files.length; i++) {
        let file = files.item(i);
        switch (file.type) {
            case MIME_TYPE_PNG$1:
            case MIME_TYPE_JPEG$1:
                imagesFiles.push(file);
            default:
        }
    }
    return imagesFiles;
}

let XFileLoader = class XFileLoader extends Component {
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        this.$el.classList.add("body--dragOver");
    }
    handleDragLeave(__event) {
        this.$el.classList.remove("body--dragOver");
    }
    handleDrop(event) {
        event.stopPropagation();
        event.preventDefault();
        this.$el.classList.remove("body--dragOver");
        readFiles(getDropImageFiles(event.dataTransfer)).then((detail) => {
            const event = new CustomEvent("images", { detail, bubbles: true });
            this.dispatchEvent(event);
        });
    }
};
__decorate([
    selector("#body")
], XFileLoader.prototype, "$el", void 0);
__decorate([
    on("dragover")
], XFileLoader.prototype, "handleDragOver", null);
__decorate([
    on("dragleave")
], XFileLoader.prototype, "handleDragLeave", null);
__decorate([
    on("drop")
], XFileLoader.prototype, "handleDrop", null);
XFileLoader = __decorate([
    define(template$2)
], XFileLoader);

const template$4 = document.createElement("template");
        template$4.innerHTML = `<style>
  :host {
    display: block;
    background-color: #ddd;
  }

  .body {
    padding: 20px
  }

  .button {
    border-radius: 2px;
    font-size: 16px;
    padding: 10px 20px;
    margin-right: 10px;
    border: none;
    background-image: linear-gradient(#ccc, #bbb);
    cursor: pointer;
    outline: none;
  }

  .button:active {
    top: 1px;
    position: relative;
    background-image: linear-gradient(#bbb, #ccc);
  }
</style>
<div class="body">
  <button id="clear" type="button" class="button">clear</button>
  <button id="download" type="button" class="button">download</button>
</div>
`;

let XHeader = class XHeader extends Component {
    handleClearClick() {
        this.dispatchEvent(new CustomEvent("clear", { bubbles: true }));
    }
    handleDownloadClick() {
        this.dispatchEvent(new CustomEvent("download", { bubbles: true }));
    }
};
__decorate([
    on("click", "#clear")
], XHeader.prototype, "handleClearClick", null);
__decorate([
    on("click", "#download")
], XHeader.prototype, "handleDownloadClick", null);
XHeader = __decorate([
    define(template$4)
], XHeader);

const template$6 = document.createElement("template");
        template$6.innerHTML = `<style>
  :host {
    --size: 300px;

    width: var(--size);
    display: block;
    position: relative;
    overflow-y: auto;
    background-color: #ccc;
  }

  * {
    box-sizing: border-box;
  }

  .body {
    top: 0;
    left: 10px;
    width: calc(100% - 20px);
    height: calc(100% - 10px);
    position: absolute;
  }

  .body>x-preview-image {
    left: 10px;
    width: calc(100% - 20px);
    position: absolute;
  }

  .XPreviewImage--allowTransition {
    transition: transform 250ms, opacity 250ms, top 250ms;
  }

  .body-hidden {
    height: 100%;
    padding: 20px;
  }

  .body-hidden>x-preview-image {
    top: 0;
    opacity: 0;
    pointer-events: none;
  }
</style>

<div class="body-hidden"></div>
<div class="body"></div>
`;

const template$8 = document.createElement("template");
        template$8.innerHTML = `<style>
  * {
    box-sizing: border-box;
  }

  :host {
    padding: 5px;
    margin-bottom: 20px;
    display: block;
    border-radius: 5px;
    background-color: white;
    box-shadow: rgba(0, 0, 0, .3) 0 1px 5px 0;
  }

  :host(.XPreviewImage--dragOver) {
    background-color: #ddd;
    transform: scale(1.1);
  }

  :host(.XPreviewImage--dragStart) {
    opacity: .3;
    transform: scale(0.9);
  }

  :host([hidden]) {
    display: none;
    visibility: hidden;
  }

  img {
    width: 100%;
  }

  div {
    margin-top: 5px;
    overflow: hidden;
    font-size: 10px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>

<img id="img" draggable="false" src="">
<div id="text" draggable="false"></div>
<div id="size" draggable="false"></div>
<div id="page" draggable="false"></div>
`;

let XPreviewImage = class XPreviewImage extends Component {
    constructor() {
        super(...arguments);
        this.idx = -1;
        this.width = 0;
        this.height = 0;
        this.page = 0;
    }
    filenameAttr(value) {
        if (isNonEmptyString(value)) {
            this.filename = value;
            this.setAttribute("filename", value);
            this.$text.textContent = value;
        }
    }
    base64Observer(value) {
        if (isNonEmptyString(value)) {
            this.$img.src = value;
        }
    }
    widthObserver(value) {
        if (failIfNaN(value)) {
            this.$size.textContent = `${value} x ${this.height}`;
        }
    }
    heightObserver(value) {
        if (failIfNaN(value)) {
            this.$size.textContent = `${this.width} x ${value}`;
        }
    }
    pageObserver(value) {
        if (failIfNaN(value)) {
            this.$page.textContent = `- ${value} -`;
        }
    }
    /**
     * DOM Events
     */
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        this.classList.add("XPreviewImage--dragOver");
    }
    handleDragLeave() {
        this.classList.remove("XPreviewImage--dragOver");
    }
    handleDrop(event) {
        this.classList.remove("XPreviewImage--dragOver");
        const dataPage = event.dataTransfer.getData("page");
        if (typeof dataPage === "string") {
            const source = Number.parseInt(dataPage, 10);
            const target = this.page;
            if (source !== target) {
                const detail = {
                    source,
                    target,
                };
                const event = new CustomEvent("pageswitch", { detail, bubbles: true });
                this.dispatchEvent(event);
            }
        }
    }
    handleDragStart(event) {
        this.classList.add("XPreviewImage--dragStart");
        event.dataTransfer.setData("page", this.page.toString());
    }
    handleDragEnd() {
        this.classList.remove("XPreviewImage--dragStart");
    }
};
__decorate([
    prop()
], XPreviewImage.prototype, "filename", void 0);
__decorate([
    prop()
], XPreviewImage.prototype, "base64", void 0);
__decorate([
    prop()
], XPreviewImage.prototype, "width", void 0);
__decorate([
    prop()
], XPreviewImage.prototype, "height", void 0);
__decorate([
    prop()
], XPreviewImage.prototype, "page", void 0);
__decorate([
    selector("#img")
], XPreviewImage.prototype, "$img", void 0);
__decorate([
    selector("#text")
], XPreviewImage.prototype, "$text", void 0);
__decorate([
    selector("#size")
], XPreviewImage.prototype, "$size", void 0);
__decorate([
    selector("#page")
], XPreviewImage.prototype, "$page", void 0);
__decorate([
    attr("filename"),
    observer("filename")
], XPreviewImage.prototype, "filenameAttr", null);
__decorate([
    observer("base64")
], XPreviewImage.prototype, "base64Observer", null);
__decorate([
    observer("width")
], XPreviewImage.prototype, "widthObserver", null);
__decorate([
    observer("height")
], XPreviewImage.prototype, "heightObserver", null);
__decorate([
    observer("page")
], XPreviewImage.prototype, "pageObserver", null);
__decorate([
    on("dragover", ":host")
], XPreviewImage.prototype, "handleDragOver", null);
__decorate([
    on("dragleave", ":host")
], XPreviewImage.prototype, "handleDragLeave", null);
__decorate([
    on("drop", ":host")
], XPreviewImage.prototype, "handleDrop", null);
__decorate([
    on("dragstart", ":host")
], XPreviewImage.prototype, "handleDragStart", null);
__decorate([
    on("dragend", ":host")
], XPreviewImage.prototype, "handleDragEnd", null);
XPreviewImage = __decorate([
    define(template$8)
], XPreviewImage);
function isNonEmptyString(value) {
    if (value) {
        return true;
    }
    throw new TypeError(`<x-preview-image> property must be a non empty string`);
}
function failIfNaN(value) {
    if (isNaN(value)) {
        throw new TypeError(`<x-preview-image> property must be a number`);
    }
    return true;
}

let XPreview = class XPreview extends Component {
    constructor() {
        super(...arguments);
        this.idxCounter = 100;
    }
    size(value = "") {
        const size = Number.parseInt(value, 10);
        if (!Number.isNaN(size)) {
            this.style.setProperty("--size", `${size}px`);
        }
    }
    handlePageSwitch(event) {
        const { source, target } = event.detail;
        const $target = this.$bodyHidden.children.item(target - 1);
        const $source = this.$bodyHidden.children.item(source - 1);
        const $newTarget = target > source ? $target.nextElementSibling : $target;
        $source.remove();
        this.$bodyHidden.insertBefore($source, $newTarget);
        this._reposition();
    }
    _rerenderPageNumbers() {
        for (let index = 0; index < this.$bodyHidden.children.length; index++) {
            const thumbnail = this.$bodyHidden.children.item(index);
            const page = index + 1;
            thumbnail.page = page;
        }
    }
    _reposition() {
        this._rerenderPageNumbers();
        const pageSize = new Map();
        const scrollTop = this.scrollTop;
        for (let item_ of Array.from(this.$bodyHidden.children)) {
            const item = item_;
            const page = item.page;
            const { top, height } = item.getBoundingClientRect();
            pageSize.set(item.idx, { top, height, page });
        }
        for (let item_ of Array.from(this.$body.children)) {
            const item = item_;
            const { top, height, page } = pageSize.get(item.idx);
            // NOTE: Wd don't use trasnform because it's already being used my `scale`
            item.style.setProperty("top", `${top + scrollTop}px`);
            item.style.setProperty("height", `${height}px`);
            item.page = page;
        }
    }
    push(image) {
        const page = this.$body.children.length + 1;
        const idx = --this.idxCounter;
        const itemHidden = new XPreviewImage();
        itemHidden.idx = idx;
        itemHidden.base64 = image.base64;
        itemHidden.filename = image.filename;
        itemHidden.width = image.width;
        itemHidden.height = image.height;
        itemHidden.mimeType = image.mimeType;
        itemHidden.page = page;
        const item = new XPreviewImage();
        item.idx = idx;
        item.base64 = image.base64;
        item.filename = image.filename;
        item.width = image.width;
        item.height = image.height;
        item.mimeType = image.mimeType;
        item.page = page;
        item.draggable = true;
        this.$bodyHidden.appendChild(itemHidden);
        this.$body.appendChild(item);
        this._reposition();
        requestAnimationFrame(() => {
            item.classList.add("XPreviewImage--allowTransition");
        });
    }
    getPages() {
        return Array.from(this.$bodyHidden.children).map((xPreviewImage) => {
            const { base64, filename, width, height, mimeType } = xPreviewImage;
            return {
                base64,
                filename,
                width,
                height,
                mimeType,
            };
        });
    }
};
__decorate([
    selector(".body")
], XPreview.prototype, "$body", void 0);
__decorate([
    selector(".body-hidden")
], XPreview.prototype, "$bodyHidden", void 0);
__decorate([
    attr()
], XPreview.prototype, "size", null);
__decorate([
    on("pageswitch")
], XPreview.prototype, "handlePageSwitch", null);
XPreview = __decorate([
    define(template$6)
], XPreview);

Object.defineProperty(window, "App", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        components: {
            XApp,
            XHeader,
            XFileLoader,
            XPreview,
            XPreviewImage,
        },
    },
});

}(jsPDF));

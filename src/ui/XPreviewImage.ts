import template from "./XPreviewImage.html";
import { attr, define, Component, selector, observer, on, prop } from "../utils/Component";
import { PageSwitchEvent } from "../interfaces";

@define(template)
export class XPreviewImage extends Component {
  idx: number = -1;
  mimeType: string;

  @prop() filename: string;
  @prop() base64: string;
  @prop() width: number = 0;
  @prop() height: number = 0;
  @prop() page: number = 0;

  @selector("#img") private $img: HTMLImageElement;
  @selector("#text") private $text: HTMLDivElement;
  @selector("#size") private $size: HTMLDivElement;
  @selector("#page") private $page: HTMLDivElement;

  @attr("filename")
  @observer("filename")
  filenameAttr(value?: string) {
    if (isNonEmptyString(value)) {
      this.filename = value;
      this.setAttribute("filename", value);
      this.$text.textContent = value;
    }
  }

  @observer("base64")
  base64Observer(value?: string) {
    if (isNonEmptyString(value)) {
      this.$img.src = value;
    }
  }

  @observer("width")
  widthObserver(value: number) {
    if (failIfNaN(value)) {
      this.$size.textContent = `${value} x ${this.height}`;
    }
  }

  @observer("height")
  heightObserver(value: number) {
    if (failIfNaN(value)) {
      this.$size.textContent = `${this.width} x ${value}`;
    }
  }

  @observer("page")
  pageObserver(value: number) {
    if (failIfNaN(value)) {
      this.$page.textContent = `- ${value} -`;
    }
  }

  /**
   * DOM Events
   */

  @on("dragover", ":host")
  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    this.classList.add("XPreviewImage--dragOver");
  }

  @on("dragleave", ":host")
  handleDragLeave() {
    this.classList.remove("XPreviewImage--dragOver");
  }

  @on("drop", ":host")
  handleDrop(event: DragEvent) {
    this.classList.remove("XPreviewImage--dragOver");
    const dataPage = event.dataTransfer.getData("page");

    if (typeof dataPage === "string") {
      const source = Number.parseInt(dataPage, 10);
      const target = this.page;

      if (source !== target) {
        const detail: PageSwitchEvent["detail"] = {
          source,
          target,
        };

        const event: PageSwitchEvent = new CustomEvent("pageswitch", { detail, bubbles: true });
        this.dispatchEvent(event);
      }
    }
  }

  @on("dragstart", ":host")
  handleDragStart(event: DragEvent) {
    this.classList.add("XPreviewImage--dragStart");

    event.dataTransfer.setData("page", this.page.toString());
  }

  @on("dragend", ":host")
  handleDragEnd() {
    this.classList.remove("XPreviewImage--dragStart");
  }
}

function isNonEmptyString(value: any): value is string {
  if (value) {
    return true;
  }

  throw new TypeError(`<x-preview-image> property must be a non empty string`);
}

function failIfNaN(value: any): value is number {
  if (isNaN(value)) {
    throw new TypeError(`<x-preview-image> property must be a number`);
  }

  return true;
}

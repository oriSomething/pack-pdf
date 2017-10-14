import template from "./XPreview.html";
import { attr, define, Component, on, selector } from "../utils/Component";
import { XPreviewImage } from "./XPreviewImage";
import { PageSwitchEvent, ImageItem } from "../interfaces";

interface ItemPosition {
  top: number;
  height: number;
  page: number;
}

@define(template)
export class XPreview extends Component {
  private idxCounter: number = 100;

  @selector(".body") $body: HTMLDivElement;
  @selector(".body-hidden") $bodyHidden: HTMLDivElement;

  @attr()
  size(value: string = "") {
    const size = Number.parseInt(value, 10);

    if (!Number.isNaN(size)) {
      this.style.setProperty("--size", `${size}px`);
    }
  }

  @on("pageswitch")
  handlePageSwitch(event: PageSwitchEvent) {
    const { source, target } = event.detail;

    const $target = this.$bodyHidden.children.item(target - 1);
    const $source = this.$bodyHidden.children.item(source - 1);

    const $newTarget = target > source ? $target.nextElementSibling : $target;
    $source.remove();
    this.$bodyHidden.insertBefore($source, $newTarget);

    this._reposition();
  }

  private _rerenderPageNumbers() {
    for (let index = 0; index < this.$bodyHidden.children.length; index++) {
      const thumbnail = this.$bodyHidden.children.item(index) as XPreviewImage;
      const page = index + 1;
      thumbnail.page = page;
    }
  }

  private _reposition() {
    this._rerenderPageNumbers();

    const pageSize: Map<number, ItemPosition> = new Map();
    const scrollTop = this.scrollTop;

    for (let item_ of Array.from(this.$bodyHidden.children)) {
      const item = item_ as XPreviewImage;
      const page = item.page;
      const { top, height } = item.getBoundingClientRect();
      pageSize.set(item.idx, { top, height, page });
    }

    for (let item_ of Array.from(this.$body.children)) {
      const item = item_ as XPreviewImage;
      const { top, height, page } = pageSize.get(item.idx)!;

      // NOTE: Wd don't use trasnform because it's already being used my `scale`
      item.style.setProperty("top", `${top + scrollTop}px`);
      item.style.setProperty("height", `${height}px`);
      item.page = page;
    }
  }

  push(image: ImageItem) {
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

  getPages(): Array<ImageItem> {
    return Array.from(this.$bodyHidden.children).map((xPreviewImage: XPreviewImage) => {
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
}

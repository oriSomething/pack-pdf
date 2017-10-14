import template from "./XFileLoader.html";
import { readFiles } from "../utils/readFiles";
import { getDropImageFiles } from "../utils/getDropImageFiles";
import { define, on, Component, selector } from "../utils/Component";
import { ImagesEvent } from "../interfaces";

@define(template)
export class XFileLoader extends Component {
  @selector("#body") $el: HTMLDivElement;

  @on("dragover")
  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    this.$el.classList.add("body--dragOver");
  }

  @on("dragleave")
  handleDragLeave(__event: DragEvent) {
    this.$el.classList.remove("body--dragOver");
  }

  @on("drop")
  handleDrop(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault();

    this.$el.classList.remove("body--dragOver");

    readFiles(getDropImageFiles(event.dataTransfer)).then((detail: ImagesEvent["detail"]) => {
      const event: ImagesEvent = new CustomEvent("images", { detail, bubbles: true });
      this.dispatchEvent(event);
    });
  }
}

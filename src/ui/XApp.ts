import * as jsPDF from "jspdf";
import template from "./XApp.html";
import { define, on, Component, selector } from "../utils/Component";
import { XPreview } from "./XPreview";
import { ImagesEvent } from "../interfaces";

const MIME_TYPE_PNG = "image/png";
const MIME_TYPE_JPEG = "image/jpeg";

@define(template)
export class XApp extends Component {
  @selector("#preview") $preview: XPreview;

  @on("images")
  handleImages(event: ImagesEvent) {
    for (let image of event.detail) {
      this.$preview.push(image);
    }
  }

  @on("clear")
  handleClear() {
    document.querySelector("x-app")!.remove();
    document.body.appendChild(new XApp());
  }

  @on("download")
  handleDownload() {
    const items = this.$preview.getPages();
    const doc = new jsPDF("p", "mm", "a4");
    const WIDTH = 210;
    const HEIGHT = 297;

    for (let [index, item] of items.entries()) {
      if (index > 0) {
        doc.addPage();
      }

      const [width, height] =
        item.width > item.height
          ? [WIDTH, WIDTH * item.height / item.width]
          : [HEIGHT * item.width / item.height, HEIGHT];

      const type = getImageType(item.mimeType);
      doc.addImage(item.base64, type, 0, 0, width, height);
    }

    doc.save("untitled.pdf");
  }
}

function getImageType(mimeType: string): string {
  switch (mimeType) {
    case MIME_TYPE_PNG:
      return "png";
    case MIME_TYPE_JPEG:
      return "jpg";
  }

  throw new TypeError(`unknown mime type of ${mimeType}`);
}

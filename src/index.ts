import { XApp } from "./ui/XApp";
import { XFileLoader } from "./ui/XFileLoader";
import { XHeader } from "./ui/XHeader";
import { XPreview } from "./ui/XPreview";
import { XPreviewImage } from "./ui/XPreviewImage";

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

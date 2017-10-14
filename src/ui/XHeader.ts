import template from "./XHeader.html";
import { define, Component, on } from "../utils/Component";

@define(template)
export class XHeader extends Component {
  @on("click", "#clear")
  handleClearClick() {
    this.dispatchEvent(new CustomEvent("clear", { bubbles: true }));
  }

  @on("click", "#download")
  handleDownloadClick() {
    this.dispatchEvent(new CustomEvent("download", { bubbles: true }));
  }
}

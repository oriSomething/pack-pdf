export interface ImageItem {
  base64: string;
  filename: string;
  height: number;
  width: number;
  mimeType: string;
}

export interface PageSwitchEvent extends CustomEvent {
  detail: {
    source: number;
    target: number;
  };
}

export interface ImagesEvent extends CustomEvent {
  detail: Array<ImageItem>;
}

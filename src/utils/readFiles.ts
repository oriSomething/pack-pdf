import { ImageItem } from "../interfaces";

export function readFiles(files: Array<File>): Promise<Array<ImageItem>> {
  const promises = files.map(file => {
    return new Promise<ImageItem>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          resolve({
            filename: file.name,
            base64: reader.result,
            width: img.width,
            height: img.height,
            mimeType: String(file.type as any),
          } as ImageItem);
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

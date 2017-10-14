const MIME_TYPE_PNG = "image/png";
const MIME_TYPE_JPEG = "image/jpeg";

export function getDropImageFiles(dataTransfer: DataTransfer): Array<File> {
  const { files } = dataTransfer;

  const imagesFiles: Array<File> = [];

  for (let i = 0; i < files.length; i++) {
    let file = files.item(i);

    switch (file.type) {
      case MIME_TYPE_PNG:
      case MIME_TYPE_JPEG:
        imagesFiles.push(file);
      default:
    }
  }

  return imagesFiles;
}

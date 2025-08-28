export async function uploadFile(
  image: File[],
  name: string
): Promise<{ filename: string;}> {
  console.log(
    `Received file: ${image.length}`
  );
  return { filename: image[0].name };
}

export async function createFile( params: {files: File[], inner: {name: string, worked: boolean} }) {
  console.log(params)
  return params.files.map(i => i.name)
}

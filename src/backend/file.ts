export async function uploadFile(
  file: File,
  name: string
): Promise<{ filename: string;}> {
  console.log(
    `Received file: ${file.name}`
  );
  return { filename: file.name };
}

export async function createFile( params: {files: File[], inner: {name: string, worked: boolean} }) {
  console.log(params)
  return params.files.map(i => i.name)
}




"use client";

import { useEffect, useState } from "react";
import { createFile, uploadFile } from "quickwired/file";

export default function Home() {
  const [file, setFile] = useState<File[] | null>([]);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!progress) return;
    if (progress === 100) setProgress(0);
  }, [progress]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile([...event.target.files]);
      // const result = await uploadFile(
      //   { file: event.target.files[0], name: "Some name" },
      //   {
      //     onUploadProgress(progressEvent) {
      //       console.log({ progressEvent });
      //       if (!progressEvent.progress) return;
      //       setProgress(progressEvent.progress * 100);
      //     },
      //   }
      // );
      // setResponse(`Uploaded: ${result.filename}, Size: bytes`);
      const result = createFile({
        files: event.target.files as unknown as File[],
        inner: { name: "something", worked: true },
      },{
          onUploadProgress(progressEvent) {
            console.log({ progressEvent });
            if (!progressEvent.progress) return;
            setProgress(progressEvent.progress * 100);
          },
        });
      setResponse(`Uploaded: ${result}, Size: bytes`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>File Upload Test</h1>
      <input multiple type="file" onChange={handleFileChange} />
      <div className="h-5 w-56 border relative">
        <div
          className="absolute h-full bg-green-400"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {/* <button onClick={handleUpload} disabled={!file}>
        Upload
      </button> */}
      {response && <p style={{ color: "green" }}>{response}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

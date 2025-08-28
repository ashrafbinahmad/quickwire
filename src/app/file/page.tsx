"use client";

import { useState } from "react";
import { createFile, uploadFile } from "quickwired/file";

export default function Home() {
  const [file, setFile] = useState<File[] | null>([]);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile([...event.target.files]);
      // const result = await uploadFile({image: [event.target.files[0]], name: "Some name" });
      // setResponse(`Uploaded: ${result.filename}, Size: bytes`);
      const result = createFile({files: event.target.files as unknown as File[], inner: {name: "something", worked: true}})
      setResponse(`Uploaded: ${result}, Size: bytes`);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }


    try {
      setError(null);
    } catch (err) {
      setError(
        `Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setResponse(null);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>File Upload Test</h1>
      <input multiple type="file" onChange={handleFileChange} />
      {/* <button onClick={handleUpload} disabled={!file}>
        Upload
      </button> */}
      {response && <p style={{ color: "green" }}>{response}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

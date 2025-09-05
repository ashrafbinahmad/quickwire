"use client";
import {
  getTest,
  twoParamTest,
  objTest,
  arrayTest,
  createMultipleItems,
  uploadSingleFile,
  uploadMultipleFiles,
  uploadWithMetadata,
  uploadComplexData,
  optionalParamTest,
  mixedOptionalTest,
  listTests,
  findTestById,
  updateTestData,
  editUserProfile,
  modifySettings,
  changePassword,
  setConfiguration,
  replaceDocument,
  toggleFeature,
  patchUserData,
  partialUpdate,
  incrementCounter,
  decrementScore,
  appendToList,
  prependToQueue,
  adjustVolume,
  tweakSettings,
  deleteTestItem,
  complexObjectTest,
  primitiveTypesTest,
} from "quickwired/test";
import React, { useState } from "react";

export default function Page() {
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [showLastOnly, setShowLastOnly] = useState<boolean>(false);

  const executeTest = async (
    testName: string,
    testFn: () => Promise<unknown>,
    method?: string,
    endpoint?: string
  ) => {
    setIsLoading((prev) => ({ ...prev, [testName]: true }));
    try {
      const result = await testFn();
      const resultWithMeta = {
        method: method || 'Unknown',
        endpoint: endpoint || 'Unknown',
        timestamp: new Date().toISOString(),
        result: result
      };
      setResults((prev) => ({ ...prev, [testName]: resultWithMeta }));
      console.log(`${testName} result:`, resultWithMeta);
    } catch (error) {
      const errorWithMeta = {
        method: method || 'Unknown',
        endpoint: endpoint || 'Unknown',
        timestamp: new Date().toISOString(),
        error: String(error)
      };
      console.error(`${testName} error:`, error);
      setResults((prev) => ({ ...prev, [testName]: errorWithMeta }));
    } finally {
      setIsLoading((prev) => ({ ...prev, [testName]: false }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const createSampleFile = (
    content: string,
    filename: string,
    type: string = "text/plain"
  ): File => {
    const blob = new Blob([content], { type });
    return new File([blob], filename, { type });
  };

  return (
    <>
      <style jsx>{`
        .btn {
          display: block;
          flex-grow: 1;
          flex-shrink: 0;
          height: 48px;
          flex-grow: 0;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          color: white;
          border-radius: 0.25rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-blue {
          background-color: #3b82f6;
        }

        .btn-blue:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-green {
          background-color: #10b981;
        }

        .btn-green:hover:not(:disabled) {
          background-color: #059669;
        }

        .btn-purple {
          background-color: #8b5cf6;
        }

        .btn-purple:hover:not(:disabled) {
          background-color: #7c3aed;
        }

        .btn-orange {
          background-color: #f97316;
        }

        .btn-orange:hover:not(:disabled) {
          background-color: #ea580c;
        }

        .btn-red {
          background-color: #ef4444;
        }

        .btn-red:hover:not(:disabled) {
          background-color: #dc2626;
        }

        .btn-yellow {
          background-color: #eab308;
        }

        .btn-yellow:hover:not(:disabled) {
          background-color: #ca8a04;
        }

        .btn-teal {
          background-color: #14b8a6;
        }

        .btn-teal:hover:not(:disabled) {
          background-color: #0d9488;
        }

        .btn-indigo {
          background-color: #6366f1;
        }

        .btn-indigo:hover:not(:disabled) {
          background-color: #4f46e5;
        }

        .btn-gray {
          background-color: #6b7280;
        }

        .btn-gray:hover:not(:disabled) {
          background-color: #4b5563;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row h-screen">
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto lg:pr-96 pb-80 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">
              Comprehensive API Test Suite
            </h1>

        {/* HTTP Method Configuration Display */}
        <div className="mb-6 p-4 bg-gray-50 border rounded">
          <h2 className="text-xl font-semibold mb-3">
            🔧 Quickwire HTTP Method Configuration
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Quickwire automatically detects HTTP methods based on function
            names. Below are the configured prefixes:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
            <div>
              <strong className="text-green-600">GET:</strong>
              <br />
              get, fetch, find, list, show, read, retrieve, search, query, view,
              display, load, check, verify, validate, count, exists, has, is,
              can
            </div>
            <div>
              <strong className="text-blue-600">POST:</strong>
              <br />
              create, add, insert, post, submit, send, upload, register, login,
              signup, authenticate, authorize, process, execute, run, perform,
              handle, trigger, invoke, call, generate, build, make, produce,
              sync, import, export
            </div>
            <div>
              <strong className="text-yellow-600">PUT:</strong>
              <br />
              update, edit, modify, change, set, put, replace, toggle, switch,
              enable, disable, activate, deactivate, publish, unpublish,
              approve, reject, accept, decline, assign, unassign, move,
              transfer, migrate, restore, reset, refresh, renew, reorder, sort,
              merge
            </div>
            <div>
              <strong className="text-teal-600">PATCH:</strong>
              <br />
              patch, partial, increment, decrement, append, prepend, adjust,
              tweak, fine, tune
            </div>
            <div>
              <strong className="text-red-600">DELETE:</strong>
              <br />
              delete, remove, destroy, clear, clean, purge, drop, erase, wipe,
              cancel, revoke, withdraw, uninstall, detach, disconnect, unlink,
              archive, trash
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-3">File Upload</h2>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="mb-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-sm text-gray-600">
            Selected: {selectedFiles.length} files
          </p>
        </div>

        {/* Test Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Tests */}
          <div className="border rounded p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">
              Basic Tests
            </h3>

            <button
              className="btn btn-blue"
              onClick={() => executeTest("getTest", getTest, "GET", "/api/quickwired/getTest")}
              disabled={isLoading["getTest"]}
            >
              {isLoading["getTest"] ? "Loading..." : "Get Test (No Params)"}
            </button>

            <button
              className="btn btn-blue"
              onClick={() =>
                executeTest("twoParamTest", () =>
                  twoParamTest({ a: "Hello", b: "World" }), "GET", "/api/quickwired/twoParamTest"
                )
              }
              disabled={isLoading["twoParamTest"]}
            >
              {isLoading["twoParamTest"] ? "Loading..." : "Two Param Test"}
            </button>

            <button
              className="btn btn-blue"
              onClick={() =>
                executeTest("objTest", () =>
                  objTest({ a: "Hello", b: "Beautiful", c: "World!" }), "GET", "/api/quickwired/objTest"
                )
              }
              disabled={isLoading["objTest"]}
            >
              {isLoading["objTest"] ? "Loading..." : "Object Test"}
            </button>
          </div>

          {/* Array Tests */}
          <div className="border rounded p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-3 text-green-600">
              Array Tests
            </h3>

            <button
              className="btn btn-green"
              onClick={() =>
                executeTest("arrayTest", () =>
                  arrayTest(["apple", "banana", "cherry"]), "GET", "/api/quickwired/arrayTest"
                )
              }
              disabled={isLoading["arrayTest"]}
            >
              {isLoading["arrayTest"] ? "Loading..." : "Array Test"}
            </button>

            <button
              className="btn btn-green"
              onClick={() =>
                executeTest("createMultipleItems", () =>
                  createMultipleItems({
                    names: ["Item 1", "Item 2", "Item 3"],
                    tags: ["tag1", "tag2", "tag3"],
                  }), "POST", "/api/quickwired/createMultipleItems"
                )
              }
              disabled={isLoading["createMultipleItems"]}
            >
              {isLoading["createMultipleItems"]
                ? "Loading..."
                : "Create Multiple Items"}
            </button>
          </div>

          {/* File Upload Tests */}
          <div className="border rounded p-4 grid">
            <h3 className="text-lg font-semibold mb-3 text-purple-600">
              File Upload Tests
            </h3>

            <button
              className="btn btn-purple"
              onClick={() => {
                const file = createSampleFile("Hello World!", "test.txt");
                executeTest("uploadSingleFile", () =>
                  uploadSingleFile({ file }), "POST", "/api/quickwired/uploadSingleFile"
                );
              }}
              disabled={isLoading["uploadSingleFile"]}
            >
              {isLoading["uploadSingleFile"]
                ? "Loading..."
                : "Upload Single File (Generated)"}
            </button>

            <button
              className="btn btn-purple"
              onClick={() => {
                if (selectedFiles.length > 0) {
                  executeTest("uploadSelectedFile", () =>
                    uploadSingleFile({ file: selectedFiles[0] }), "POST", "/api/quickwired/uploadSingleFile"
                  );
                } else {
                  alert("Please select a file first");
                }
              }}
              disabled={
                isLoading["uploadSelectedFile"] || selectedFiles.length === 0
              }
            >
              {isLoading["uploadSelectedFile"]
                ? "Loading..."
                : "Upload Selected File"}
            </button>

            <button
              className="btn btn-purple"
              onClick={() => {
                const files = [
                  createSampleFile("File 1 content", "file1.txt"),
                  createSampleFile("File 2 content", "file2.txt"),
                  createSampleFile("File 3 content", "file3.txt"),
                ];
                executeTest("uploadMultipleFiles", () =>
                  uploadMultipleFiles({ files }), "POST", "/api/quickwired/uploadMultipleFiles"
                );
              }}
              disabled={isLoading["uploadMultipleFiles"]}
            >
              {isLoading["uploadMultipleFiles"]
                ? "Loading..."
                : "Upload Multiple Files"}
            </button>

            <button
              className="btn btn-purple"
              onClick={() => {
                const file = createSampleFile(
                  "Document with metadata",
                  "document.txt"
                );
                executeTest("uploadWithMetadata", () =>
                  uploadWithMetadata({
                    file,
                    title: "Important Document",
                    description: "This is a test document with metadata",
                  }), "POST", "/api/quickwired/uploadWithMetadata"
                );
              }}
              disabled={isLoading["uploadWithMetadata"]}
            >
              {isLoading["uploadWithMetadata"]
                ? "Loading..."
                : "Upload with Metadata"}
            </button>
          </div>

          {/* Optional Parameters */}
          <div className="border rounded p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-3 text-orange-600">
              Optional Parameters
            </h3>

            <button
              className="btn btn-orange"
              onClick={() =>
                executeTest("optionalParamTest1", () =>
                  optionalParamTest({ required: "Required Value" }), "GET", "/api/quickwired/optionalParamTest"
                )
              }
              disabled={isLoading["optionalParamTest1"]}
            >
              {isLoading["optionalParamTest1"]
                ? "Loading..."
                : "Optional Test (Without Optional)"}
            </button>

            <button
              className="btn btn-orange"
              onClick={() =>
                executeTest("optionalParamTest2", () =>
                  optionalParamTest({
                    required: "Required Value",
                    optional: "Optional Value",
                  }), "GET", "/api/quickwired/optionalParamTest"
                )
              }
              disabled={isLoading["optionalParamTest2"]}
            >
              {isLoading["optionalParamTest2"]
                ? "Loading..."
                : "Optional Test (With Optional)"}
            </button>

            <button
              className="btn btn-orange"
              onClick={() =>
                executeTest("mixedOptionalTest", () =>
                  mixedOptionalTest({
                    name: "John Doe",
                    age: 30,
                    tags: ["developer", "javascript"],
                    metadata: {
                      created: new Date().toISOString(),
                      updated: new Date().toISOString(),
                    },
                  }), "GET", "/api/quickwired/mixedOptionalTest"
                )
              }
              disabled={isLoading["mixedOptionalTest"]}
            >
              {isLoading["mixedOptionalTest"]
                ? "Loading..."
                : "Mixed Optional Test"}
            </button>
          </div>

          {/* HTTP Method Tests */}
          <div className="border rounded p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-3 text-red-600">
              GET & DELETE Methods
            </h3>

            <button
              className="btn btn-red"
              onClick={() => executeTest("listTests", listTests, "GET", "/api/quickwired/listTests")}
              disabled={isLoading["listTests"]}
            >
              {isLoading["listTests"] ? "Loading..." : "List Tests (GET)"}
            </button>

            <button
              className="btn btn-red"
              onClick={() =>
                executeTest("findTestById", () => findTestById("123"), "GET", "/api/quickwired/findTestById")
              }
              disabled={isLoading["findTestById"]}
            >
              {isLoading["findTestById"] ? "Loading..." : "Find by ID (GET)"}
            </button>

            <button
              className="btn btn-red"
              onClick={() =>
                executeTest("deleteTestItem", () => deleteTestItem("123"), "DELETE", "/api/quickwired/deleteTestItem")
              }
              disabled={isLoading["deleteTestItem"]}
            >
              {isLoading["deleteTestItem"]
                ? "Loading..."
                : "Delete Test (DELETE)"}
            </button>
          </div>

          {/* PUT Method Tests */}
          <div className="border rounded p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-3 text-yellow-600">
              PUT Methods
            </h3>

            <button
              className="btn btn-yellow"
              onClick={() =>
                executeTest("updateTestData", () =>
                  updateTestData({
                    id: "123",
                    name: "Updated Test",
                    description: "Updated description",
                  }), "PUT", "/api/quickwired/updateTestData"
                )
              }
              disabled={isLoading["updateTestData"]}
            >
              {isLoading["updateTestData"]
                ? "Loading..."
                : "Update Test Data (PUT)"}
            </button>

            <button
              className="btn btn-yellow"
              onClick={() =>
                executeTest("editUserProfile", () =>
                  editUserProfile({
                    userId: "user123",
                    profile: {
                      name: "John Doe",
                      email: "john@example.com",
                      bio: "Updated bio",
                    },
                  }), "PUT", "/api/quickwired/editUserProfile"
                )
              }
              disabled={isLoading["editUserProfile"]}
            >
              {isLoading["editUserProfile"]
                ? "Loading..."
                : "Edit User Profile (PUT)"}
            </button>

            <button
              className="btn btn-yellow"
              onClick={() =>
                executeTest("modifySettings", () =>
                  modifySettings({
                    settingId: "setting123",
                    value: true,
                  }), "PUT", "/api/quickwired/modifySettings"
                )
              }
              disabled={isLoading["modifySettings"]}
            >
              {isLoading["modifySettings"]
                ? "Loading..."
                : "Modify Settings (PUT)"}
            </button>

            <button
              className="btn btn-yellow"
              onClick={() =>
                executeTest("changePassword", () =>
                  changePassword({
                    userId: "user123",
                    oldPassword: "oldpass123",
                    newPassword: "newpass456",
                  }), "PUT", "/api/quickwired/changePassword"
                )
              }
              disabled={isLoading["changePassword"]}
            >
              {isLoading["changePassword"]
                ? "Loading..."
                : "Change Password (PUT)"}
            </button>

            <button
              className="btn btn-yellow"
              onClick={() =>
                executeTest("setConfiguration", () =>
                  setConfiguration({
                    configKey: "theme",
                    configValue: { mode: "dark", accent: "blue" },
                  }), "PUT", "/api/quickwired/setConfiguration"
                )
              }
              disabled={isLoading["setConfiguration"]}
            >
              {isLoading["setConfiguration"]
                ? "Loading..."
                : "Set Configuration (PUT)"}
            </button>

            <button
              className="btn btn-yellow"
              onClick={() =>
                executeTest("toggleFeature", () =>
                  toggleFeature({
                    featureId: "feature123",
                    enabled: true,
                  }), "PUT", "/api/quickwired/toggleFeature"
                )
              }
              disabled={isLoading["toggleFeature"]}
            >
              {isLoading["toggleFeature"]
                ? "Loading..."
                : "Toggle Feature (PUT)"}
            </button>
          </div>

          {/* PATCH Method Tests */}
          <div className="border rounded p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-3 text-teal-600">
              PATCH Methods
            </h3>

            <button
              className="btn btn-teal"
              onClick={() =>
                executeTest("patchUserData", () =>
                  patchUserData({
                    userId: "user123",
                    updates: {
                      name: "Patched Name",
                      lastLogin: new Date().toISOString(),
                    },
                  }), "PATCH", "/api/quickwired/patchUserData"
                )
              }
              disabled={isLoading["patchUserData"]}
            >
              {isLoading["patchUserData"]
                ? "Loading..."
                : "Patch User Data (PATCH)"}
            </button>

            <button
              className="btn btn-teal"
              onClick={() =>
                executeTest("partialUpdate", () =>
                  partialUpdate({
                    resourceId: "resource123",
                    partialData: { status: "active", priority: "high" },
                  }), "PATCH", "/api/quickwired/partialUpdate"
                )
              }
              disabled={isLoading["partialUpdate"]}
            >
              {isLoading["partialUpdate"]
                ? "Loading..."
                : "Partial Update (PATCH)"}
            </button>

            <button
              className="btn btn-teal"
              onClick={() =>
                executeTest("incrementCounter", () =>
                  incrementCounter({
                    counterId: "counter123",
                    incrementBy: 5,
                  }), "PATCH", "/api/quickwired/incrementCounter"
                )
              }
              disabled={isLoading["incrementCounter"]}
            >
              {isLoading["incrementCounter"]
                ? "Loading..."
                : "Increment Counter (PATCH)"}
            </button>

            <button
              className="btn btn-teal"
              onClick={() =>
                executeTest("decrementScore", () =>
                  decrementScore({
                    scoreId: "score123",
                    decrementBy: 2,
                  }), "PATCH", "/api/quickwired/decrementScore"
                )
              }
              disabled={isLoading["decrementScore"]}
            >
              {isLoading["decrementScore"]
                ? "Loading..."
                : "Decrement Score (PATCH)"}
            </button>

            <button
              className="btn btn-teal"
              onClick={() =>
                executeTest("appendToList", () =>
                  appendToList({
                    listId: "list123",
                    items: ["item1", "item2", "item3"],
                  }), "PATCH", "/api/quickwired/appendToList"
                )
              }
              disabled={isLoading["appendToList"]}
            >
              {isLoading["appendToList"]
                ? "Loading..."
                : "Append To List (PATCH)"}
            </button>

            <button
              className="btn btn-teal"
              onClick={() =>
                executeTest("adjustVolume", () =>
                  adjustVolume({
                    deviceId: "device123",
                    volumeLevel: 75,
                  }), "PATCH", "/api/quickwired/adjustVolume"
                )
              }
              disabled={isLoading["adjustVolume"]}
            >
              {isLoading["adjustVolume"]
                ? "Loading..."
                : "Adjust Volume (PATCH)"}
            </button>
          </div>

          {/* Complex Data Tests */}
          <div className="border rounded p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-3 text-indigo-600">
              Complex Data
            </h3>

            <button
              className="btn btn-indigo"
              onClick={() => {
                const files = [
                  createSampleFile("Complex file 1", "complex1.txt"),
                  createSampleFile("Complex file 2", "complex2.txt"),
                ];
                executeTest("uploadComplexData", () =>
                  uploadComplexData({
                    files,
                    metadata: {
                      title: "Complex Upload",
                      tags: ["important", "complex", "test"],
                      isPublic: true,
                    },
                    author: "Test User",
                  }), "POST", "/api/quickwired/uploadComplexData"
                );
              }}
              disabled={isLoading["uploadComplexData"]}
            >
              {isLoading["uploadComplexData"]
                ? "Loading..."
                : "Complex File Upload"}
            </button>

            <button
              className="btn btn-indigo"
              onClick={() =>
                executeTest("complexObjectTest", () =>
                  complexObjectTest({
                    user: {
                      id: "user123",
                      profile: {
                        name: "John Doe",
                        email: "john@example.com",
                        preferences: {
                          theme: "dark",
                          notifications: true,
                          languages: ["en", "es", "fr"],
                        },
                      },
                    },
                    settings: {
                      privacy: {
                        publicProfile: true,
                        showEmail: false,
                      },
                      features: ["premium", "beta", "analytics"],
                    },
                  }), "GET", "/api/quickwired/complexObjectTest"
                )
              }
              disabled={isLoading["complexObjectTest"]}
            >
              {isLoading["complexObjectTest"]
                ? "Loading..."
                : "Complex Object Test"}
            </button>

            <button
              className="btn btn-indigo"
              onClick={() =>
                executeTest("primitiveTypesTest", () =>
                  primitiveTypesTest({
                    stringValue: "Hello World",
                    numberValue: 42,
                    booleanValue: true,
                    dateValue: new Date().toISOString(),
                    optionalString: "Optional string value",
                    optionalNumber: 100,
                  }), "GET", "/api/quickwired/primitiveTypesTest"
                )
              }
              disabled={isLoading["primitiveTypesTest"]}
            >
              {isLoading["primitiveTypesTest"]
                ? "Loading..."
                : "Primitive Types Test"}
            </button>
          </div>
        </div>
          </div>
        </div>
      </div>
      
      {/* Results Section - Fixed positioning */}
      <div className="fixed bottom-0 left-0 right-0 lg:bottom-0 lg:top-0 lg:right-0 lg:left-auto lg:w-96 bg-white border-t lg:border-l lg:border-t-0 shadow-lg z-10">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Test Results</h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showLastOnly}
                    onChange={(e) => setShowLastOnly(e.target.checked)}
                    className="rounded"
                  />
                  Show last result only
                </label>
              </div>
              <button 
                className="btn btn-gray text-sm" 
                onClick={() => setResults({})}
              >
                Clear Results
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-100">
            <div className="space-y-4">
              {(() => {
                const resultKeys = Object.keys(results);
                if (resultKeys.length === 0) {
                  return (
                    <div className="text-center text-gray-500 py-8">
                      No test results yet. Click a test button above to see results.
                    </div>
                  );
                }
                
                const keysToShow = showLastOnly && resultKeys.length > 0 
                  ? [resultKeys[resultKeys.length - 1]] 
                  : resultKeys;
                
                return keysToShow.map((key) => {
                  const result = results[key] as {method: string, endpoint: string, result: object, error: string} ;
                  return (
                    <div key={key} className="bg-white rounded-lg p-4 border shadow-sm">
                      <div className="mb-3">
                        <h3 className="font-semibold text-lg text-gray-800">{key}</h3>
                        <div className="flex flex-col  items-left gap-4 mt-2 text-sm">
                          <span className={`px-2 py-1 rounded text-white font-medium w-fit ${
                            result.method === 'GET' ? 'bg-green-600' :
                            result.method === 'POST' ? 'bg-blue-600' :
                            result.method === 'PUT' ? 'bg-yellow-600' :
                            result.method === 'PATCH' ? 'bg-teal-600' :
                            result.method === 'DELETE' ? 'bg-red-600' :
                            'bg-gray-600'
                          }`}>
                            {result.method}
                          </span>
                          <span className="text-gray-600 font-mono">{result.endpoint}</span>
                          {/* <span className="text-gray-500 text-xs">{new Date(result.timestamp).toLocaleTimeString()}</span> */}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <pre className="text-sm whitespace-pre-wrap break-words overflow-x-auto">
                          {JSON.stringify(result.result || result.error, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import React, { useState } from 'react'
import { CodeBlock } from './Codeblock'
import { ChevronRight } from 'lucide-react';

export const GetStarted = ({dontShowHeading}:{dontShowHeading?: boolean}) => {
  const [activeTab, setActiveTab] = useState('installation');

  interface NextButtonProps {
    onClick: () => void;
    children: React.ReactNode;
  }

  const NextButton: React.FC<NextButtonProps> = ({ onClick, children }) => (
    <button
      onClick={onClick}
      className="mt-6 flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all duration-300 hover:scale-105 border border-purple-500/30"
    >
      {children}
      <ChevronRight size={16} />
    </button>
  );

  return (
    <section id="get-started" className="py-20 px-6 border-t border-gray-800/50">
      <div className="max-w-4xl mx-auto">
        {dontShowHeading || <h2 className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Get Started in Minutes
        </h2>}

        <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700/50">
            {['installation', 'configuration', 'usage'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg transition-colors capitalize ${activeTab === tab
                  ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'installation' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">1. Install QuickWire</h3>
                <CodeBlock
                  language="bash"
                  id="install"
                  code="npm install quickwire --save-dev"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">2. Update package.json</h3>
                <CodeBlock
                  language="json"
                  id="package-json"
                  code={`{
  "packageManager": "npm@11.3.0",
  "scripts": {
    "quickwire": "quickwire --watch",
    "nextdev": "next dev --turbopack",
    "dev": "turbo run quickwire nextdev --parallel",
    "prebuild": "quickwire",
    "build": "next build"
  }
}`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">3. Add TypeScript path mapping</h3>
                <CodeBlock
                  language="json"
                  id="tsconfig"
                  code={`{
  "compilerOptions": {
    "paths": {
      "quickwired/*": ["./quickwired/*"],
      "@/*": ["./src/*"]
    }
  }
}`}
                />
              </div>

              <NextButton onClick={() => setActiveTab('configuration')}>
                Next: Configuration
              </NextButton>
            </div>
          )}

          {activeTab === 'configuration' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Optional Configuration</h3>
                <p className="text-gray-400 mb-4">
                  Create a <code className="bg-gray-800 px-1 rounded text-sm">quickwire.config.json</code> file for custom settings (all options are optional):
                </p>
                <CodeBlock
                  language="json"
                  id="config"
                  code={`{
  "backendDir": "src/backend",
  "apiDir": "src/app/api/(quickwired)",
  "quickwireDir": "quickwired",
  "supportedExtensions": [".ts", ".js"],
  "apiRouteTemplate": "route.ts",
  "excludePatterns": ["*.test.ts", "*.spec.ts", "*.d.ts", "node_modules", ".git"],
  "watchDebounceMs": 100,
  "performance": {
    "enableDocGeneration": true,
    "maxFilesToProcess": 1000,
    "enableIncrementalUpdates": true,
    "cacheExpiryMs": 1800000
  },
  "httpMethods": {
    "GET": [
      "get", "fetch", "find", "list", "show", "read", "retrieve", "search",
      "query", "view", "display", "load", "check", "verify", "validate",
      "count", "exists", "has", "is", "can"
    ],
    "POST": [
      "create", "add", "insert", "post", "submit", "send", "upload",
      "register", "login", "signup", "authenticate", "authorize", "process",
      "execute", "run", "perform", "handle", "trigger", "invoke", "call",
      "generate", "build", "make", "produce", "sync", "import", "export"
    ],
    "PUT": [
      "update", "edit", "modify", "change", "set", "put", "replace",
      "toggle", "switch", "enable", "disable", "activate", "deactivate",
      "publish", "unpublish", "approve", "reject", "accept", "decline",
      "assign", "unassign", "move", "transfer", "migrate", "restore",
      "reset", "refresh", "renew", "reorder", "sort", "merge"
    ],
    "PATCH": [
      "patch", "partial", "increment", "decrement", "append", "prepend",
      "adjust", "tweak", "fine", "tune"
    ],
    "DELETE": [
      "delete", "remove", "destroy", "clear", "clean", "purge", "drop",
      "erase", "wipe", "cancel", "revoke", "withdraw", "uninstall",
      "detach", "disconnect", "unlink", "archive", "trash"
    ]
  }
}`}
                />
              </div>

              <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">Configuration Options:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li><strong>backendDir:</strong> Directory containing backend functions (default: "src/backend")</li>
                  <li><strong>apiDir:</strong> Directory where API routes are generated (default: "src/app/api/(quickwired)")</li>
                  <li><strong>quickwireDir:</strong> Directory where client functions are generated (default: "quickwired")</li>
                  <li><strong>performance:</strong> Performance optimization settings</li>
                  <li><strong>httpMethods:</strong> Function name patterns for HTTP method detection</li>
                </ul>
              </div>

              <NextButton onClick={() => setActiveTab('usage')}>
                Next: Usage
              </NextButton>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Start Development</h3>
                <CodeBlock
                  language="bash"
                  id="start"
                  code="npm run dev"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Write Backend Functions</h3>
                <p className="text-gray-400 mb-4">
                  Create and <u>export</u> functions in <code className="bg-gray-800 px-1 rounded text-sm">src/backend/</code>
                </p>
                <CodeBlock
                  language="TypeScript"
                  id="backend-example"
                  code={`// src/backend/posts.ts
export async function getPosts() {
  return await db.posts.findMany();
}

export async function createPost(params: { title: string; content: string }) {
  return await db.posts.create({ data: params });
}`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Use in Components</h3>
                <CodeBlock
                  language="TypeScript"
                  id="component-example"
                  code={`// src/app/posts/page.tsx
import { getPosts, createPost } from "quickwired/posts";

export default function PostsPage() {
  // Use your generated, typed API functions
  const posts = await getPosts();
  // ...
}`}
                />
              </div>

              <div className="bg-green-950/20 border border-green-800/30 rounded-lg p-4">
                <h4 className="text-green-400 font-semibold mb-2">🎉 You're all set!</h4>
                <p className="text-sm text-gray-300">
                  QuickWire will automatically generate API routes, client functions, and Swagger documentation as you develop.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

import React, { useState, useEffect } from 'react';
import { Zap, Code, Shield, RefreshCw, ArrowRight, Copy, Check, Github, FileText, Terminal, Sparkles, Clock, Target, ChevronRight, Book, Settings, Globe, Layers } from 'lucide-react';
import { AnimatedBackground } from './components/AnimatedBG';
import { CodeBlock } from './components/Codeblock';
import { GetStarted } from './components/GetStarted';
export const Documentation = ({ setActivePage }: { setActivePage: (page: string) => void }) => {
  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActivePage('home')}
              className="flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                QuickWire
              </span>
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActivePage('home')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                ← Back to Home
              </button>
              <a href="https://github.com/ashrafbinahmad/quickwire" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <Github size={18} />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Documentation Content */}
      <div className="relative z-10 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Documentation
          </h1>

          <div className="space-y-12">

            <GetStarted dontShowHeading />
            {/* How It Works */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Settings className="text-purple-400" />
                How QuickWire Works
              </h2>
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6 space-y-4">
                <p className="text-gray-300">
                  QuickWire uses a sophisticated file watching and code generation system to automatically create API routes and client functions:
                </p>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-purple-300">1. File Watching</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Monitors <code className="bg-gray-800 px-1 rounded">src/backend/</code> directory</li>
                      <li>• Detects changes in TypeScript/JavaScript files</li>
                      <li>• Uses intelligent debouncing for performance</li>
                      <li>• Supports incremental updates</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-pink-300">2. Code Analysis</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Parses exported functions from backend files</li>
                      <li>• Extracts TypeScript type information</li>
                      <li>• Analyzes function names for HTTP method detection</li>
                      <li>• Validates parameter types and return types</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Code Generation Process */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Code className="text-blue-400" />
                Code Generation Process
              </h2>
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 text-blue-300">API Route Generation</h3>
                  <p className="text-gray-300 mb-4">For each backend function, QuickWire generates:</p>
                  <CodeBlock
                    language="TypeScript"
                    id="api-route"
                    code={`// Generated: src/app/api/(quickwired)/users/getUser/route.ts
import { getUser } from '@/backend/users';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    
    const result = await getUser(params);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}`}
                  />
                </div>

                <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 text-green-300">Client Function Generation</h3>
                  <p className="text-gray-300 mb-4">Corresponding client functions with full type safety:</p>
                  <CodeBlock
                    language="TypeScript"
                    id="client-function"
                    code={`// Generated: quickwired/users.ts
export async function getUser(params: { id: string }) {
  const searchParams = new URLSearchParams(params);
  const response = await fetch(\`/api/(quickwired)/users/getUser?\${searchParams}\`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  return response.json();
}`}
                  />
                </div>
              </div>
            </section>

            {/* HTTP Method Detection */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Target className="text-yellow-400" />
                HTTP Method Detection
              </h2>
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                <p className="text-gray-300 mb-6">
                  QuickWire intelligently detects HTTP methods based on function names using predefined patterns:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-950/30 border border-green-800/30 rounded-lg">
                      <h4 className="text-green-400 font-semibold mb-2">GET Methods</h4>
                      <p className="text-sm text-gray-300 mb-2">Functions starting with:</p>
                      <code className="text-xs text-green-300">get, fetch, find, list, show, read, retrieve, search, query, view, load, check, verify</code>
                    </div>
                    <div className="p-4 bg-blue-950/30 border border-blue-800/30 rounded-lg">
                      <h4 className="text-blue-400 font-semibold mb-2">POST Methods</h4>
                      <p className="text-sm text-gray-300 mb-2">Functions starting with:</p>
                      <code className="text-xs text-blue-300">create, add, insert, post, submit, send, upload, register, login, signup</code>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-950/30 border border-orange-800/30 rounded-lg">
                      <h4 className="text-orange-400 font-semibold mb-2">PUT Methods</h4>
                      <p className="text-sm text-gray-300 mb-2">Functions starting with:</p>
                      <code className="text-xs text-orange-300">update, edit, modify, change, set, put, replace, toggle</code>
                    </div>
                    <div className="p-4 bg-red-950/30 border border-red-800/30 rounded-lg">
                      <h4 className="text-red-400 font-semibold mb-2">DELETE Methods</h4>
                      <p className="text-sm text-gray-300 mb-2">Functions starting with:</p>
                      <code className="text-xs text-red-300">delete, remove, destroy, clear, purge, drop, erase</code>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* File Structure */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Layers className="text-indigo-400" />
                Generated File Structure
              </h2>
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                <CodeBlock
                  language="bash"
                  id="file-structure"
                  code={`project/
├── src/
│   ├── backend/
│   │   ├── users.ts          # Your backend functions
│   │   ├── posts.ts
│   │   └── auth.ts
│   ├── app/
│   │   ├── api/
│   │   │   └── (quickwired)/  # Generated API routes
│   │   │       ├── users/
│   │   │       │   ├── getUser/
│   │   │       │   │   └── route.ts
│   │   │       │   └── createUser/
│   │   │       │       └── route.ts
│   │   │       └── quickwire-docs/
│   │   │           └── route.ts  # Auto-generated docs
│   │   └── components/
│   └── components/
├── quickwired/               # Generated client functions
│   ├── users.ts
│   ├── posts.ts
│   └── auth.ts
└── quickwire.config.json     # Optional configuration`}
                />
              </div>
            </section>

            {/* Performance Features */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="text-green-400" />
                Performance Features
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 text-green-300">Incremental Updates</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• Only regenerates changed files</li>
                    <li>• Maintains cache for unchanged functions</li>
                    <li>• Reduces build time significantly</li>
                    <li>• Smart dependency tracking</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 text-blue-300">Watch Mode</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• Real-time file monitoring</li>
                    <li>• Configurable debounce delays</li>
                    <li>• Excludes test files and node_modules</li>
                    <li>• Handles file renames and deletions</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Swagger Documentation */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Globe className="text-purple-400" />
                Swagger Documentation
              </h2>
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                <p className="text-gray-300 mb-4">
                  QuickWire automatically generates comprehensive API documentation in Swagger/OpenAPI format:
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-950/30 border border-purple-800/30 rounded-lg">
                    <h4 className="text-purple-400 font-semibold mb-2">Access Documentation</h4>
                    <p className="text-sm text-gray-300 mb-2">Visit your auto-generated documentation at:</p>
                    <code className="bg-gray-800 px-2 py-1 rounded text-purple-300">/api/quickwire-docs</code>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <h5 className="text-white font-medium mb-1">Includes:</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• Function signatures and parameters</li>
                        <li>• HTTP methods and endpoints</li>
                        <li>• Request/response schemas</li>
                        <li>• Type definitions</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <h5 className="text-white font-medium mb-1">Features:</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• Interactive API explorer</li>
                        <li>• Try-it-now functionality</li>
                        <li>• Code examples</li>
                        <li>• Export capabilities</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

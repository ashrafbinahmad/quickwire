import React, { useState, useEffect } from 'react';
import { Zap, Code, Shield, RefreshCw, ArrowRight, Copy, Check, Github, FileText, Terminal, Sparkles, Clock, Target, ChevronRight, Book, Settings, Globe, Layers } from 'lucide-react';
import { AnimatedBackground } from './components/AnimatedBG';
import { Documentation } from './Documentation';
import { CodeBlock } from './components/Codeblock';
import { GetStarted } from './components/GetStarted';

const QuickWireWebsite = () => {
  const [activePage, setActivePage] = useState('home');
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);



  

  interface FeatureCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    gradient: string;
  }

  const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, gradient }) => (
    <div className={`relative group p-6 rounded-2xl bg-gradient-to-br ${gradient} border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300 hover:scale-105`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <Icon className="w-8 h-8 text-white mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
    </div>
  );







  if (activePage === 'docs') {
    return (
      <Documentation setActivePage={setActivePage} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                QuickWire
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActivePage('docs')}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <Book size={18} />
                <span className="hidden sm:inline">Documentation</span>
              </button>
              <a href="https://github.com/ashrafbinahmad/quickwire" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <Github size={18} />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <a href="https://www.npmjs.com/package/quickwire" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <FileText size={18} />
                <span className="hidden sm:inline">NPM</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">Automatic API Generator for Next.js</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
              Build APIs<br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Without the Boilerplate
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              QuickWire automatically generates Next.js API routes and TypeScript client functions from your backend functions,
              eliminating boilerplate code and ensuring 100% type safety with automatic Swagger documentation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => { document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25 flex items-center gap-2"
              >
                Get Started
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => setActivePage('docs')}
                className="px-8 py-4 border border-gray-700 rounded-xl font-semibold hover:bg-gray-800/50 transition-all duration-300 hover:scale-105"
              >
                View Documentation
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">70%</div>
                <div className="text-sm text-gray-400">Less Code</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400 mb-1">100%</div>
                <div className="text-sm text-gray-400">Type Safety</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">0</div>
                <div className="text-sm text-gray-400">Maintenance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Comparison */}
      <section className="py-20 px-6 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Built for Modern Development
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Faster Development"
              description="No more boilerplate API routes. Write your backend functions and let QuickWire handle the rest automatically."
              gradient="from-yellow-900/30 to-orange-900/30"
            />
            <FeatureCard
              icon={Shield}
              title="Type Safety"
              description="End-to-end TypeScript support ensures your frontend and backend stay perfectly synchronized."
              gradient="from-blue-900/30 to-cyan-900/30"
            />
            <FeatureCard
              icon={RefreshCw}
              title="Hot Reload"
              description="Automatic regeneration during development. Changes to your backend functions instantly update your client code."
              gradient="from-green-900/30 to-teal-900/30"
            />
            <FeatureCard
              icon={Target}
              title="Zero Config"
              description="Works out of the box with sensible defaults. Spend time building features, not configuring tools."
              gradient="from-purple-900/30 to-pink-900/30"
            />
            <FeatureCard
              icon={Code}
              title="Modern Stack"
              description="Built specifically for Next.js 13+ App Router with full support for the latest React patterns."
              gradient="from-indigo-900/30 to-purple-900/30"
            />
            <FeatureCard
              icon={Globe}
              title="Swagger Docs"
              description="Automatically generates comprehensive API documentation with interactive Swagger UI at /api/quickwire-docs."
              gradient="from-pink-900/30 to-red-900/30"
            />
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-20 px-6 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            See It In Action
          </h2>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-300 flex items-center gap-2">
                <Terminal size={18} />
                Backend Function
              </h3>
              <CodeBlock
                language="TypeScript"
                id="backend"
                code={`// src/backend/users.ts
export async function getUser(params: { id: string }) {
  return prisma.user.findUnique({
    where: { id: params.id }
  });
}

export async function createUser(params: {
  name: string;
  email: string;
}) {
  return prisma.user.create({ data: params });
}`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-pink-300 flex items-center gap-2">
                <Code size={18} />
                Frontend Usage
              </h3>
              <CodeBlock
                language="TypeScript"
                id="frontend"
                code={`// src/app/users/page.tsx
"use client";
import { getUser, createUser } from "quickwired/users";

export default function UsersPage() {
  const handleGetUser = async () => {
    // ✨ Fully typed, auto-generated API call
    const user = await getUser({ id: "123" });
    console.log(user);
  };

  const handleCreateUser = async () => {
    const newUser = await createUser({
      name: "John Doe",
      email: "john@example.com"
    });
    console.log(newUser);
  };

  return (
    <div>
      <button onClick={handleGetUser}>Get User</button>
      <button onClick={handleCreateUser}>Create User</button>
    </div>
  );
}`}
              />
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-700/30 rounded-2xl">
            <h4 className="text-lg font-semibold mb-3 text-purple-300">QuickWire Automatically Generates:</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Next.js API routes in <code className="bg-gray-800 px-1 rounded text-xs">src/app/api/(quickwired)/</code></span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">TypeScript client functions in <code className="bg-gray-800 px-1 rounded text-xs">quickwired/</code></span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Full type safety and error handling</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Swagger documentation at <code className="bg-gray-800 px-1 rounded text-xs">/api/quickwire-docs</code></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <GetStarted />
      

      {/* Documentation Link */}
      <section className="py-20 px-6 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-2xl p-8">
            <Globe className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Automatic Swagger Documentation</h3>
            <p className="text-gray-300 mb-6">
              QuickWire automatically generates comprehensive API documentation with interactive Swagger UI accessible at:
            </p>
            <code className="bg-gray-800 px-4 py-2 rounded-lg text-purple-300">/api/quickwire-docs</code>
            <p className="text-sm text-gray-400 mt-4">
              Complete with function signatures, parameters, HTTP methods, type definitions, interactive testing, and usage examples.
            </p>
            {/* <button
              onClick={() => setActivePage('docs')}
              className="mt-6 px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 cursor-pointer rounded-lg transition-all duration-300 hover:scale-105 border border-purple-500/30 flex items-center gap-2 mx-auto"
            >
              <Book size={18} />
              View Full Documentation
            </button> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                QuickWire
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <button
                onClick={() => setActivePage('docs')}
                className="hover:text-white transition-colors"
              >
                Documentation
              </button>
              <a href="https://github.com/ashrafbinahmad/quickwire" className="hover:text-white transition-colors">
                GitHub
              </a>
              <a href="https://www.npmjs.com/package/quickwire" className="hover:text-white transition-colors">
                NPM Package
              </a>
              <span>Built for Next.js developers</span>
            </div>
          </div>

          <div className="border-t border-gray-800/30 mt-8 pt-8 text-center text-sm text-gray-500">
            Ready to eliminate API boilerplate? Install QuickWire and watch your development speed up! ⚡
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QuickWireWebsite;
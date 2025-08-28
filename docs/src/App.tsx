import React from 'react';
import { motion, useMotionValue, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Zap, Code, FileCode, Shield, Rocket, Coffee, Github, CheckCircle, XCircle,
  Clock, Target, Sparkles, ArrowRight, Copy, Check, Download, Package
} from 'lucide-react';

// Custom dark theme
const customOneDark = {
  ...oneDark,
  'pre[class*="language-"]': { ...oneDark['pre[class*="language-"]'], background: '#000000' },
  'code[class*="language-"]': { ...oneDark['code[class*="language-"]'], background: '#000000' }
};

// Ultra-optimized Floating Particles - Only 3 particles for performance
const FloatingParticles: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"
        animate={{
          x: [0, Math.random() * 800],
          y: [0, Math.random() * 600],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 20 + Math.random() * 15, repeat: Infinity, ease: "linear" }}
      />
    ))}
  </div>
);

// Magic Card Component (Optimized from Magic UI)
interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientOpacity?: number;
}

const MagicCard: React.FC<MagicCardProps> = ({
  children,
  className = '',
  gradientSize = 150,
  gradientOpacity = 0.05
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (cardRef.current) {
      const { left, top } = cardRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    }
  }, [mouseX, mouseY]);

  const handleMouseLeave = React.useCallback(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [mouseX, mouseY, gradientSize]);

  React.useEffect(() => {
    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div ref={cardRef} className={`group relative rounded-lg border border-gray-700/30 ${className}`}>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, rgba(59, 130, 246, ${gradientOpacity}), transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// Text Animate Component (Optimized from Magic UI)
interface TextAnimateProps {
  children: string;
  className?: string;
  animation?: 'fadeIn' | 'slideUp' | 'blurIn';
  delay?: number;
  by?: 'word' | 'character';
}

const TextAnimate: React.FC<TextAnimateProps> = ({
  children,
  className = '',
  animation = 'fadeIn',
  delay = 0,
  by = 'word'
}) => {
  const segments = by === 'word' ? children.split(' ') : children.split('');

  const variants = {
    fadeIn: { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } },
    slideUp: { hidden: { y: 15, opacity: 0 }, visible: { y: 0, opacity: 1 } },
    blurIn: { hidden: { opacity: 0, filter: 'blur(6px)' }, visible: { opacity: 1, filter: 'blur(0px)' } }
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ staggerChildren: 0.03, delayChildren: delay }}
    >
      {segments.map((segment, i) => (
        <motion.span
          key={i}
          variants={variants[animation]}
          transition={{ duration: 0.4 }}
          className={by === 'word' ? "inline-block mr-1" : "inline-block"}
        >
          {segment}
        </motion.span>
      ))}
    </motion.div>
  );
};

// Morphing Text Component (Optimized from Magic UI)
interface MorphingTextProps {
  texts: string[];
  className?: string;
}

const MorphingText: React.FC<MorphingTextProps> = ({ texts, className = '' }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, 4000); // Slower transition for better performance
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="w-full"
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {texts[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Optimized Glow Component - Reduced intensity
const MagicGlow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div className="relative">
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg blur-sm opacity-0"
      whileHover={{ opacity: 0.7 }}
      transition={{ duration: 0.2 }}
    />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

// Optimized CodeBlock with Magic UI copy button - No excessive scaling
interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
  fontSize?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  className = '',
  fontSize = 'lg'
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <MagicCard className="overflow-hidden">
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={customOneDark}
          className={`text-${fontSize} !bg-black ${className}`}
          customStyle={{ background: '#000000', margin: 0, borderRadius: '0.5rem' }}
        >
          {code}
        </SyntaxHighlighter>
        <motion.button
          onClick={copyToClipboard}
          className="absolute top-3 right-3 p-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50 rounded-md transition-colors"
          whileHover={{ scale: 1.02 }} // Minimal scaling
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="h-4 w-4 text-green-400" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Copy className="h-4 w-4 text-gray-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </MagicCard>
  );
};

// Simple Button Component with proper TypeScript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg';
  className?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  onClick
}) => {
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-600 bg-transparent hover:bg-gray-100 hover:text-black',
    ghost: 'hover:bg-gray-100 hover:text-black'
  };
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-8 text-base'
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Animation variants
const fadeInUp = { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const fadeInLeft = { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6 } } };
const fadeInRight = { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

// Code samples
const installationCode = `npm install quickwire-nextjs`;
const setupCode = `{\n  "scripts": {\n    "dev": "quickwire dev",\n    "build": "quickwire build"\n  }\n}`;
const backendCode = `export async function getUser(params: { id: string }) {\n  return prisma.user.findUnique({\n    where: { id: params.id }\n  });\n}`;
const clientCode = `import { getUser } from "quickwired/users";\nimport { useQuery } from "@tanstack/react-query";\n\nconst { data: user, isLoading, error } = useQuery({\n  queryKey: ['user', '123'],\n  queryFn: () => getUser({ id: '123' })\n});`;

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-gray-700/50"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(31, 41, 55, 0.9))' }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <MagicGlow>
              <div className="flex items-center space-x-3">
                <Zap className="h-8 w-8 text-blue-500" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Quickwire
                </span>
              </div>
            </MagicGlow>

            <div className="flex items-center space-x-4">
              <MagicGlow><Button variant="ghost" size="sm"><Github className="h-5 w-5 mr-2" />GitHub</Button></MagicGlow>
              <MagicGlow>
                <a href="https://www.buymeacoffee.com/ashrafkuzhimanna" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style={{ height: 60, width: 217 }} /></a>

              </MagicGlow>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-6 relative min-h-screen flex items-center">
        <FloatingParticles />

        {/* Simple background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
            animate={{ x: [0, 100, -50, 0], y: [0, -50, 25, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-green-500/15 to-yellow-500/15 rounded-full blur-3xl"
            animate={{ x: [0, -80, 50, 0], y: [0, 60, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          <div className="mb-8">
            <div className="text-6xl md:text-7xl font-bold leading-tight mb-8 z-50 uppercase">
              <div className="h-20 md:h-24 mb-8 z-50">
                <MorphingText
                  texts={["Auto API", "Zero Boilerplate", "100% Type Safe", "Lightning Fast"]}
                  className="z-50 text-white _bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                />
              </div>
            </div>
            <div className="text-4xl md:text-6xl font-bold text-white opacity-100 mb-8">
              for Next.js Applications
            </div>
          </div>

          <TextAnimate
            animation="slideUp"
            delay={0.5}
            className="text-2xl md:text-3xl text-gray-300 mb-12 leading-relaxed font-light"
          >
            Eliminate boilerplate code forever. Quickwire automatically generates Next.js API routes and TypeScript client functions, ensuring 100% type safety.
          </TextAnimate>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <MagicGlow>
              <Button size="lg" className="group">
                <Rocket className="h-6 w-6 mr-3" />
                Get Started Now
              </Button>
            </MagicGlow>
            <MagicGlow>
              <Button variant="outline" size="lg">
                <FileCode className="h-6 w-6 mr-3" />View Documentation
              </Button>
            </MagicGlow>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { value: "70%", label: "Less Code", color: "from-blue-400 to-blue-600" },
              { value: "100%", label: "Type Safety", color: "from-purple-400 to-purple-600" },
              { value: "0", label: "Maintenance", color: "from-pink-400 to-pink-600" }
            ].map((stat) => (
              <MagicCard key={stat.label} className="text-center p-6">
                <div className={`text-6xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-4`}>
                  {stat.value}
                </div>
                <div className="text-xl text-gray-400 font-medium">{stat.label}</div>
              </MagicCard>
            ))}
          </div>
        </div>
      </section>

      {/* Before & After Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-800/30 to-gray-900/30">
        <div className="container mx-auto">
          <TextAnimate animation="fadeIn" className="text-6xl font-bold text-center mb-6">
            Transform Your Workflow
          </TextAnimate>

          <TextAnimate animation="fadeIn" delay={0.3} className="text-2xl text-gray-300 text-center mb-20 max-w-3xl mx-auto">
            See the dramatic difference Quickwire makes in your development process
          </TextAnimate>

          <div className="grid lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
            {/* Before */}
            <MagicCard className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-2 border-red-600/30 rounded-3xl p-10">
              <div className="flex items-center mb-8">
                <XCircle className="h-10 w-10 text-red-400 mr-4" />
                <h3 className="text-4xl font-bold text-red-300">Before Quickwire</h3>
              </div>
              <div className="space-y-6 mb-10">
                {['Write backend function manually', 'Create API route manually', 'Write client function manually', 'Debug type mismatches'].map((item) => (
                  <div key={item} className="flex items-center text-red-200">
                    <Clock className="h-6 w-6 mr-4 text-red-400" />
                    <span className="text-xl font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-red-950/50 border border-red-700/50 rounded-2xl p-6">
                <p className="text-red-100 font-semibold text-2xl">❌ Result: Hours of boilerplate, bugs, endless maintenance</p>
              </div>
            </MagicCard>

            {/* After */}
            <MagicCard className="bg-gradient-to-br from-green-900/30 to-emerald-800/20 border-2 border-green-500/30 rounded-3xl p-10 relative">
              <div className="absolute -top-6 -right-6 bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg">
                <Sparkles className="h-5 w-5 inline mr-2" />MAGIC
              </div>

              <div className="flex items-center mb-8">
                <CheckCircle className="h-10 w-10 text-green-400 mr-4" />
                <h3 className="text-4xl font-bold text-green-300">After Quickwire</h3>
              </div>
              <div className="space-y-6 mb-10">
                <div className="flex items-center text-green-200">
                  <Target className="h-6 w-6 mr-4 text-green-400" />
                  <span className="text-xl font-medium">Write backend function</span>
                </div>
                <div className="flex items-center text-green-200">
                  <Zap className="h-6 w-6 mr-4 text-green-400" />
                  <span className="text-xl font-medium">Run <code className="bg-green-700/30 px-3 py-1 rounded-lg">npm run dev</code></span>
                </div>
                <div className="flex items-center text-green-200">
                  <Sparkles className="h-6 w-6 mr-4 text-green-400" />
                  <span className="text-xl font-bold">Everything else is auto-generated!</span>
                </div>
              </div>
              <div className="bg-green-950/50 border border-green-600/50 rounded-2xl p-6">
                <p className="text-green-100 font-semibold text-2xl">✨ Result: 70% less code, 100% type safety, zero maintenance</p>
              </div>
            </MagicCard>
          </div>
        </div>
      </section>



      {/* Installation Steps */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <TextAnimate animation="blurIn" className="text-5xl font-bold text-center mb-16">
            Get Started in 30 Seconds
          </TextAnimate>

          <div className="space-y-8">
            {[
              { num: "1", title: "Install Quickwire", code: installationCode, lang: "bash", bg: "bg-blue-500" },
              { num: "2", title: "Update package.json", code: setupCode, lang: "json", bg: "bg-purple-500" },
              { num: "3", title: "Write your backend function", code: backendCode, lang: "typescript", bg: "bg-green-500" },
              { num: "✨", title: "Use auto-generated client (type-safe!)", code: clientCode, lang: "typescript", bg: "bg-gradient-to-r from-green-500 to-blue-500" }
            ].map((step) => (
              <MagicCard key={step.num} className={`${step.num === "✨" ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/50" : "bg-gray-800 border-gray-700"} rounded-2xl p-8 border`}>
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <span className={`${step.bg} text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                    {step.num}
                  </span>
                  {step.title}
                </h3>
                <CodeBlock code={step.code} language={step.lang} />
              </MagicCard>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gray-800/50">
        <div className="container mx-auto">
          <TextAnimate animation="fadeIn" className="text-5xl font-bold text-center mb-16">
            Powerful Features
          </TextAnimate>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: Zap, title: "Auto-Generation", desc: "Automatically generates Next.js API routes and TypeScript client functions from your backend code.", color: "blue" },
              { icon: Shield, title: "100% Type Safety", desc: "End-to-end TypeScript support ensures your APIs and clients are always in sync with zero type errors.", color: "purple" },
              { icon: FileCode, title: "Hot Reload", desc: "Watch mode automatically regenerates your APIs as you code, with instant hot reload support.", color: "green" },
              { icon: Target, title: "HTTP Method Detection", desc: "Smart function name analysis automatically determines the correct HTTP method (GET/POST/PUT/DELETE).", color: "yellow" },
              { icon: Sparkles, title: "Auto Documentation", desc: "Access comprehensive API documentation at /api/quickwire-docs", color: "pink" },
              { icon: Code, title: "Zero Config", desc: "Works out of the box with sensible defaults, but fully customizable when you need more control.", color: "blue" }
            ].map((feature) => (
              <MagicCard key={feature.title} className="bg-gray-900 p-8 rounded-2xl">
                <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {feature.desc.includes('/api/quickwire-docs') ? (
                    <>Access comprehensive API documentation at <code className="bg-gray-800 px-2 py-1 rounded">/api/quickwire-docs</code></>
                  ) : feature.desc}
                </p>
              </MagicCard>
            ))}
          </div>
        </div>
      </section>

      {/* Code Writing Difference Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-900/50 to-black/50">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <div className="text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Code Writing Difference
              </span>
            </div>

            <TextAnimate animation="fadeIn" delay={0.3} className="text-2xl text-gray-300 max-w-4xl mx-auto">
              Compare the massive difference between manual implementation and Quickwire's automated approach
            </TextAnimate>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Manual Implementation - Before */}
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-3 rounded-full text-xl font-bold mb-6">
                  <XCircle className="h-6 w-6 mr-2" />
                  Manual Implementation
                </div>
                <div className="text-red-300 font-semibold text-lg mb-8">📁 3 files • 🖋️ 127 lines • ⏱️ 2 hours</div>
              </div>

              {/* Backend Function */}
              <MagicCard className="bg-red-950/20 border border-red-600/30">
                <div className="bg-red-900/30 px-4 py-2 border-b border-red-600/30">
                  <div className="flex items-center text-red-300 font-mono text-sm">
                    <FileCode className="h-4 w-4 mr-2" />
                    src/backend/user.ts
                  </div>
                </div>
                <CodeBlock
                  code={`export async function getUser(params: { id: string }) {
  return prisma.user.findUnique({
    where: { id: params.id }
  });
}`}
                  language="typescript"
                  fontSize="sm"
                />
              </MagicCard>

              {/* API Route */}
              <MagicCard className="bg-red-950/20 border border-red-600/30">
                <div className="bg-red-900/30 px-4 py-2 border-b border-red-600/30">
                  <div className="flex items-center text-red-300 font-mono text-sm">
                    <FileCode className="h-4 w-4 mr-2" />
                    src/app/api/users/[id]/route.ts
                  </div>
                </div>
                <CodeBlock
                  code={`import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/backend/user';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser({ id: params.id });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}`}
                  language="typescript"
                  fontSize="sm"
                />
              </MagicCard>

              {/* Client Code */}
              <MagicCard className="bg-red-950/20 border border-red-600/30">
                <div className="bg-red-900/30 px-4 py-2 border-b border-red-600/30">
                  <div className="flex items-center text-red-300 font-mono text-sm">
                    <FileCode className="h-4 w-4 mr-2" />
                    src/components/UserProfile.tsx
                  </div>
                </div>
                <CodeBlock
                  code={`// Manual fetch implementation
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(\`/api/users/\${userId}\`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchUser();
}, [userId]);

// Handle loading, error states manually...`}
                  language="typescript"
                  fontSize="sm"
                />
              </MagicCard>
            </div>

            {/* Quickwire Implementation - After */}
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-full text-xl font-bold mb-6 shadow-lg">
                  <Sparkles className="h-6 w-6 mr-2" />
                  Quickwire Magic ✨
                </div>
                <div className="text-green-300 font-semibold text-lg mb-4">📁 1 file • 🖋️ 5 lines • ⏱️ 30 seconds</div>
                <div className="text-green-400 font-medium text-md">Just write your backend function and watch the magic happen!</div>
              </div>

              {/* Backend Function Only */}
              <MagicCard className="bg-green-950/20 border border-green-500/30">
                <div className="bg-green-900/30 px-4 py-2 border-b border-green-500/30">
                  <div className="flex items-center text-green-300 font-mono text-sm">
                    <FileCode className="h-4 w-4 mr-2" />
                    src/backend/user.ts
                  </div>
                </div>
                <CodeBlock
                  code={`export async function getUser(params: { id: string }) {
  return prisma.user.findUnique({
    where: { id: params.id }
  });
}`}
                  language="typescript"
                  fontSize="sm"
                />
              </MagicCard>

              {/* Auto-Generated Magic Banner */}
              <div className="text-center py-8">
                <motion.div
                  className="inline-flex items-center bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-2 border-yellow-400/50 text-yellow-300 px-8 py-5 rounded-2xl text-lg font-bold shadow-lg backdrop-blur-sm"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(250, 204, 21, 0.4)',
                      '0 0 40px rgba(250, 204, 21, 0.6)',
                      '0 0 20px rgba(250, 204, 21, 0.4)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="h-7 w-7 mr-3 text-yellow-400" />
                  ✨ Magic happens here - API routes & imports AUTO-GENERATED! ✨
                </motion.div>
                <div className="text-gray-400 text-sm mt-3 italic">No manual API routes, no fetch() boilerplate, just pure magic!</div>
              </div>




              {/* Enhanced Client Code with Highlighting */}
              <MagicCard className="bg-green-950/20 border border-green-500/30 relative overflow-hidden">


                {/* Enhanced background highlight for the import line */}
                <motion.div
                  className="absolute top-[60px] left-0 right-0 h-7 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 border-l-4 border-yellow-400/60"
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    boxShadow: [
                      '0 0 10px rgba(250, 204, 21, 0.3)',
                      '0 0 20px rgba(250, 204, 21, 0.5)',
                      '0 0 10px rgba(250, 204, 21, 0.3)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                <div className="bg-green-900/30 px-4 py-2 border-b border-green-500/30 relative z-10">
                  <div className="flex items-center text-green-300 font-mono text-sm">
                    <FileCode className="h-4 w-4 mr-2" />
                    Your React component - Type-safe & effortless!
                  </div>
                </div>

                <div className="relative">
                  <CodeBlock
                    code={`// ✨ This import is AUTO-GENERATED with perfect types!
import { getUser } from "quickwired/user"; // ← PURE MAGIC! ✨
import { useQuery } from "@tanstack/react-query";

// You write this part - but with 100% type safety!
const { data: user, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => getUser({ id: userId }) // ← Fully typed, zero errors!
});

// No API routes to write, no fetch() chaos - just works! 🚀`}
                    language="typescript"
                    fontSize="sm"
                  />

                  <motion.div
                    className="absolute top-[60px] left-0 right-0 h-7 w-full bg-gradient-to-r from-yellow-400/30 to-orange-500/30 border-l-4 border-yellow-400/60"
                    animate={{
                      opacity: [0.6, 1, 0.6],
                      boxShadow: [
                        '0 0 10px rgba(250, 204, 21, 0.3)',
                        '0 0 20px rgba(250, 204, 21, 0.5)',
                        '0 0 10px rgba(250, 204, 21, 0.3)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="absolute right-4 top-0 h-full flex items-center">
                      <span className="text-yellow-400 text-xs font-bold animate-pulse">
                        ✨ AUTO-GENERATED IMPORT
                      </span>
                    </div>
                  </motion.div>

                  {/* Properly positioned floating badge for the import line */}
                  <motion.div
                    className="absolute top-[42px] right-4 bg-gradient-to-r from-yellow-400/90 to-orange-500/90 text-black px-2 py-1 rounded-md text-xs font-bold shadow-lg pointer-events-none z-10"
                    animate={{
                      x: [0, 3, 0],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    AUTO-WIRED!
                  </motion.div>
                </div>
              </MagicCard>
            </div>
          </div>

          {/* Comparison Summary */}

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
        <div className="container mx-auto text-center">
          <TextAnimate animation="fadeIn" className="text-5xl font-bold mb-8">
            Ready to Eliminate API Boilerplate?
          </TextAnimate>

          <TextAnimate animation="fadeIn" delay={0.3} className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of developers who have transformed their Next.js development workflow with Quickwire.
          </TextAnimate>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <MagicGlow>
              <Button size="lg" className="group">
                <Rocket className="h-5 w-5 mr-2" />
                Start Building Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </MagicGlow>
            <MagicGlow>
              <Button variant="outline" size="lg">
                <Github className="h-5 w-5 mr-2" />Star on GitHub
              </Button>
            </MagicGlow>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Zap className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold">Quickwire</span>
            </div>

            <div className="flex items-center space-x-6">
              <MagicGlow>
                <Button variant="ghost" size="sm">
                  <Github className="h-4 w-4 mr-2" />GitHub
                </Button>
              </MagicGlow>
              <MagicGlow>
                <a href="https://www.buymeacoffee.com/ashrafkuzhimanna" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style={{ height: 60, width: 217 }} /></a>

              </MagicGlow>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
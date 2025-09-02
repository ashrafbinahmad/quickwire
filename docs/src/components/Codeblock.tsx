import { Check, Copy } from "lucide-react";
import { useState } from "react";

const syntaxHighlight = (code: string, language: string): string => {
  // Escape HTML entities first
  const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (language === 'typescript' || language === 'javascript') {
    const keywords = new Set([
      'export', 'import', 'from', 'const', 'let', 'var', 'function', 'async', 'await',
      'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'new', 'true', 'false',
      'null', 'undefined', 'class', 'extends', 'interface', 'type', 'enum'
    ]);

    const tokens = [];
    let i = 0;

    while (i < code.length) {
      // Skip whitespace
      if (/\s/.test(code[i])) {
        tokens.push({ type: 'whitespace', value: code[i] });
        i++;
        continue;
      }

      // Comments
      if (code.slice(i, i + 2) === '//') {
        const start = i;
        while (i < code.length && code[i] !== '\n') i++;
        tokens.push({ type: 'comment', value: code.slice(start, i) });
        continue;
      }

      // String literals
      if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
        const quote = code[i];
        const start = i++;
        while (i < code.length && code[i] !== quote) {
          if (code[i] === '\\') i++; // Skip escaped characters
          i++;
        }
        if (i < code.length) i++; // Include closing quote
        tokens.push({ type: 'string', value: code.slice(start, i) });
        continue;
      }

      // Numbers
      if (/\d/.test(code[i])) {
        const start = i;
        while (i < code.length && /[\d.]/.test(code[i])) i++;
        tokens.push({ type: 'number', value: code.slice(start, i) });
        continue;
      }

      // Brackets and parentheses
      if (/[{}()\[\]]/.test(code[i])) {
        tokens.push({ type: 'bracket', value: code[i] });
        i++;
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_$]/.test(code[i])) {
        const start = i;
        while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++;
        const value = code.slice(start, i);
        const type = keywords.has(value) ? 'keyword' : 'identifier';
        tokens.push({ type, value });
        continue;
      }

      // Everything else
      tokens.push({ type: 'other', value: code[i] });
      i++;
    }

    return tokens.map(token => {
      const escaped = escapeHtml(token.value);
      switch (token.type) {
        case 'keyword': return `<span class="text-blue-400">${escaped}</span>`;
        case 'string': return `<span class="text-green-400">${escaped}</span>`;
        case 'comment': return `<span class="text-gray-500">${escaped}</span>`;
        case 'number': return `<span class="text-orange-400">${escaped}</span>`;
        case 'bracket': return `<span class="text-yellow-400">${escaped}</span>`;
        default: return escaped;
      }
    }).join('');

  } else if (language === 'json') {
    // Simple JSON highlighting
    let result = escapeHtml(code);
    result = result.replace(/(".*?")(\s*:)/g, '<span class="text-blue-400">$1</span>$2');
    result = result.replace(/:\s*(".*?")/g, ': <span class="text-green-400">$1</span>');
    result = result.replace(/:\s*(\d+(?:\.\d+)?)/g, ': <span class="text-orange-400">$1</span>');
    result = result.replace(/:\s*(true|false|null)/g, ': <span class="text-purple-400">$1</span>');
    return result;

  } else if (language === 'bash') {
    let result = escapeHtml(code);
    result = result.replace(/\b(npm|npx|git|cd|mkdir|touch|ls|pwd)\b/g, '<span class="text-blue-400">$1</span>');
    result = result.replace(/\b(install|run|build|dev|start)\b/g, '<span class="text-green-400">$1</span>');
    result = result.replace(/(--\w+|-\w)\b/g, '<span class="text-yellow-400">$1</span>');
    return result;
  }

  return escapeHtml(code);
};

interface CodeBlockProps {
  code: string;
  language: string;
  id: string;
}


export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, id }) => {
  const [copiedCode, setCopiedCode] = useState('');
  const copyToClipboard = (text: string, id: string): void => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };
  return (
    <div className="relative bg-gray-900 rounded-xl p-4 border border-gray-700/50 overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copiedCode === id ? <Check size={12} /> : <Copy size={12} />}
          {copiedCode === id ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="text-sm text-gray-100">
        <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(code, language.toLowerCase()) }} />
      </pre>
    </div>
  );
}
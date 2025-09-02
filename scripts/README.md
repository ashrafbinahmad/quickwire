# <div align="center"><div style="width: 32px; height: 32px; background: linear-gradient(to right, #8b5cf6, #ec4899); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg></div> Quickwire</div> 

**Automatic API Generator for Next.js Applications**

Quickwire automatically generates Next.js API routes and TypeScript client functions from your backend functions, eliminating boilerplate code and ensuring type safety.

<div align="center">

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/quickwire)
[![NPM Package](https://img.shields.io/badge/NPM%20Package-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/quickwire)
[![Read Documentation](https://img.shields.io/badge/Read%20Documentation-4285F4?style=for-the-badge&logo=gitbook&logoColor=white)](https://ashrafbinahmad.github.io/quickwire/)
</div>

## 📦 Installation

```bash
# Install Quickwire
npm install quickwire --save-dev
```

## ⚙️ Setup

Update your `package.json`:

```json
{
  "packageManager": "npm@11.3.0", // Your npm version can be checked with "npm --version"
  "scripts": {
    "quickwire": "quickwire --watch",
    "nextdev": "next dev --turbopack",
    "dev": "turbo run quickwire nextdev --parallel",
    "prebuild": "quickwire",
    "build": "next build"
  },
}
```

Add TypeScript path mapping to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "quickwired/*": ["./quickwired/*"],
      "@/*": ["./src/*"]
    }
  }
}
```

## 🎯 How It Works

### Before Quickwire (Manual)

1. Write backend function
2. Create API route manually
3. Write client function manually
4. Handle types manually
5. Manage errors manually

**Result**: Lots of boilerplate, potential type mismatches, manual maintenance

### After Quickwire (Automatic)

1. Write backend function
2. Run `npm run dev`
3. ✨ Everything else is auto-generated!

**Result**: 70% less code, 100% type safety, zero maintenance

## 📝 Integration Example

### Step 1: Write Your Backend Function

```typescript
// src/backend/users.ts
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
}
```

### Step 2: Use in Your React Component

```typescript
// src/app/users/page.tsx
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
}
```

### That's It! 🎉

Quickwire automatically generates:
- ✅ Next.js API routes in `src/app/api/(quickwired)/`
- ✅ TypeScript client functions in `quickwired/`
- ✅ Full type safety and error handling
- ✅ HTTP method detection (GET/POST/PUT/DELETE)
- ✅ **API documentation at `/api/quickwire-docs`**

## 🔧 Configuration

Optional `quickwire.config.json` in your scripts directory:

```json
{
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
}
```

### Configuration Options

- **`backendDir`**: Directory containing backend functions (default: `"src/backend"`)
- **`apiDir`**: Directory where API routes are generated (default: `"src/app/api/(quickwired)"`)
- **`quickwireDir`**: Directory where client functions are generated (default: `"quickwired"`)
- **`supportedExtensions`**: File extensions to process (default: `[".ts", ".js"]`)
- **`excludePatterns`**: Files/patterns to ignore during processing
- **`watchDebounceMs`**: Debounce delay for file watching (default: `100`ms)
- **`performance`**: Performance optimization settings
- **`httpMethods`**: Function name patterns for HTTP method detection

### 📚 API Documentation

Quickwire automatically generates API documentation accessible at:

```
/api/quickwire-docs
```

This endpoint provides comprehensive documentation of all your generated API routes, including:
- 📋 Function signatures and parameters
- 🔍 HTTP methods and endpoints
- 📝 Type definitions
- 🚀 Usage examples

## 🚀 Quick Start

```bash
# 1. Check npm version (requires npm 11.3.0 or higher)
npm --version

# 2. If needed, update npm
npm install -g npm@latest

# 3. Install packages
npm install quickwire turbo --save-dev

# 4. Update package.json scripts (see above)

# 5. Start development
npm run dev

# 6. Write functions in src/backend/
# 7. Import from quickwired/* in your components
```

## 📊 Benefits

- **🚄 Faster Development**: No more boilerplate API routes
- **🔒 Type Safety**: End-to-end TypeScript support
- **🔄 Hot Reload**: Automatic regeneration during development
- **🎯 Zero Config**: Works out of the box
- **📱 Modern**: Built for Next.js 13+ App Router

---

**Ready to eliminate API boilerplate?** Install Quickwire and watch your development speed up! ⚡

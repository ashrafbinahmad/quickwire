# <div align="center"><div style="width: 32px; height: 32px; background: linear-gradient(to right, #8b5cf6, #ec4899); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg></div> Quickwire</div> 

**Automatic API Generator for Next.js Applications**

Quickwire automatically generates Next.js API routes and TypeScript client functions from your backend functions, eliminating boilerplate code and ensuring type safety.

> **Note**: This root directory is a test Next.js application. The actual Quickwire npm module codebase is located in the `scripts` folder. Please go there for the complete codebase and documentation.

<div align="center">

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/quickwire)
[![NPM Package](https://img.shields.io/badge/NPM%20Package-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/quickwire)
[![Read Documentation](https://img.shields.io/badge/Read%20Documentation-4285F4?style=for-the-badge&logo=gitbook&logoColor=white)](https://ashrafbinahmad.github.io/quickwire/)

[📦 View Quickwire Codebase →](scripts/)

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
    "build": "next build --turbopack"
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
6. Write API documentation manually

**Result**: Lots of boilerplate, potential type mismatches, manual maintenance

### After Quickwire (Automatic)

1. Write backend function
2. Run `npm run dev`
3. ✨ Everything else is auto-generated!

**Result**: 70% less code, 100% type safety, zero maintenance, automatic Swagger documentation

## 🔐 Authentication & Authorization

Quickwire includes a complete authentication system with JWT tokens and role-based access control:

### Features

- **User Authentication**: Signup and login with JWT tokens
- **Role-Based Access**: USER and ADMIN roles with appropriate permissions
- **Protected Routes**: Client-side protection for authenticated pages
- **Todo Management**: Users can only see/edit their own todos, admins can manage all
- **Admin Panel**: Dedicated interface for system administration

### Authentication API

- `signup({ name, email, password })` - Create new user account
- `login({ email, password })` - Authenticate user and return JWT token
- `getProfile()` - Get authenticated user profile
- `updateProfile({ name?, email? })` - Update user profile
- `changePassword({ currentPassword, newPassword })` - Change user password

### Todo API

- `getTodos({ completed? })` - Get user's todos (users only see their own)
- `getAllTodos({ userId?, completed? })` - Get all todos (admin only)
- `createTodo({ title, description?, userId? })` - Create todo (users create for themselves, admins can create for others)
- `updateTodo({ id, title?, description?, completed? })` - Update todo (users can only update their own)
- `deleteTodo({ id })` - Delete todo (users can only delete their own)
- `toggleTodo({ id })` - Toggle todo completion status

### Admin API

- `getUsers({ role? })` - Get all users (admin only)
- `getUserDetails({ id })` - Get detailed user information (admin only)
- `createUser({ name, email, password, role? })` - Create user (admin only)
- `updateUser({ id, name?, email?, role? })` - Update user (admin only)
- `deleteUser({ id })` - Delete user (admin only)
- `getDashboardStats()` - Get system statistics (admin only)

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


## 🚀 Quick Start

```bash
# 1. Check npm version (requires npm 11.3.0 or higher)
npm --version

# 2. If needed, update npm
npm install -g npm@latest

# 3. Install packages
npm install quickwire --save-dev

# 4. Update package.json scripts (see above)

# 5. Set up environment variables
# Copy .env.example to .env and update values

# 6. Run database migrations
npx prisma migrate dev

# 7. Seed the database with demo data
npm run seed

# 8. Start development
npm run dev

# 9. Write functions in src/backend/
# 10. Import from quickwired/* in your components
```

## 🔐 Demo Credentials

- **Admin User**: admin@example.com / password123
- **Regular User**: user@example.com / password123

## 📊 Benefits

- **🚄 Faster Development**: No more boilerplate API routes
- **🔒 Type Safety**: End-to-end TypeScript support
- **🔄 Hot Reload**: Automatic regeneration during development
- **🎯 Zero Config**: Works out of the box
- **📱 Modern**: Built for Next.js 13+ App Router

---

**Ready to eliminate API boilerplate?** Install Quickwire and watch your development speed up! ⚡
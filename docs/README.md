# Quickwire Documentation

Simple, focused documentation for Quickwire - the automatic API generator for Next.js.

## 🚀 What's Included

This documentation covers:
- **Installation** - How to install Turbo and Quickwire
- **Package.json Setup** - Essential scripts for your Next.js project
- **What it Does** - Clear explanation of Quickwire's functionality
- **Before/After Comparison** - See the difference Quickwire makes
- **Generated Code Preview** - Examples of auto-generated code
- **Configuration** - Simple config file setup

## 📁 Technology Stack

- **Vite** - Fast build tool and dev server
- **React 18** - Modern React with hooks
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **React Syntax Highlighter** - Beautiful code examples

## 🛠 Development

### Local Development

```bash
cd docs
npm install
npm run dev
```

Visit `http://localhost:5173` to see the documentation.

### Build for Production

```bash
npm run build
npm run preview
```

## 🌐 Deployment to GitHub Pages

### Automatic Deployment (Recommended)

1. Push this `docs` folder to your GitHub repository
2. The GitHub Actions workflow will automatically:
   - Install dependencies
   - Build the Vite React app
   - Deploy to GitHub Pages
3. Your documentation will be available at `https://your-username.github.io/quickwire`

### Manual Setup

If you prefer manual setup:

1. Go to repository **Settings** > **Pages**
2. Select **GitHub Actions** as source
3. The workflow in `.github/workflows/deploy-docs.yml` will handle the rest

## 📝 Content Updates

### Main Content

Edit `src/App.tsx` to update:
- Installation instructions
- Code examples
- Feature descriptions
- Configuration details

### Styling

The documentation uses Tailwind CSS with a custom design. Key classes:
- `bg-gradient-to-r from-blue-600 to-purple-600` - Header gradient
- `bg-white rounded-lg shadow-md p-6` - Content cards
- Syntax highlighting via `react-syntax-highlighter`

### Code Examples

Code examples use `react-syntax-highlighter` with the `vscDarkPlus` theme:

```tsx
<SyntaxHighlighter language="typescript" style={vscDarkPlus}>
  {`your code here`}
</SyntaxHighlighter>
```

## 🎯 Key Features

### Simple & Focused
- No complex navigation
- Single-page documentation
- Clear, actionable content
- Visual before/after comparisons

### Developer-Friendly
- Copy-paste ready code examples
- Real-world usage scenarios
- Configuration examples
- Step-by-step instructions

### Modern Tech Stack
- Fast Vite development
- React 18 with TypeScript
- Responsive Tailwind design
- Optimized production builds

## 📋 Deployment Checklist

- [ ] Update GitHub repository URLs in `src/App.tsx`
- [ ] Customize the project name and description
- [ ] Test all code examples
- [ ] Verify responsive design
- [ ] Update `vite.config.ts` base URL if needed
- [ ] Test local build: `npm run build && npm run preview`
- [ ] Push to GitHub for automatic deployment

## 🤝 Contributing

To update the documentation:

1. Edit files in the `src/` directory
2. Test changes locally with `npm run dev`
3. Build and preview with `npm run build && npm run preview`
4. Commit and push changes
5. GitHub Actions will automatically redeploy

The documentation focuses on the essentials: installation, configuration, and showing developers exactly what Quickwire does with clear before/after examples. This makes it easy for users to understand and adopt Quickwire quickly.
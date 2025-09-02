# Quickwire Documentation Deployment

This directory contains the documentation website for Quickwire, built with Vite + React + TypeScript.

## Local Development

```bash
cd docs
npm install
npm run dev
```

The development server will start at `http://localhost:5173`

## Building for Production

```bash
cd docs
npm run build
```

This creates a `dist` folder with the production build.

## Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch in the `docs/` directory.

### GitHub Pages Setup

1. Go to your repository Settings
2. Navigate to Pages section
3. Set Source to "GitHub Actions"
4. The workflow file `.github/workflows/deploy-docs.yml` will handle the deployment

### Manual Deployment

You can also trigger the deployment manually:

1. Go to the Actions tab in your GitHub repository
2. Select "Deploy Docs" workflow
3. Click "Run workflow"

## Configuration

- **Vite Config**: `vite.config.ts` - Handles build configuration and GitHub Pages base path
- **Tailwind**: `tailwind.config.js` - Styling configuration
- **TypeScript**: `tsconfig.json` - TypeScript compiler options

## Technologies Used

- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **React Syntax Highlighter** - Code highlighting

## Project Structure

```
docs/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # React DOM entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── dist/                # Build output (generated)
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Troubleshooting

### GitHub Pages Not Updating

1. Check the Actions tab for deployment status
2. Ensure the workflow has proper permissions
3. Verify the base path in `vite.config.ts` matches your repository name

### Build Errors

1. Check Node.js version (requires 18+)
2. Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
3. Check for TypeScript errors: `npm run lint`

### Local Development Issues

1. Ensure you're in the `docs/` directory
2. Check port 5173 is available
3. Clear Vite cache: `npx vite --force`
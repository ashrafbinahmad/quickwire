# Publishing Guide for quickwire

## Prerequisites

1. **npm Account**: Make sure you have an npm account
2. **npm CLI**: Install npm CLI and login
3. **Node.js**: Ensure Node.js 18+ is installed

## Setup

1. **Login to npm**:
   ```bash
   npm login
   ```

2. **Navigate to scripts directory**:
   ```bash
   cd scripts
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

## Building

Build the TypeScript files to JavaScript:

```bash
npm run build
```

This will create a `dist/` directory with compiled JavaScript files and type definitions.

## Testing Locally

Before publishing, test the package locally:

1. **Pack the package**:
   ```bash
   npm pack
   ```
   This creates a `.tgz` file you can install locally.

2. **Test in another project**:
   ```bash
   cd /path/to/test-project
   npm install /path/to/quickwire/scripts/quickwire-0.1.0.tgz
   ```

## Publishing

### First Time Publishing

1. **Check package name availability**:
   ```bash
   npm view quickwire
   ```
   If it returns an error, the name is available.

2. **Publish**:
   ```bash
   npm publish
   ```

### Updating Versions

1. **Update version**:
   ```bash
   # Patch version (0.1.0 -> 0.1.1)
   npm version patch

   # Minor version (0.1.0 -> 0.2.0)  
   npm version minor

   # Major version (0.1.0 -> 1.0.0)
   npm version major
   ```

2. **Publish updated version**:
   ```bash
   npm publish
   ```

## Beta/Alpha Releases

For pre-releases:

```bash
# Create beta version
npm version prerelease --preid=beta

# Publish with beta tag
npm publish --tag beta
```

Users can install beta versions with:
```bash
npm install quickwire@beta
```

## Verification

After publishing, verify the package:

1. **Check on npm**:
   ```bash
   npm view quickwire
   ```

2. **Install and test**:
   ```bash
   npm install quickwire
   quickwire --help
   ```

## Package Structure

The published package includes:

```
quickwire/
├── dist/                 # Compiled JavaScript and type definitions
│   ├── index.js
│   ├── index.d.ts
│   ├── cli.js
│   ├── config.js
│   ├── ast.js
│   ├── generator.js
│   └── ...
├── README.md            # Documentation
├── LICENSE              # MIT License
└── package.json         # Package metadata
```

## Usage After Publishing

Users can install and use the package:

```bash
# Install
npm install quickwire

# Use CLI
npx quickwire --watch

# Use in code
import { scanAllBackendFunctions } from 'quickwire';
```

## Troubleshooting

### Publishing Issues

1. **401 Unauthorized**: Run `npm login` again
2. **403 Forbidden**: Package name might be taken or you don't have permissions
3. **Package name too similar**: Choose a different name

### Build Issues

1. **TypeScript errors**: Fix all TypeScript compilation errors
2. **Missing dependencies**: Ensure all dependencies are listed in package.json

### Testing Issues

1. **CLI not working**: Ensure the `bin` field in package.json is correct
2. **Import errors**: Check that exports in index.ts match the actual files

## Best Practices

1. **Semantic Versioning**: Follow semver (major.minor.patch)
2. **Changelog**: Keep a CHANGELOG.md for version history
3. **Testing**: Test thoroughly before publishing
4. **Documentation**: Keep README.md up to date
5. **Dependencies**: Keep dependencies minimal and up to date

## Automation

Consider setting up GitHub Actions for automated publishing:

```yaml
# .github/workflows/publish.yml
name: Publish to NPM
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: cd scripts && npm ci
      - run: cd scripts && npm run build
      - run: cd scripts && npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
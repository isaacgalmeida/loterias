# Technology Stack

## Build System

- **Vite** - Modern build tool and dev server
- **Node.js** >= 18.0.0 required

## Core Dependencies

- **chart.js** (^4.5.1) - Data visualization for statistics
- **xlsx** (^0.18.5) - Excel file parsing for historical data
- **file-saver** (^2.0.5) - Export functionality

## Language & Module System

- Vanilla JavaScript (ES Modules)
- `"type": "module"` in package.json
- No framework dependencies (React, Vue, etc.)

## Deployment

- Configured for Vercel deployment
- Output directory: `dist`
- Build command: `npm install && npm run build`

## Common Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install
```

## Browser Support

- Modern browsers with ES Module support
- Uses native JavaScript features (Map, async/await, etc.)

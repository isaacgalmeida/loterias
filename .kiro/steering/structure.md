# Project Structure

## Directory Organization

```
/
├── public/              # Static assets and data files
│   ├── Lotofacil.xlsx  # Historical Lotofácil draw data
│   └── Mega-Sena.xlsx  # Historical Mega-Sena draw data
├── src/
│   ├── components/     # UI component modules
│   │   ├── NumberGenerator.js    # Number generation interface
│   │   ├── ResultsDisplay.js     # Results presentation
│   │   └── StatsDashboard.js     # Statistics visualization
│   ├── services/       # Business logic and algorithms
│   │   ├── predictionEngine.js   # Number generation strategies
│   │   └── statisticsEngine.js   # Statistical analysis
│   ├── utils/          # Helper utilities
│   │   ├── dataModels.js         # Game configurations and constants
│   │   └── excelParser.js        # Excel data parsing
│   ├── styles/
│   │   └── main.css              # Global styles
│   └── main.js         # Application entry point
├── index.html          # Main HTML file
├── package.json        # Dependencies and scripts
└── vercel.json         # Deployment configuration
```

## Architecture Patterns

### Component Structure

- Components are pure functions that render UI and handle events
- Each component manages its own styles via injected `<style>` tags
- Components receive callbacks for user interactions (e.g., `onGenerate`)

### State Management

- Centralized application state in `main.js` (`appState` object)
- State includes current game, draw data, and computed statistics
- UI re-renders when game switches or data updates

### Data Flow

1. Excel files loaded and parsed on initialization
2. Statistics computed from historical draws
3. Components render based on current game state
4. User interactions trigger generation algorithms
5. Results displayed in dedicated section

### Module Organization

- **Components**: UI rendering and user interaction
- **Services**: Core algorithms (statistics, predictions)
- **Utils**: Data models, parsing, and helpers
- **Styles**: CSS with CSS custom properties for theming

## Naming Conventions

- Files: camelCase (e.g., `predictionEngine.js`)
- Functions: camelCase with descriptive names
- Constants: UPPER_SNAKE_CASE (e.g., `GAMES.LOTOFACIL`)
- CSS classes: kebab-case (e.g., `game-selector`)

## Key Files

- **main.js**: Application initialization, state management, and orchestration
- **dataModels.js**: Game configurations (min/max numbers, draw size)
- **predictionEngine.js**: Number generation algorithms (random, weighted, smart-mix, pattern)
- **statisticsEngine.js**: Statistical analysis (frequencies, patterns, hot/cold numbers)
- **excelParser.js**: Parse Excel files into structured draw data

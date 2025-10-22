# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SaaS intelligent price comparison platform frontend application (智能比价分析平台) for the IVD industry, targeting group medical enterprises and large supply chain organizations. The platform integrates product catalog management, price comparison, product selection recommendations, intelligent quotation, and analysis decision-making capabilities.

## Development Commands

### Core Development
- `npm run dev` - Start development server (runs on port 8080)
- `npm run build` - Build for production
- `npm run build:dev` - Build for development environment
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint code quality checks

### Environment
- Node.js 16.x or higher required (see `.nvmrc`)
- Uses Vite as build tool with React 18 + TypeScript

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Ant Design 5 + Tailwind CSS + Lucide React icons
- **State Management**: React Query (@tanstack/react-query) for server state, React Hook Form for forms
- **Data Visualization**: AntV G2 and S2 for charts and pivot tables
- **Routing**: React Router DOM with centralized navigation configuration
- **Styling**: Tailwind CSS + PostCSS + Less support

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (card, etc.)
│   ├── Layout.tsx      # Main application layout with sidebar
│   └── [Feature]Dialog.tsx # Feature-specific modal dialogs
├── pages/              # Page components for each module
│   ├── Dashboard.tsx           # Main dashboard/workbench
│   ├── DataModelManagement.tsx # Data model management
│   ├── ComparisonModelManagement.tsx # Price comparison models
│   ├── PriceSchemeManagement*.tsx    # Price scheme management (v1 & v2)
│   └── [Other modules]
├── lib/                # Utility functions
└── nav-items.tsx       # Centralized navigation configuration
```

### Key Architectural Patterns

**Navigation System**: The app uses a centralized navigation configuration in `nav-items.tsx` that defines routes, components, icons, and titles. This single source of truth is used by both the routing system and the sidebar menu.

**Layout Pattern**: Single layout component (`Layout.tsx`) with collapsible sidebar navigation. All pages are rendered within this layout wrapper.

**Module Organization**: Each business module (data management, price comparison, analysis) has its own page component with supporting dialog components for CRUD operations.

**Data Visualization**: Heavy use of AntV components (G2 for charts, S2 for pivot tables) for business intelligence and analytics features.

### Configuration Notes

**Path Aliases**:
- `@/*` maps to `./src/*`
- `lib` maps to `./lib` (though lib folder appears to be in src/)

**Port Configuration**: Development server runs on port 8080 (configured in vite.config.js)

**TypeScript**: Strict mode enabled with additional linting rules (noUnusedLocals, noUnusedParameters)

**Internationalization**: Configured for Chinese locale (zh_CN) through Ant Design ConfigProvider

## Business Modules

The platform consists of several core business modules accessible through the sidebar navigation:

1. **Data Management**: 数据模型, 数据集管理, 维度管理, 指标管理
2. **Price Comparison Core**: 比价模型, 比对模型, 比价规则, 比价方案 (with v1 and v2 versions)
3. **Analysis & Reporting**: 工作台, 分析主题, 比价分析中心

Each module follows a consistent pattern of list/table views with create/edit/delete operations handled through modal dialogs.

## Additional Development Notes

### Component Patterns
- Dialog components for CRUD operations are co-located with their respective page components
- UI components in `src/components/ui/` provide reusable building blocks
- Heavy use of Ant Design components with consistent styling via Tailwind CSS

### Data Handling
- React Query is used for server state management and caching
- Form handling primarily uses React Hook Form
- Data visualization components from AntV G2 and S2 are integrated throughout

### Development Environment
- Development server is configured to run on port 8080 with HMR enabled
- ESLint is configured with React-specific rules and strict TypeScript settings
- The build process outputs to the `dist/` directory

### Code Organization
- Navigation items are centrally defined in `nav-items.tsx` with title, route, icon, and component mappings
- Each page component follows a consistent pattern with table/list views and modal dialogs for operations
- Shared components and utilities are organized in the `src/components/` directory
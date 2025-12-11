# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SaaS intelligent price comparison platform frontend application (智能比价分析平台) for the IVD (In Vitro Diagnostics) industry, targeting group medical enterprises and large supply chain organizations. The platform integrates product catalog management, price comparison, product selection recommendations, intelligent quotation, and analysis decision-making capabilities.

### Business Scope
- **Data Management**: Data models, datasets, dimensions, and metrics management
- **Price Comparison Core**: Price models, comparison models, comparison rules, and pricing schemes
- **Analysis & Reporting**: Analysis themes, comparison analysis center, and report publishing
- **Permission Management**: Role-based access control and user permissions

## Development Commands

### Core Development
- `npm run dev` - Start development server (runs on port 8080)
- `npm run build` - Build for production
- `npm run build:dev` - Build for development environment
- `npm run build:analyze` - Analyze bundle size
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint code quality checks

### Environment
- Node.js 16.x or higher required (see `.nvmrc`)
- Uses Vite as build tool with React 18 + TypeScript

## Architecture Overview

### Tech Stack
- **Frontend**: React 18.2.0 + TypeScript 5.8.3 + Vite 5.4.11
- **UI Library**: Ant Design 5.27.4 + Tailwind CSS 3.4.4 + Lucide React icons
- **State Management**: React Query (@tanstack/react-query) 5.90.2 for server state
- **Routing**: React Router DOM 6.23.1 with centralized navigation configuration
- **Data Visualization**: AntV G2 5.4.1 and S2 2.4.4 for charts and pivot tables
- **Build Tools**: PostCSS + Autoprefixer + Less support, Terser for optimization

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (card, etc.)
│   ├── Layout.tsx      # Main application layout with sidebar
│   ├── QueryConditionsPanel.tsx    # Query conditions management
│   ├── DynamicConditionRenderer.tsx # Dynamic condition rendering
│   ├── ConditionSelector.tsx       # Condition selection component
│   ├── QueryConditionGroup.tsx     # Query condition grouping
│   ├── EnhancedMetricConfig.tsx   # Enhanced metrics configuration
│   ├── MetricConfigDialog.tsx     # Metrics configuration dialog
│   ├── MetricHoverConfig.tsx      # Metrics hover configuration
│   ├── ModelDialog.tsx            # Model management dialog
│   ├── ModelAssociationDialog.tsx # Model association dialog
│   ├── DatasetDialog.tsx          # Dataset management dialog
│   ├── FieldConfigDialog.tsx      # Field configuration dialog
│   ├── FieldMetadataConfigDialog.tsx # Field metadata configuration
│   ├── DatasetFieldConfig.tsx     # Dataset field configuration
│   ├── SubjectDialog.tsx          # Analysis theme dialog
│   ├── CalculatedIndicatorDialog.tsx # Calculated indicator dialog
│   ├── CustomIndicatorDialog.tsx  # Custom indicator dialog
│   ├── S2ReportConfig.tsx         # S2 report configuration
│   ├── AddPermissionDialog.tsx    # Add permission dialog
│   └── PermissionManagementDialog.tsx # Permission management dialog
├── pages/              # Page components for each module
│   ├── Dashboard.tsx              # Main dashboard/workbench
│   ├── DataModelManagement.tsx    # Data model management
│   ├── DatasetManagement.tsx      # Dataset management
│   ├── DimensionManagement.tsx    # Dimension management
│   ├── MetricManagement.tsx       # Metrics management
│   ├── AnalysisSubject.tsx        # Analysis themes
│   ├── AnalysisSubjectV2.tsx      # Analysis themes V2 (new version)
│   ├── PriceModelManagement.tsx   # Price model management
│   ├── PriceCompareRule.tsx       # Price comparison rules
│   ├── PriceSchemeManagement.tsx  # Price scheme management
│   ├── PriceSchemeManagementV2.tsx # Price scheme management V2
│   ├── ComparisonModelManagement.tsx # Comparison model management
│   ├── ComparisonModelManagementV2.tsx # Comparison model V2 (card layout)
│   ├── ReportCenter.tsx           # Report center
│   ├── ReportPublish.tsx          # Report publishing
│   ├── PriceComparisonReports.tsx # Price comparison reports
│   └── ReportManagement.tsx       # Report management
├── lib/                # Utility functions
│   └── utils.ts        # Common utility functions
├── types/              # TypeScript type definitions
│   └── metric.ts       # Metrics-related type definitions
├── nav-items.tsx       # Centralized navigation configuration
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

### Key Architectural Patterns

**Navigation System**: The app uses a centralized navigation configuration in `nav-items.tsx` that defines routes, components, icons, and titles. This single source of truth is used by both the routing system and the sidebar menu. Navigation is organized into phases (一期/二期) for development tracking.

**Layout Pattern**: Single layout component (`Layout.tsx`) with collapsible sidebar navigation. All pages are rendered within this layout wrapper. The layout supports responsive design and mobile adaptation.

**Module Organization**: Each business module (data management, price comparison, analysis) has its own page component with supporting dialog components for CRUD operations. Both V1 and V2 versions exist for some modules to support legacy and new implementations.

**Data Visualization**: Heavy use of AntV components (G2 for charts, S2 for pivot tables) for business intelligence and analytics features. Custom S2 configuration components enable advanced report layouts.

**Dialog Pattern**: Most CRUD operations are handled through modal dialogs that are co-located with their respective page components. This maintains consistency and reusability.

### Configuration Notes

**Path Aliases**:
- `@/*` maps to `./src/*`
- `lib` maps to `./lib` (though lib folder appears to be in src/)

**Port Configuration**: Development server runs on port 8080 (configured in vite.config.js)

**TypeScript**: Strict mode enabled with additional linting rules (noUnusedLocals, noUnusedParameters)

**Internationalization**: Configured for Chinese locale (zh_CN) through Ant Design ConfigProvider

**Build Optimization**:
- Code splitting for React, UI libraries, and utilities
- Terser compression with removal of console and debugger
- Gzip compression enabled
- Chunk size warnings configured for performance monitoring

## Business Modules

The platform consists of several core business modules accessible through the sidebar navigation:

### Phase 1 Modules (一期)
1. **工作台** (`/`) - Dashboard with system overview and quick operation shortcuts
2. **数据模型** (`/data-model`) - Data model management with database connections and field mappings
3. **数据集管理** (`/dataset-management`) - Dataset configuration and management
4. **维度管理** (`/dimension-management`) - Dimension field definition and hierarchical structure
5. **指标管理** (`/metric-management`) - Business metrics configuration with atomic and calculated indicators
6. **比价模型** (`/price-model`) - Price comparison model configuration
7. **比价规则** (`/price-comparison-rules`) - Price comparison rule settings
8. **比价方案** (`/price-scheme`) - Price comparison scheme management
9. **比对模型(卡片布局)** (`/comparison-model-v2`) - Card layout comparison model
10. **比价分析中心** (`/report-center`) - Core price analysis functionality
11. **报表中心** (`/report-center-v2`) - Report template management and preview

### Phase 2 Modules (二期)
1. **分析主题V2** (`/analysis-subject-v2`) - New version analysis themes
2. **比对模型** (`/comparison-model`) - Legacy comparison model management
3. **比价方案V2** (`/price-scheme-v2`) - New version price scheme management
4. **发布报表** (`/report-publish`) - Report publishing and sharing functionality

### Core Features

**Data Management**:
- Multi-database support (DORIS, MySQL)
- Flexible field mapping between physical and calculated fields
- Hierarchical dimension structures with field role assignment
- Comprehensive metrics system with atomic and calculated indicators
- Formula-based metric calculations with dependency tracking

**Price Comparison Analysis**:
- Multi-dimensional comparison (suppliers, products, time periods)
- Flexible benchmark settings (historical prices, contract prices)
- Complex condition filtering and combination
- Real-time calculation and formula evaluation
- Interactive analysis with drill-down capabilities

**Report Management**:
- Visual drag-and-drop report configuration
- Multiple output formats and export options
- Role-based permission control
- Version management for report templates
- Advanced layout options using AntV S2

**Permission System**:
- Role-based access control (RBAC)
- User and permission management dialogs
- Fine-grained permissions for different features

## Additional Development Notes

### Component Patterns
- **Configuration Components**: Specialized components for complex configuration scenarios (metrics, conditions, datasets)
- **Dynamic Rendering**: Components like `DynamicConditionRenderer` support runtime configuration changes
- **Query Management**: Advanced query condition building and management system
- **Metric System**: Comprehensive metric configuration with hover effects and enhanced features

### Data Handling
- **Server State**: React Query for server state management, caching, and synchronization
- **Form Management**: Ant Design forms with custom validation and dynamic field generation
- **Data Visualization**: Integration of AntV G2 for charts and S2 for pivot tables with custom configurations
- **Real-time Updates**: Support for real-time data updates and interactive features

### Development Environment
- **Hot Module Replacement**: Full HMR support for efficient development
- **Code Quality**: ESLint with React-specific rules and strict TypeScript settings
- **Build Process**: Optimized build with code splitting, compression, and bundle analysis
- **Error Handling**: Comprehensive error boundaries and validation systems

### Performance Considerations
- **Code Splitting**: Automatic code splitting for optimal loading performance
- **Lazy Loading**: Component and route-level lazy loading where appropriate
- **Bundle Analysis**: Built-in bundle size analysis and monitoring
- **Memory Management**: Proper cleanup and optimization for large datasets

### Code Organization
- **Navigation Items**: Centrally defined in `nav-items.tsx` with title, route, icon, and component mappings
- **Type Definitions**: Comprehensive TypeScript definitions in `types/` directory
- **Utility Functions**: Shared utilities in `lib/utils.ts`
- **Dialog Pattern**: Consistent dialog-based CRUD operations across all modules
- **Component Reusability**: High degree of component reusability with proper prop interfaces

This project represents a mature, enterprise-grade SaaS application with sophisticated business logic, modern technical architecture, and comprehensive feature set for the IVD industry's price comparison and analysis needs.
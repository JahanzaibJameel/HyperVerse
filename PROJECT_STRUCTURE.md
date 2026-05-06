# HyperVerse Project Structure

```
HyperVerse/
├── app/                           # Expo Router pages and navigation
│   ├── (tabs)/                    # Bottom tab navigation
│   │   ├── _layout.tsx           # Tab layout configuration
│   │   ├── index.tsx             # Home/Dashboard screen
│   │   ├── tasks.tsx             # Task management screen
│   │   ├── habits.tsx            # Habit tracking screen
│   │   ├── health.tsx            # Health & fitness screen
│   │   ├── finance.tsx           # Finance & budgeting screen
│   │   ├── ai.tsx                # AI assistant screen
│   │   └── settings.tsx          # Settings screen
│   ├── ai/                       # AI-related screens
│   │   ├── chat.tsx              # AI chat interface
│   │   └── models.tsx            # AI model management
│   ├── auth/                     # Authentication screens
│   │   ├── setup.tsx             # Initial setup
│   │   ├── unlock.tsx            # Biometric unlock
│   │   └── profiles.tsx          # Profile management
│   ├── tasks/                    # Task-related screens
│   │   ├── [id].tsx              # Task detail screen
│   │   └── new.tsx               # Create new task
│   ├── habits/                   # Habit-related screens
│   │   ├── [id].tsx              # Habit detail screen
│   │   └── new.tsx               # Create new habit
│   ├── notes/                    # Note-related screens
│   │   ├── [id].tsx              # Note detail screen
│   │   └── new.tsx               # Create new note
│   ├── events/                   # Event-related screens
│   │   ├── [id].tsx              # Event detail screen
│   │   └── new.tsx               # Create new event
│   ├── _layout.tsx               # Root layout with providers
│   └── +not-found.tsx            # 404 screen
├── components/                    # Reusable UI components
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   ├── charts/                   # Chart components
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   └── ProgressRing.tsx
│   ├── forms/                    # Form components
│   │   ├── TaskForm.tsx
│   │   ├── HabitForm.tsx
│   │   ├── NoteForm.tsx
│   │   └── EventForm.tsx
│   └── ai/                       # AI-related components
│       ├── ChatMessage.tsx
│       ├── TypingIndicator.tsx
│       └── ModelSelector.tsx
├── lib/                          # Core business logic
│   ├── database/                 # Database layer
│   │   ├── models/               # WatermelonDB models
│   │   │   ├── User.ts
│   │   │   ├── Task.ts
│   │   │   ├── Habit.ts
│   │   │   ├── Health.ts
│   │   │   ├── Finance.ts
│   │   │   ├── Note.ts
│   │   │   ├── Event.ts
│   │   │   └── index.ts
│   │   ├── migrations/           # Database migrations
│   │   │   ├── 001_initial.ts
│   │   │   ├── 002_add_ai_chat.ts
│   │   │   └── index.ts
│   │   ├── database.ts           # Database configuration
│   │   └── schema.ts             # Database schema
│   ├── repositories/             # Data access layer
│   │   ├── UserRepository.ts
│   │   ├── TaskRepository.ts
│   │   ├── HabitRepository.ts
│   │   ├── HealthRepository.ts
│   │   ├── FinanceRepository.ts
│   │   ├── NoteRepository.ts
│   │   ├── EventRepository.ts
│   │   └── index.ts
│   ├── services/                 # Business logic services
│   │   ├── AuthService.ts
│   │   ├── AIService.ts
│   │   ├── NotificationService.ts
│   │   ├── ExportService.ts
│   │   └── index.ts
│   ├── stores/                   # Zustand stores
│   │   ├── authStore.ts
│   │   ├── themeStore.ts
│   │   ├── settingsStore.ts
│   │   └── index.ts
│   ├── ai/                       # AI integration
│   │   ├── models/               # AI model management
│   │   │   ├── ModelManager.ts
│   │   │   └── ModelRegistry.ts
│   │   ├── rag/                  # RAG pipeline
│   │   │   ├── VectorStore.ts
│   │   │   ├── EmbeddingService.ts
│   │   │   └── RetrievalPipeline.ts
│   │   ├── inference/            # Model inference
│   │   │   ├── LLMInference.ts
│   │   │   └── WorkerManager.ts
│   │   └── prompts/              # AI prompts
│   │       ├── system.ts
│   │       ├── task.ts
│   │       ├── habit.ts
│   │       └── health.ts
│   ├── utils/                    # Utility functions
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   ├── encryption.ts
│   │   ├── storage.ts
│   │   ├── biometrics.ts
│   │   └── index.ts
│   └── constants/                # App constants
│       ├── app.ts
│       ├── database.ts
│       ├── ai.ts
│       └── theme.ts
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useDatabase.ts
│   ├── useAI.ts
│   ├── useBiometrics.ts
│   ├── useTheme.ts
│   ├── useLocalNotifications.ts
│   └── index.ts
├── types/                        # TypeScript type definitions
│   ├── auth.ts
│   ├── database.ts
│   ├── ai.ts
│   ├── navigation.ts
│   ├── api.ts
│   └── index.ts
├── assets/                       # Static assets
│   ├── images/                   # Images and icons
│   │   ├── icons/
│   │   ├── illustrations/
│   │   └── backgrounds/
│   ├── fonts/                    # Custom fonts
│   ├── ai-models/                # AI model files
│   │   ├── gemma-2b-it/
│   │   └── embeddings/
│   └── audio/                    # Sound effects
├── __tests__/                    # Test files
│   ├── __mocks__/                # Test mocks
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # E2E tests
├── .storybook/                   # Storybook configuration
│   ├── main.ts
│   ├── preview.ts
│   └── stories/
├── scripts/                      # Build and utility scripts
│   ├── build.js
│   ├── seed-data.js
│   └── export-data.js
├── .github/                      # GitHub configuration
│   └── workflows/                # CI/CD workflows
│       ├── test.yml
│       ├── build.yml
│       └── deploy.yml
├── docs/                         # Documentation
│   ├── api.md
│   ├── deployment.md
│   └── development.md
├── app.json                      # Expo configuration
├── babel.config.js               # Babel configuration
├── metro.config.js               # Metro bundler configuration
├── tsconfig.json                 # TypeScript configuration
├── jest.config.js                # Jest testing configuration
├── detox.config.js               # Detox E2E testing configuration
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── .gitignore                    # Git ignore rules
└── README.md                     # Project documentation
```

## Key Directories Explained

### `/app` - Expo Router Pages
- File-based routing with typed routes
- Bottom tab navigation in `(tabs)` directory
- Dynamic routes for entity detail pages
- Modal and stack navigation support

### `/lib` - Core Business Logic
- **Database**: WatermelonDB models, migrations, and schema
- **Repositories**: Data access layer with CRUD operations
- **Services**: Business logic and external integrations
- **Stores**: Zustand state management
- **AI**: On-device AI integration with models and RAG

### `/components` - Reusable UI
- **UI**: Base design system components
- **Charts**: Data visualization components
- **Forms**: Form components with validation
- **AI**: AI-specific UI components

### `/hooks` - Custom React Hooks
- Encapsulated business logic
- Database and AI integration hooks
- Theme and authentication hooks

### `/types` - TypeScript Definitions
- Comprehensive type safety
- API contracts and interfaces
- Database model types

### `/__tests__` - Testing Suite
- Unit tests for business logic
- Integration tests for data flow
- E2E tests for user journeys

This structure supports:
- **Scalability**: Clear separation of concerns
- **Maintainability**: Organized codebase with logical grouping
- **Testability**: Comprehensive testing strategy
- **Performance**: Optimized bundle sizes and lazy loading
- **Developer Experience**: Clear conventions and tooling

# Contributing to HyperVerse

Thank you for your interest in contributing to HyperVerse! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ LTS
- pnpm 8+
- Expo CLI 54+
- Git configured with SSH keys

### Development Setup
1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/hyperverse.git
   cd hyperverse
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Create development branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

## 📋 Development Workflow

### 1. Code Style & Standards
- **TypeScript**: Strict mode enabled, all files must be typed
- **ESLint**: Follow configured rules, run `pnpm lint` before committing
- **Prettier**: Auto-format on save, run `pnpm lint:fix` to fix issues
- **Conventional Commits**: Use standardized commit messages

### 2. Commit Message Format
We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no functional changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependency updates

**Examples:**
```
feat(auth): add biometric authentication support

- Implement Face ID and Touch ID integration
- Add fallback to PIN authentication
- Update auth store with biometric state

Closes #123
```

```
fix(ai): resolve model loading timeout issue

Add proper error handling and retry logic for model downloads
```

### 3. Branch Naming
- `feature/feature-name`: New features
- `fix/issue-description`: Bug fixes
- `docs/documentation-updates`: Documentation changes
- `refactor/code-improvement`: Refactoring

### 4. Pull Request Process
1. **Update Documentation**: Update README, ARCHITECTURE.md, or add new docs
2. **Add Tests**: Ensure adequate test coverage for new features
3. **Run Tests**: All tests must pass (`pnpm test`)
4. **Update TypeDoc**: Add TypeScript documentation for new APIs
5. **Create PR**: Use the template below

## 🧪 Testing Requirements

### Test Coverage
- **Unit Tests**: 85%+ coverage required
- **Component Tests**: All UI components must have tests
- **Integration Tests**: Critical user flows must be tested
- **E2E Tests**: Major features must have E2E coverage

### Running Tests
```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Specific test file
pnpm test AuthService.test.ts
```

### Test Structure
```
__tests__/
├── unit/           # Unit tests for services, utilities
├── integration/    # Integration tests for data flow
├── e2e/           # End-to-end tests for user journeys
└── __mocks__/     # Test mocks and fixtures
```

## 🏗️ Code Architecture Guidelines

### 1. File Structure
- Follow the existing directory structure
- Keep components in `components/` directory
- Services go in `lib/services/`
- Database models in `lib/database/models/`
- AI-related code in `lib/ai/`

### 2. Component Guidelines
```typescript
// Component structure example
import React from 'react';
import { View, Text } from 'react-native';
import { useStyles } from '@/hooks/useStyles';

interface ComponentProps {
  title: string;
  onPress?: () => void;
}

export const Component: React.FC<ComponentProps> = ({ title, onPress }) => {
  const styles = useStyles(theme => ({
    container: {
      padding: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};
```

### 3. Service Pattern
```typescript
// Service structure example
export class ExampleService {
  private static instance: ExampleService;
  
  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }
  
  async performAction(params: ActionParams): Promise<Result> {
    // Implementation
  }
}
```

## 🎨 UI/UX Guidelines

### Design System
- Use components from `components/ui/`
- Follow the cyberpunk theme with neon accents
- Maintain consistency across all screens
- Ensure accessibility (WCAG 2.1 AA)

### Component Development
- Use Storybook for component development
- Add stories for all new components
- Test components with different themes
- Ensure responsive design

## 🤖 AI Integration Guidelines

### Model Management
- Use the `ModelManager` for AI model operations
- Handle model download failures gracefully
- Implement proper error boundaries
- Consider device capabilities

### Data Privacy
- Never send user data to external APIs
- Use local vector stores for RAG
- Implement proper data encryption
- Follow privacy-by-design principles

## 📱 Platform Considerations

### iOS/Android
- Test on both platforms
- Handle platform-specific APIs
- Consider performance implications
- Use platform-agnostic components when possible

### Web (PWA)
- Ensure offline functionality
- Test responsive design
- Consider WebAssembly limitations
- Optimize bundle size

## 🔧 Development Tools

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer

### Git Hooks
We use Husky for pre-commit hooks:
- ESLint check
- Prettier formatting
- TypeScript compilation
- Test execution

## 📝 Documentation

### When to Document
- New features: Update README.md
- API changes: Update API documentation
- Architecture changes: Update ARCHITECTURE.md
- New components: Add Storybook stories

### Documentation Standards
- Use clear, concise language
- Include code examples
- Add screenshots/diagrams when helpful
- Keep documentation up-to-date

## 🐛 Bug Reports

### Bug Report Template
```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g. iOS 15.0, Android 11]
- App Version: [e.g. 1.0.0]
- Device: [e.g. iPhone 12, Pixel 5]

## Additional Context
Add any other context about the problem here
```

## ✅ Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Additional Notes
Any additional information about the changes
```

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions

### Getting Help
- Check existing issues and discussions
- Read documentation thoroughly
- Ask questions in discussions
- Join our Discord community

## 🏆 Recognition

### Contributors
All contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor highlights

### Types of Contributions
- Code contributions
- Documentation improvements
- Bug reports and triage
- Community support
- Design and UX improvements

## 📞 Support

### Questions?
- Create a discussion in GitHub
- Join our Discord server
- Check existing documentation

### Issues?
- Search existing issues first
- Use bug report template
- Provide detailed reproduction steps

---

Thank you for contributing to HyperVerse! Your contributions help make this project better for everyone. 🚀

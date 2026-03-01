# React + SyntropyFront Boilerplate

A clean, modern React boilerplate with SyntropyFront integration, following SOLID and Clean Code principles.

## 🚀 Features

- **⚛️ React 18** - With modern hooks
- **🎯 SOLID Principles** - Single Responsibility Principle applied
- **🧹 Clean Code** - Componentization and separation of concerns
- **📊 SyntropyFront** - Simple, automatic integration
- **🎨 Modern CSS** - Beautiful, responsive styling
- **🔧 Full configuration** - ESLint, Prettier, etc.

## 📦 Installation

```bash
# Clone the boilerplate
git clone <repository-url>
cd react-syntropyfront-boilerplate

# Install dependencies
npm install

# Start development
npm start
```

## 🏗️ Architecture

### **Folder structure**
```
src/
├── components/          # React components
│   ├── Header.js       # App header
│   ├── Actions.js      # Action buttons
│   ├── Breadcrumbs.js  # Breadcrumb list
│   ├── Errors.js       # Error list
│   └── index.js        # Exports
├── hooks/              # Custom hooks
│   ├── useAppReady.js  # App ready detection
│   ├── useSyntropyFront.js # Library integration
│   └── index.js        # Exports
├── config/             # Configuration
├── utils/              # Utilities
└── App.js              # Main component
```

### **SOLID principles applied**

#### **Single Responsibility Principle (SRP)**
- Each component has a single responsibility
- Each hook handles a single concern
- Clear separation between UI and logic

#### **Components**
- `Header` - Renders the header only
- `Actions` - Handles buttons only
- `Breadcrumbs` - Renders breadcrumbs only
- `Errors` - Renders errors only

#### **Hooks**
- `useAppReady` - Detects when the app is ready
- `useSyntropyFront` - Integrates with the library

## 🎯 Usage

### **Simple integration**
```javascript
import { useSyntropyFront } from './hooks';

function App() {
  const { isReady, syntropyFront } = useSyntropyFront();
  
  // Use the library
  const handleClick = () => {
    syntropyFront.addBreadcrumb('user', 'Button clicked');
  };
}
```

### **Adding New Components**
```javascript
// 1. Create component with single responsibility
export const NewComponent = ({ data }) => {
  return <div>Component with single responsibility</div>;
};

// 2. Add to index
export { NewComponent } from './NewComponent';

// 3. Use in App.js
import { NewComponent } from './components';
```

## 🔧 Configuration

### **ESLint**
```json
{
  "extends": [
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### **Prettier**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80
}
```

## 📊 SyntropyFront Integration

### **Auto-initialization**
The library initializes automatically when imported:

```javascript
import syntropyFront from './syntropyfront.js';
// Ready! It's already initialized
```

### **Available Methods**
```javascript
// Add breadcrumb
syntropyFront.addBreadcrumb('category', 'message', data);

// Get breadcrumbs
const breadcrumbs = syntropyFront.getBreadcrumbs();

// Clear breadcrumbs
syntropyFront.clearBreadcrumbs();

// Send error
syntropyFront.sendError(error, context);
```

## 🎨 Styling

### **CSS Moderno**
- **Grid Layout** - For complex layouts
- **Flexbox** - For alignment
- **CSS Variables** - For theming
- **Responsive Design** - Mobile-first

### **Main classes**
```css
.App-header          /* Header con gradiente */
.demo-section        /* Secciones con cards */
.action-buttons      /* Botones estilizados */
.breadcrumbs-list    /* Lista de breadcrumbs */
.errors-list         /* Lista de errores */
```

## 🧪 Testing

### **Estructura de Tests**
```
__tests__/
├── components/       # Tests de componentes
├── hooks/           # Tests de hooks
└── utils/           # Tests de utilidades
```

### **Test example**
```javascript
import { render, screen } from '@testing-library/react';
import { Header } from '../components/Header';

test('Header shows the correct title', () => {
  render(<Header isReady={true} />);
  expect(screen.getByText(/React App/)).toBeInTheDocument();
});
```

## 🚀 Available scripts

```bash
npm start          # Development
npm test           # Tests
npm run build      # Production build
npm run eject      # Eject (irreversible)
```

## 📝 Conventions

### **Naming**
- **Components**: PascalCase (`Header.js`)
- **Hooks**: camelCase (`useAppReady.js`)
- **Files**: kebab-case for utilities (`date-utils.js`)

### **Imports**
```javascript
// Components
import { Header, Actions } from './components';

// Hooks
import { useSyntropyFront } from './hooks';

// Utilities
import { formatDate } from './utils/date-utils';
```

### **Comments**
```javascript
/**
 * Component with single responsibility
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
```

## 🤝 Contributing

1. Fork the project
2. Create a branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📄 License

This project is under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have issues or questions:

1. Check the [documentation](docs/)
2. Search [issues](../../issues)
3. Open a new issue with details about the problem

---

**Enjoy the boilerplate! 🎉** 
# React + SyntropyFront Boilerplate

Un boilerplate limpio y moderno para React con integración de SyntropyFront, siguiendo principios SOLID y Clean Code.

## 🚀 Características

- **⚛️ React 18** - Con hooks modernos
- **🎯 SOLID Principles** - Single Responsibility Principle aplicado
- **🧹 Clean Code** - Componentización y separación de responsabilidades
- **📊 SyntropyFront** - Integración simple y automática
- **🎨 CSS Moderno** - Styling hermoso y responsive
- **🔧 Configuración completa** - ESLint, Prettier, etc.

## 📦 Instalación

```bash
# Clonar el boilerplate
git clone <repository-url>
cd react-syntropyfront-boilerplate

# Instalar dependencias
npm install

# Iniciar desarrollo
npm start
```

## 🏗️ Arquitectura

### **Estructura de Carpetas**
```
src/
├── components/          # Componentes React
│   ├── Header.js       # Header de la app
│   ├── Actions.js      # Botones de acción
│   ├── Breadcrumbs.js  # Lista de breadcrumbs
│   ├── Errors.js       # Lista de errores
│   └── index.js        # Exportaciones
├── hooks/              # Custom hooks
│   ├── useAppReady.js  # Detección de app ready
│   ├── useSyntropyFront.js # Integración con librería
│   └── index.js        # Exportaciones
├── config/             # Configuraciones
├── utils/              # Utilidades
└── App.js              # Componente principal
```

### **Principios SOLID Aplicados**

#### **Single Responsibility Principle (SRP)**
- Cada componente tiene una sola responsabilidad
- Cada hook maneja una sola funcionalidad
- Separación clara entre UI y lógica

#### **Componentes**
- `Header` - Solo muestra el header
- `Actions` - Solo maneja botones
- `Breadcrumbs` - Solo muestra breadcrumbs
- `Errors` - Solo muestra errores

#### **Hooks**
- `useAppReady` - Solo detecta cuando la app está lista
- `useSyntropyFront` - Solo integra con la librería

## 🎯 Uso

### **Integración Simple**
```javascript
import { useSyntropyFront } from './hooks';

function App() {
  const { isReady, syntropyFront } = useSyntropyFront();
  
  // Usar la librería
  const handleClick = () => {
    syntropyFront.addBreadcrumb('user', 'Button clicked');
  };
}
```

### **Agregar Nuevos Componentes**
```javascript
// 1. Crear componente con responsabilidad única
export const NewComponent = ({ data }) => {
  return <div>Componente con responsabilidad única</div>;
};

// 2. Agregar al index
export { NewComponent } from './NewComponent';

// 3. Usar en App.js
import { NewComponent } from './components';
```

## 🔧 Configuración

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

### **Auto-inicialización**
La librería se inicializa automáticamente cuando se importa:

```javascript
import syntropyFront from './syntropyfront.js';
// ¡Listo! Ya está inicializada
```

### **Métodos Disponibles**
```javascript
// Agregar breadcrumb
syntropyFront.addBreadcrumb('category', 'message', data);

// Obtener breadcrumbs
const breadcrumbs = syntropyFront.getBreadcrumbs();

// Limpiar breadcrumbs
syntropyFront.clearBreadcrumbs();

// Enviar error
syntropyFront.sendError(error, context);
```

## 🎨 Styling

### **CSS Moderno**
- **Grid Layout** - Para layouts complejos
- **Flexbox** - Para alineaciones
- **CSS Variables** - Para temas
- **Responsive Design** - Mobile-first

### **Clases Principales**
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

### **Ejemplo de Test**
```javascript
import { render, screen } from '@testing-library/react';
import { Header } from '../components/Header';

test('Header muestra el título correcto', () => {
  render(<Header isReady={true} />);
  expect(screen.getByText(/React App/)).toBeInTheDocument();
});
```

## 🚀 Scripts Disponibles

```bash
npm start          # Desarrollo
npm test           # Tests
npm run build      # Build de producción
npm run eject      # Eject (irreversible)
```

## 📝 Convenciones

### **Naming**
- **Componentes**: PascalCase (`Header.js`)
- **Hooks**: camelCase (`useAppReady.js`)
- **Archivos**: kebab-case para utilidades (`date-utils.js`)

### **Imports**
```javascript
// Componentes
import { Header, Actions } from './components';

// Hooks
import { useSyntropyFront } from './hooks';

// Utilidades
import { formatDate } from './utils/date-utils';
```

### **Comentarios**
```javascript
/**
 * Componente con responsabilidad única
 * @param {Object} props - Props del componente
 * @returns {JSX.Element} Componente renderizado
 */
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit los cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia Apache 2.0 - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la [documentación](docs/)
2. Busca en [issues](../../issues)
3. Crea un nuevo issue con detalles del problema

---

**¡Disfruta del boilerplate! 🎉** 
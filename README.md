# Buscador de Precios - Next.js TypeScript

Una aplicación web moderna para comparar precios de productos en tiendas de Costa Rica (Gollo, Monge, MExpress) construida con Next.js 15, TypeScript y Tailwind CSS.

## 🚀 Características

### Búsqueda Individual
- **Búsqueda concurrente**: Busca en todas las tiendas simultáneamente para resultados rápidos
- **Búsqueda secuencial**: Busca tienda por tienda para mayor control
- **Filtrado por tienda**: Selecciona tiendas específicas o busca en todas
- **Resultados en tiempo real**: Muestra productos con precios regulares y promocionales
- **Exportación a Excel**: Descarga los resultados de búsqueda en formato Excel

### Comparación por Lote (BETA)
- **Carga de archivos**: Soporta Excel (.xlsx, .xls) y CSV (.csv, .tsv)
- **Procesamiento asíncrono**: Procesa grandes volúmenes de productos
- **Descarga de resultados**: Genera archivos Excel con comparaciones detalladas

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4
- **Componentes**: shadcn/ui
- **Iconos**: Lucide React
- **Exportación**: XLSX
- **AI**: z-ai-web-dev-sdk para generación de datos de prueba

## 📋 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── search/          # API de búsqueda de productos
│   │   ├── process/         # API de procesamiento por lotes
│   │   └── download/[id]/   # API de descarga de archivos
│   ├── page.tsx             # Página principal
│   ├── layout.tsx           # Layout de la aplicación
│   └── globals.css          # Estilos globales
├── components/
│   └── ui/                  # Componentes shadcn/ui
└── hooks/
    ├── use-toast.ts         # Hook para notificaciones
    └── use-mobile.ts        # Hook para detección móvil
```

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js 18 o superior
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd product-search-app

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Scripts Disponibles
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Construcción para producción
npm run start    # Servidor de producción
npm run lint     # Análisis de código con ESLint
```

## 📡 API Endpoints

### Búsqueda de Productos
```
GET /api/search?q={query}&store={store}
```
- `q`: Término de búsqueda (requerido)
- `store`: Tienda específica o 'all' para todas (opcional, default: 'all')

### Procesamiento por Lotes
```
POST /api/process
Content-Type: multipart/form-data
Body: file (Excel/CSV)
```

### Descarga de Resultados
```
GET /api/download/{processId}
```
Descarga el archivo Excel generado del procesamiento por lotes.

## 🎨 Componentes Principales

### ProductSearchApp
Componente principal que maneja:
- Navegación entre pestañas (búsqueda individual vs por lote)
- Estado de la aplicación
- Interacciones con APIs

### StoreCard
Muestra resultados de búsqueda por tienda:
- Nombre de la tienda
- Estado de la búsqueda
- Lista de productos encontrados

### ProductCard
Muestra información individual de productos:
- Imagen del producto
- Nombre y descripción
- Precio regular y promocional
- Enlace a la tienda

## 🔧 Configuración

### Variables de Entorno
El proyecto utiliza las variables de entorno definidas en `.env` para la configuración del SDK de Z-AI.

### Tailwind CSS
La configuración de Tailwind está en `tailwind.config.ts` con el tema New York de shadcn/ui.

## 📱 Diseño Responsivo

La aplicación está diseñada con un enfoque mobile-first:
- **Móvil**: Layout de una columna con tarjetas apiladas
- **Tablet**: Grid de 2 columnas
- **Desktop**: Grid de 3 columnas para resultados de tienda

## 🎯 Características Técnicas

### TypeScript
- Tipado estricto para mayor seguridad
- Interfaces bien definidas para datos
- Manejo de errores tipado

### Manejo de Estados
- Estado local con React hooks
- Loading states y manejo de errores
- Estados asíncronos para operaciones largas

### Optimización
- Componentes memoizados donde es necesario
- Lazy loading de imágenes
- Optimización de bundle con Next.js

## 🔮 Funcionalidades Futuras

- [ ] Integración con APIs reales de tiendas
- [ ] Sistema de autenticación
- [ ] Historial de búsquedas
- [ ] Alertas de precios
- [ ] Comparación avanzada con gráficos
- [ ] Soporte para más tiendas
- [ ] Aplicación móvil (React Native)

## 📝 Notas

- La versión actual utiliza datos simulados generados por IA para demostración
- La funcionalidad de procesamiento por lotes está marcada como BETA
- Los precios se muestran en colones costarricenses (₡)

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/amazing-feature`)
3. Commit de cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
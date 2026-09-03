# vcar

Proyecto independiente de tarjetas digitales, separado en frontend y backend.

## Estructura

```text
vcar/
├── backend/    Java 21, Spring Boot, PostgreSQL, Flyway y ZXing
└── frontend/   Astro, HTML, CSS y JavaScript
```

## Funcionalidades

- Listado de las siete empresas de Grupo Decor.
- Formulario personalizado por empresa.
- Validación de correo y teléfono duplicados.
- Carga de fotografía de usuario.
- Creación de usuarios en PostgreSQL.
- Generación de QR con el logo de la empresa.
- Perfil digital accesible mediante un token único.
- Descarga del código QR.
- Diseños, logos, iconos y pantallas del proyecto original.

## Requisitos

1. JDK 21.
2. Node.js 20 o superior.
3. PostgreSQL.

No es necesario instalar Maven: el proyecto incluye Maven Wrapper.

## 1. Crear la base de datos

Abre pgAdmin y crea una base de datos llamada:

```text
vcards
```

## 2. Configurar el backend

Desde PowerShell:

```powershell
cd "C:\Proyectos DECOR\Proyectos\vCards\vcar"
Copy-Item backend\application-local.properties.example backend\application-local.properties
notepad backend\application-local.properties
```

Completa el archivo con el usuario y la contraseña de PostgreSQL:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/vcards
spring.datasource.username=postgres
spring.datasource.password=TU_CONTRASENA
app.frontend-url=http://localhost:4321
```

## 3. Ejecutar el backend

```powershell
cd "C:\Proyectos DECOR\Proyectos\vCards\vcar\backend"
.\mvnw.cmd spring-boot:run
```

El backend queda disponible en:

```text
http://127.0.0.1:8000
```

Flyway crea las tablas automáticamente y el backend registra las siete empresas
con sus logos la primera vez que inicia.

## 4. Configurar y ejecutar el frontend

Abre otra PowerShell:

```powershell
cd "C:\Proyectos DECOR\Proyectos\vCards\vcar\frontend"
Copy-Item .env_example .env -Force
npm.cmd install
npm.cmd run dev
```

Abre la aplicación en:

```text
http://localhost:4321
```

## Comandos de verificación

Backend:

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd clean package
```

Frontend:

```powershell
cd frontend
npm.cmd run build
```

## API

| Método | Ruta | Función |
|---|---|---|
| GET | `/empresas` | Lista las empresas |
| GET | `/formulario/{empresaId}` | Obtiene una empresa |
| POST | `/validar_usuario` | Valida duplicados |
| POST | `/usuario` | Crea usuario y QR |
| GET | `/perfil/{token}` | Obtiene el perfil |
| GET | `/obtener_qr/{token}` | Obtiene el QR |

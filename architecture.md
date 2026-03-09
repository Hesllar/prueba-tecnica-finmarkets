# Parte 2 – Análisis y Debugging

## 1. Identifique al menos 5 problemas de arquitectura o diseño.

- Persistencia en memoria: Los datos se almacenan en un array en memoria. Cualquier reinicio del servidor borra toda la información. En producción, esto debería usar una base de datos (PostgreSQL, MongoDB, etc.) a través de un repositorio.

- Ausencia de tipado: Ni el array, ni los parámetros, ni los retornos tienen tipos definidos. Esto elimina las ventajas principales de TypeScript: autocompletado, validación en compilación y documentación implícita.

- Sin manejo de errores: En updateStatus, si el id no existe, order será undefined y la línea order.status = status lanzará un TypeError no controlado. Nunca se valida si el recurso existe antes de operar sobre él.

- Violación del principio de responsabilidad única (SRP): El servicio mezcla lógica de negocio con "persistencia" (el array). Debería delegar el acceso a datos a un repositorio o una entidad ORM separada.

- Sin validación de datos de entrada: El método create acepta cualquier objeto sin validar su estructura. En NestJS lo correcto es usar DTOs con class-validator para garantizar que los datos cumplen el contrato esperado.

## 2. Explique cómo refactorizaría esta implementación en un proyecto real de NestJS.

**Separación de responsabilidades**

Lo primero sería separar claramente las capas de la aplicación. El servicio actual mezcla lógica de negocio con persistencia de datos en el mismo lugar, lo cual viola el principio de responsabilidad única. En un proyecto real crearía una capa de entidades para modelar los datos, DTOs para validar la entrada, y dejaría el servicio únicamente para orquestar la lógica de negocio, delegando el acceso a datos al repositorio de TypeORM | Prisma.

**Base de datos real en lugar de memoria**

Reemplazaría el array private orders = [] por una entidad de TypeORM | Prisma conectada a una base de datos persistente como PostgreSQL. Esto garantiza que los datos sobreviven a reinicios del servidor y permite escalar la aplicación horizontalmente sin perder información.

**Tipado estricto con TypeScript**

Definiría tipos explícitos en cada capa: la entidad Order con sus columnas decoradas, un enum OrderStatus para los estados válidos, y DTOs con tipos definidos para cada operación. Esto elimina los parámetros any implícitos que tiene el código actual y aprovecha realmente las ventajas de TypeScript.

**Validación de datos de entrada con DTOs**

Crearía un CreateOrderDto y un UpdateOrderStatusDto usando decoradores de class-validator como @IsString(), @IsNotEmpty() o @IsEnum(). Combinado con el ValidationPipe global de NestJS, cualquier petición con datos inválidos sería rechazada automáticamente antes de llegar al servicio.

**Manejo de errores explícito**

En el método updateStatus agregaría una verificación de existencia del recurso antes de intentar modificarlo. Si la orden no existe, lanzaría una NotFoundException de NestJS, que automáticamente devuelve un HTTP 404 bien formateado al cliente en lugar de un TypeError silencioso que rompe el servidor.

**Métodos asíncronos**

Convertiría todos los métodos a async/await, ya que cualquier operación real con base de datos es asíncrona. Esto también mejora la legibilidad del código y permite un manejo de errores más predecible con try/catch si fuera necesario.

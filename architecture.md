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

# Parte 4 – Diseño de Arquitectura

- 1. ¿Cómo escalaría esta API para soportar 1000 requests por segundo?

Para escalar esta API a 1000 RPS hay que actuar en varias capas del sistema:

**Escalado horizontal de la aplicación**

La forma más directa es levantar múltiples instancias del servidor NestJS detrás de un load balancer (por ejemplo NGINX o AWS ALB). Como la aplicación es stateless (no guarda sesión en memoria), cualquier instancia puede atender cualquier petición sin problemas. Con Docker y Kubernetes esto se gestiona fácilmente ajustando el número de réplicas según la carga.

**Pool de conexiones a la base de datos**

Prisma, por defecto, abre una conexión por instancia. Con múltiples instancias corriendo en paralelo, el número de conexiones a PostgreSQL puede crecer y convertirse en un cuello de botella. La solución es usar PgBouncer como connection pooler entre las instancias y la base de datos, manteniendo un pool limitado y eficiente de conexiones reales.

**Caché con Redis**

Muchas peticiones de lectura (como `GET /tasks`) devuelven los mismos datos para distintos usuarios. Añadir una capa de caché con Redis permite responder directamente desde memoria sin tocar la base de datos. La clave es definir una estrategia de invalidación adecuada: limpiar la caché cuando se crea, actualiza o elimina una tarea. Esto puede lograrse con el `CacheModule` de NestJS o con `ioredis` directamente.

**Rate limiting**

Con 1000 RPS, un cliente malicioso o un bug en el frontend podría saturar el servidor con solo unas pocas conexiones. Es importante implementar rate limiting a nivel de IP o API key usando `@nestjs/throttler`, limitando la cantidad de peticiones que un mismo cliente puede hacer en un intervalo de tiempo.

**Índices en la base de datos**

Los filtros por `status` y `priority` en `GET /tasks` hacen un `WHERE` sobre esos campos. Sin índices, PostgreSQL realiza un full table scan que se degrada con volumen. Agregar índices a las columnas `status` y `priority` en el schema de Prisma reduce drásticamente el tiempo de consulta bajo carga.

**Paginación obligatoria**

El endpoint `GET /tasks` actualmente retorna todas las tareas sin límite. Con miles de registros, esto genera respuestas muy grandes que consumen memoria y tiempo de serialización. Implementar paginación con `skip`/`take` (cursor o offset) asegura que cada respuesta tenga un tamaño acotado y predecible.

**Cola de mensajes para escrituras costosas**

Si en el futuro hay operaciones de escritura que impliquen lógica pesada (notificaciones, eventos, integraciones externas), lo ideal es moverlas a una cola asíncrona con BullMQ o RabbitMQ. El controlador responde inmediatamente con un `202 Accepted` y el trabajo se procesa en segundo plano, liberando el hilo principal para nuevas peticiones.

**Diagrama resumido**

```
Cliente
   │
   ▼
Load Balancer (NGINX / ALB)
   │
   ├──▶ Instancia NestJS 1
   ├──▶ Instancia NestJS 2   ──▶ Redis (caché)
   └──▶ Instancia NestJS N
              │
              ▼
         PgBouncer
              │
              ▼
         PostgreSQL
```

- 2. ¿Qué cambios haría si el sistema creciera a millones de tareas?

Con millones de registros, los problemas dejan de ser de concurrencia y pasan a ser de volumen. Los cambios se enfocarían en cómo se almacenan, consultan y distribuyen los datos.

**Paginación con cursor en lugar de offset**

La paginación por offset (`SKIP 500000 TAKE 20`) obliga a PostgreSQL a leer y descartar miles de filas antes de devolver el resultado. Con millones de registros esto es muy lento. La solución es paginación por cursor: en lugar de un número de página, el cliente envía el `id` o `createdAt` del último elemento recibido, y la query filtra a partir de ahí con `WHERE createdAt < :cursor`. Esto mantiene el tiempo de respuesta constante sin importar cuántos registros existan.

**Índices compuestos y parciales**

Con el volumen actual, los índices simples sobre `status` y `priority` son suficientes. Con millones de filas, los patrones de consulta más frecuentes (por ejemplo, tareas `pending` de prioridad `high`) se benefician de índices compuestos `(status, priority)` o incluso índices parciales que solo incluyan los valores más consultados. Esto reduce el tamaño del índice y acelera las lecturas.

**Particionamiento de la tabla**

PostgreSQL permite particionar una tabla físicamente según algún criterio. Por ejemplo, particionar `Task` por `createdAt` (range partitioning por mes o año) mantiene cada partición en un tamaño manejable. Las queries que filtran por fecha solo escanean la partición relevante, ignorando el resto de los datos.

**Archivado de datos históricos**

No todas las tareas en estado `done` necesitan estar en la tabla principal. Una estrategia habitual es mover periódicamente las tareas completadas hace más de X meses a una tabla de archivo (`tasks_archive`) o a un almacenamiento de objetos (S3). La tabla activa se mantiene pequeña y rápida, mientras los datos históricos siguen siendo accesibles si se necesitan.

**Búsqueda con un motor dedicado**

Si el sistema necesitara búsqueda por texto sobre `title` o `description` (como un `LIKE '%keyword%'`), PostgreSQL se degrada seriamente con millones de filas. En ese caso, lo correcto es integrar Elasticsearch o PostgreSQL Full-Text Search con índices `tsvector`, que están diseñados específicamente para búsqueda sobre texto.

**Sharding (escenario extremo)**

Si una sola instancia de PostgreSQL ya no puede manejar el volumen (cientos de millones de registros o altísimas tasas de escritura), se puede distribuir los datos en múltiples bases de datos mediante sharding, por ejemplo separando tareas por `tenantId` o por rango de fechas. Es la estrategia más compleja y generalmente se aplica solo cuando las anteriores ya no son suficientes.

- 3. ¿Cómo implementaría autenticación JWT en este sistema?

**Dependencias necesarias**

Se instalan `@nestjs/jwt`, `@nestjs/passport`, `passport` y `passport-jwt`. Opcionalmente `bcrypt` para hashear contraseñas si se maneja registro propio.

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

**Modelo de Usuario en Prisma**

Se agrega un modelo `User` al schema con los campos mínimos necesarios:

```prisma
model User {
  id       String @id @default(uuid())
  email    String @unique
  password String
}
```

**Módulo de autenticación**

Se crea un `AuthModule` con dos endpoints:

- `POST /auth/register` — recibe email y contraseña, hashea la contraseña con `bcrypt` y persiste el usuario.
- `POST /auth/login` — valida las credenciales, y si son correctas genera y devuelve un `access_token` firmado con `JwtService.sign()`.

El payload del token incluye el `sub` (userId) y el `email`, con una expiración definida (por ejemplo `'1h'`). El `JWT_SECRET` se carga desde las variables de entorno, nunca hardcodeado en el código.

**Estrategia JWT con Passport**

Se implementa una `JwtStrategy` que extiende `PassportStrategy(Strategy)`. Esta estrategia extrae el token del header `Authorization: Bearer <token>`, lo valida con el secret y devuelve el payload decodificado como `request.user`.

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

**Guard de autenticación**

Se crea un `JwtAuthGuard` que extiende `AuthGuard('jwt')` de Passport. Este guard se aplica a los endpoints o controladores que requieren autenticación. Para proteger todos los endpoints de tareas bastaría con decorar el controlador:

```typescript
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController { ... }
```

O bien, registrar el guard globalmente y usar un decorador `@Public()` en los endpoints que no requieran token (como `login` y `register`).

**Flujo completo**

```
1. Cliente  →  POST /auth/login  { email, password }
2. Servidor →  valida credenciales, genera JWT
3. Cliente  →  almacena el token (memoria / httpOnly cookie)
4. Cliente  →  GET /tasks  [Authorization: Bearer <token>]
5. JwtAuthGuard  →  valida token con JwtStrategy
6. request.user  →  disponible en el controlador con el payload del token
```

**Consideraciones de seguridad**

- El `JWT_SECRET` debe ser largo, aleatorio y cargado exclusivamente desde variables de entorno.
- La contraseña nunca se almacena en texto plano; siempre se hashea con `bcrypt` (mínimo 10 rondas de salt).
- Para mayor seguridad se puede implementar un `refresh_token` de larga duración almacenado en la base de datos, que permita renovar el `access_token` sin pedir credenciales de nuevo.
- Los tokens no se pueden invalidar por defecto (son stateless). Si se necesita logout o revocación, se mantiene una blacklist en Redis con los JTI (JWT ID) de los tokens revocados hasta su expiración.

- 4. ¿Cómo manejaría procesamiento asincrónico para tareas pesadas?

El principio fundamental es no bloquear el event loop de Node.js con operaciones costosas. La solución estándar es delegar ese trabajo a un sistema de colas.

**Cola de trabajos con BullMQ + Redis**

BullMQ es la librería de colas más usada en el ecosistema NestJS. Usa Redis como broker para persistir los jobs y coordinar entre productores y consumidores. El paquete `@nestjs/bullmq` ofrece integración nativa.

```bash
npm install @nestjs/bullmq bullmq
```

**Flujo productor / consumidor**

El controlador actúa como **productor**: recibe la petición, encola el trabajo y responde inmediatamente con `202 Accepted`. El cliente no espera el resultado del procesamiento.

```typescript
// tasks.controller.ts
@Post(':id/process')
@HttpCode(HttpStatus.ACCEPTED)
async processTask(@Param('id') id: string) {
  await this.tasksQueue.add('process-task', { taskId: id });
  return { message: 'Tarea encolada para procesamiento' };
}
```

Un **Worker** separado consume los jobs de la cola y ejecuta la lógica pesada sin afectar a los endpoints del servidor:

```typescript
// tasks.processor.ts
@Processor('tasks')
export class TasksProcessor {
  @Process('process-task')
  async handleProcessTask(job: Job<{ taskId: string }>) {
    const { taskId } = job.data;
    // lógica costosa: generación de reportes, llamadas externas, etc.
  }
}
```

**Reintentos y manejo de fallos**

BullMQ permite configurar políticas de reintento con backoff exponencial. Si un job falla, se reintenta automáticamente un número de veces antes de marcarse como fallido, lo que evita la pérdida de trabajos por errores transitorios (caída de red, timeout de API externa, etc.).

```typescript
await this.tasksQueue.add(
  'process-task',
  { taskId: id },
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
);
```

**Casos de uso concretos en este sistema**

| Operación                                        | Por qué es candidata a cola                      |
| ------------------------------------------------ | ------------------------------------------------ |
| Envío de notificaciones/emails al cambiar estado | I/O externo lento y no crítico para la respuesta |
| Generación de reportes exportables (PDF/CSV)     | CPU intensivo, puede tardar segundos             |
| Sincronización con sistemas externos             | Llamadas HTTP a terceros con latencia variable   |
| Eliminación masiva de tareas archivadas          | Operación costosa en base de datos               |

**Monitoreo de la cola**

BullMQ incluye `bull-board` como panel de administración para visualizar jobs pendientes, activos, completados y fallidos en tiempo real. Es útil para detectar acumulación de jobs o workers caídos.

**Escalado de workers**

Los workers son procesos independientes del servidor HTTP. Se pueden escalar horizontalmente por separado según la carga de la cola, sin necesidad de añadir más instancias del servidor NestJS. En Kubernetes esto se traduce en dos `Deployment` distintos: uno para la API y otro para los workers.

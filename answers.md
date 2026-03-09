# Parte 1 – Preguntas Teóricas

## 1. Explique la diferencia entre Middleware, Guard, Interceptor y Pipe en NestJS.

- Middleware: Se ejecuta al inicio del ciclo de una petición, incluso antes de que NestJS determine qué controlador la va a manejar. Se utiliza comúnmente para logging, manejo de sesiones y algunas validaciones.
- Guard: Su función principal es manejar la autorización. Este decide si la petición continúa o no; uno de los usos más comunes es validar el token de autenticación.
- Interceptor: Pueden ejecutar lógica antes y después de que el controlador sea ejecutado.
- Pipe: Permite validar o transformar datos que llegan al controlador, mayormente en los parámetros de la ruta, la query o el body de la petición.

## 2. ¿Cómo implementaría autorización basada en roles?

Una forma básica es utilizar decoradores personalizados junto con un Guard. Empezamos creando un decorador que permita indicar los roles permitidos en un controlador o método; este decorador guardará la información en su metadata.

Luego, implementamos un Guard para que se ejecute antes de llegar al controlador. Este se encargará de obtener los roles definidos en el decorador y los comparará con el usuario autenticado (generalmente obtenido desde un JWT o desde el objeto request.user). Finalmente, se valida si el rol del usuario coincide con alguno de los roles permitidos: si todo es correcto, el flujo continúa; de lo contrario, se lanzará un error de autorización.

## 3. ¿Qué problemas aparecen cuando un backend crece mucho y cómo NestJS ayuda a resolverlos?

Uno de los problemas más frecuentes es que la lógica de negocio termina mezclándose con la lógica de infraestructura, lo que genera archivos muy grandes y difíciles de mantener. También suele ocurrir que distintos desarrolladores implementan soluciones de manera diferente, lo que provoca inconsistencias en la arquitectura del proyecto. A medida que el equipo crece, esto puede afectar la velocidad de desarrollo y aumentar la probabilidad de errores.

Otro problema común es la falta de modularidad, donde muchas partes del sistema dependen directamente entre sí. Esto hace que un cambio pequeño pueda impactar en varias áreas del proyecto, dificultando las pruebas y el mantenimiento.

NestJS ayuda a enfrentar estos problemas porque promueve una arquitectura modular desde el inicio. La aplicación se organiza en módulos, controladores y servicios, lo que facilita separar responsabilidades y mantener el código más ordenado. Además, incorpora inyección de dependencias, lo que permite desacoplar componentes y hace que el código sea más fácil de testear y reutilizar.

## 4. ¿Cómo manejaría configuración por ambiente (development, staging, production)?

Normalmente se definen archivos como .env.development, .env.staging y .env.production, donde se guardan valores específicos para cada entorno, como credenciales de base de datos, puertos, claves de API o configuraciones de servicios externos. De esta manera se evita tener información sensible o configuraciones rígidas dentro del código.

En NestJS esto suele manejarse mediante el ConfigModule, que permite cargar las variables de entorno y acceder a ellas desde cualquier parte de la aplicación a través de un servicio de configuración. Así, en lugar de escribir valores directamente en el código, los servicios o módulos consultan el ConfigService para obtener la configuración correspondiente.

Un ejemplo práctico:

cuando la aplicación se inicia, se carga el archivo de configuración correspondiente al entorno definido (por ejemplo mediante la variable NODE_ENV). A partir de ahí, los distintos módulos pueden acceder a esos valores de forma centralizada.

## 5. ¿Cómo evitaría que dos usuarios compren el último producto disponible al mismo tiempo?

Una forma de manejar esto es utilizando transacciones en la base de datos. La idea es que el proceso de verificación de stock y la actualización del inventario se ejecuten dentro de una misma transacción. De esta manera, la base de datos garantiza que la operación se realice de forma consistente y evita que dos procesos modifiquen el mismo registro simultáneamente.

Otra estrategia común es utilizar bloqueos a nivel de fila (row-level locking). Cuando una solicitud intenta comprar el producto, se bloquea temporalmente ese registro mientras se valida el stock y se realiza la actualización. Si otra solicitud intenta acceder al mismo producto durante ese momento, deberá esperar hasta que la primera operación termine.

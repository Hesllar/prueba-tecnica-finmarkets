# Parte 1 – Preguntas Teóricas

## 1. Explique la diferencia entre Middleware, Guard, Interceptor y Pipe en NestJS.

- Middleware: Se ejecuta al inicio del ciclo de una petición, incluso antes de que NestJS determine qué controlador la va a manejar. Se utiliza comúnmente para logging, manejo de sesiones y algunas validaciones.
- Guard: Su función principal es manejar la autorización. Este decide si la petición continúa o no; uno de los usos más comunes es validar el token de autenticación.
- Interceptor: Pueden ejecutar lógica antes y después de que el controlador sea ejecutado.
- Pipe: Permite validar o transformar datos que llegan al controlador, mayormente en los parámetros de la ruta, la query o el body de la petición.

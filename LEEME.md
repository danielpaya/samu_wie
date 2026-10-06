# Lunes de Datos · IEEE WIE

Estudio para crear las historias de Instagram de los lunes (sección de Samuel: datos curiosos y fechas importantes). Escribes el dato o la fecha, ves la historia animada y la descargas como video MP4 (o imagen PNG).

## Cómo abrirlo

- Doble clic en `abrir-estudio.bat` (abre Chrome), o
- doble clic en `index.html` y ábrelo con **Google Chrome** o Edge.

No necesita internet ni instalar nada. Los archivos se guardan en tu carpeta de Descargas.

## Las dos plantillas

- **¿Sabías que…?** Dato curioso con número de dato, categoría, fuente y foto opcional. Animación: engranajes que giran encajados, bombillo que parpadea, sello que gira y puntos en ondas en la foto.
- **Un día como hoy.** Fecha importante con día, mes, año, qué pasó y por qué importa. Animación: calendario que se balancea con la esquina levantándose, engranajes y átomo con electrones en órbita.

En las dos, la tira de papel con el texto crece según lo que escribas, y el recuadro blanco es para el sticker de encuesta o de preguntas de Instagram.

## Qué hay en cada carpeta

| Ruta | Para qué sirve |
|---|---|
| `index.html` | La página del estudio (formulario + vista previa). |
| `css/estudio.css` | Estilos de la página y las fuentes locales. |
| `js/estudio.js` | Todo el dibujo de las historias y la exportación de video. |
| `js/logos.js` | Los logos de WIE incrustados en el código. |
| `vendor/mp4-muxer.js` | Librería que empaqueta los cuadros en un archivo MP4. |
| `fonts/` | Playfair Display, Kalam, Caveat y Montserrat. |
| `img/` | Logos de WIE en PNG. |

## Dónde cambiar cosas en `js/estudio.js`

- **Textos de ejemplo** (el dato de Hedy Lamarr y la fecha de Ada Lovelace): el objeto `state` al inicio.
- **Plantilla ¿Sabías que…?**: función `drawA`.
- **Plantilla Un día como hoy**: funciones `drawB` y `calendar`.
- **Engranajes, bombillo, átomo y sello**: funciones `gear`, `bulb`, `atom` y `stamp`.
- **Frases fijas** como "DATOS QUE INSPIRAN, MENTES QUE TRANSFORMAN" o "¿LO SABÍAS? RESPONDE AQUÍ": búscalas y cámbialas.
- **Categorías del menú**: en `index.html`, las opciones de `f-catA` y `f-catB`.
- **Velocidad de las animaciones**: la constante `LOOP`.

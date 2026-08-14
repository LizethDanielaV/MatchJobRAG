# Perfil de usuario y búsqueda semántica de vacantes

## Qué se implementó

La segunda fase del sistema: recibir los datos del usuario, analizarlos con Gemini para construir un perfil estructurado, convertir ese perfil en un vector de embedding y buscar en Pinecone las vacantes que mejor se ajustan.

Archivos nuevos creados en esta fase:

| Archivo | Responsabilidad |
|---|---|
| `utils/PerfilUtils.js` | Transformaciones puras de datos a texto semántico |
| `utils/GeminiUtils.js` | Método `analizarPerfilLaboral` añadido a la clase existente |
| `controllers/matchController.js` | Orquestación del pipeline completo de búsqueda |
| `routes/matchRoutes.js` | Definición de la ruta HTTP |
| `index.js` | Entrada de la aplicación Express |

---

## Decisiones de arquitectura

### Por qué `PerfilUtils.js` es un archivo separado

Las funciones `construirTextoPerfilUsuario` y `construirTextoBusqueda` son transformaciones puras: reciben datos y devuelven texto, sin llamadas externas ni efectos secundarios. Colocarlas en el controller habría mezclado lógica de presentación con lógica de negocio. Colocarlas en `GeminiUtils` habría acoplado una clase de IA con transformaciones que no dependen de ninguna IA. Un archivo de utilidades propio es la ubicación correcta.

### Por qué `analizarPerfilLaboral` va en `GeminiUtils`

`GeminiUtils` centraliza todas las interacciones con la API de Gemini. Añadir ahí el método mantiene la consistencia: si en el futuro hay que cambiar el modelo, la configuración o la clave de API, hay un único lugar donde hacerlo.

### Por qué el controller orquesta en vez de transformar

`matchController.js` no contiene ninguna lógica de transformación propia. Solo llama funciones en el orden correcto, verifica que cada paso haya producido un resultado válido y responde al cliente. Esto sigue el principio de responsabilidad única: el controller coordina, los utils transforman.

---

## Pipeline completo paso a paso

```
POST /match/buscar
Body: { genero, edad, estudios, orientacion, experiencia, habilidades }
        │
        │  1. PerfilUtils.construirTextoPerfilUsuario()
        ▼
Texto semántico descriptivo del usuario
        │
        │  2. GeminiUtils.analizarPerfilLaboral()
        │     → llama a Gemini con ese texto
        ▼
JSON con perfil estructurado: { area, nivel, habilidades, resumenBusqueda }
        │
        │  3. PerfilUtils.construirTextoBusqueda()
        ▼
Texto semántico optimizado para búsqueda vectorial
        │
        │  4. GeminiUtils.generarEmbeddings()
        │     → modelo: gemini-embedding-001, dimensiones: 1536
        ▼
Vector de 1536 floats
        │
        │  5. PineconeUtils.buscarDatos(embedding, topK=10)
        ▼
Lista de hasta 10 matches con su score de similitud
        │
        │  6. Filtro: score >= 0.6
        ▼
res.json({ perfil, vacantes })
```

---

## Decisiones técnicas relevantes

### Doble transformación a texto (pasos 1 y 3)

El pipeline usa texto semántico en dos momentos distintos y con propósitos distintos:

**Paso 1 — texto para Gemini:**
Construido por `construirTextoPerfilUsuario`. Está redactado como una instrucción de análisis, pensada para que Gemini entienda el contexto humano de la persona:

```
Analiza qué tipo de vacantes se ajustan a una persona de 21 años, mujer,
con estudios en Ingeniería de Sistemas en curso (6° semestre).
Su orientación dentro de Ingeniería de Sistemas es hacia backend.
Experiencia previa: proyectos académicos con Node.js y bases de datos.
Tecnologías y habilidades que maneja: JavaScript, Node.js, SQL, Git.
```

**Paso 3 — texto para el embedding de búsqueda:**
Construido por `construirTextoBusqueda`. Está redactado intencionalmente como si fuera una descripción de vacante, para que el vector resultante sea comparable con los vectores almacenados en Pinecone (que también describen vacantes):

```
Vacante orientada a perfil practicante en el área de backend.
Requiere conocimientos en: JavaScript, Node.js, SQL, Git.
Desarrollador backend junior con experiencia en APIs REST y bases de datos relacionales.
```

Este alineamiento semántico entre el texto de búsqueda y los textos almacenados es lo que hace que la similitud coseno sea significativa.

### Por qué el umbral de coincidencia es 0.6

El umbral `UMBRAL_SIMILITUD = 0.6` fue calibrado considerando dos factores específicos de este proyecto:

**1. Tamaño reducido del dataset por limitación del plan gratuito de Pinecone.**
El índice almacena solo 35 vacantes (ver `docs/01-obtencion-y-almacenamiento-datos.md`). Con un corpus tan pequeño, las vacantes más afines al perfil del usuario raramente superarán scores de similitud altos (0.80+), porque el modelo de embeddings calibra la distancia coseno en relación a todo el espacio vectorial, no solo a los 35 registros existentes. Un umbral de 0.75 (el valor inicial) descartaba todos los resultados. Un umbral de 0.6 permite recuperar coincidencias reales sin bajar tanto como para incluir resultados irrelevantes.

**2. Heterogeneidad del contenido almacenado.**
Las descripciones de vacantes provienen de la API de Arbeitnow y algunas están en alemán o inglés, mientras que los textos de búsqueda se generan en español. Esa diferencia de idioma reduce artificialmente los scores de similitud incluso cuando la vacante es temáticamente relevante. El umbral de 0.6 absorbe esa penalización sin eliminar resultados válidos.

Si en el futuro el índice crece a miles de vacantes o se homogeniza el idioma, el umbral puede subirse a 0.70–0.75.

### Configuración de `analizarPerfilLaboral` en Gemini

```js
model: "gemini-3.5-flash-lite"
responseMimeType: "application/json"   // fuerza respuesta parseable
maxOutputTokens: 200                   // el JSON esperado es pequeño; límite evita gasto innecesario
temperature: 0.6                       // balance entre determinismo y variedad en la clasificación
```

La instrucción del sistema le da a Gemini opciones acotadas para `area` ("backend", "frontend", "fullstack", "datos", "QA", "cloud", "seguridad", "mobile") para evitar que invente categorías que no existan en el dataset de vacantes.

### Fallo aislado por etapa

Si `analizarPerfilLaboral` o `generarEmbeddings` devuelven `undefined` (error en la API de Gemini), el controller responde con `500` inmediatamente sin continuar el pipeline. Esto evita que un error silencioso en un paso intermedio propague datos inválidos a Pinecone o produzca una búsqueda vacía sin explicación.

---

## Ejemplo completo de entrada y salida

### Request

```http
POST /match/buscar
Content-Type: application/json

{
  "genero": "femenino",
  "edad": 21,
  "estudios": "Ingeniería de Sistemas en curso (6° semestre)",
  "orientacion": "backend",
  "experiencia": "proyectos académicos con Node.js y bases de datos",
  "habilidades": ["JavaScript", "Node.js", "SQL", "Git"]
}
```

### Response

```json
{
  "perfil": {
    "area": "backend",
    "nivel": "practicante",
    "habilidades": ["JavaScript", "Node.js", "SQL", "REST APIs", "Git"],
    "resumenBusqueda": "Desarrolladora backend practicante con Node.js, SQL y APIs REST"
  },
  "vacantes": [
    {
      "score": 0.6812,
      "titulo": "Junior Backend Developer",
      "empresa": "TechCorp GmbH",
      "ubicacion": "Remote",
      "remoto": true,
      "tags": "Remote, Software Development, Node.js",
      "url": "https://www.arbeitnow.com/...",
      "texto": "Vacante como Junior Backend Developer en la empresa TechCorp GmbH..."
    }
  ]
}
```

El campo `score` indica qué tan similar es el perfil del usuario a esa vacante según el modelo de embeddings. Solo se incluyen vacantes con `score >= 0.6`.

---

## Estructura de la API

```
index.js
└── app.use("/match", matchRoutes)
        └── POST /buscar → matchController.buscarVacantes()
```

El servidor arranca con `node index.js` y queda disponible en `http://localhost:3000` (o el puerto definido en `PORT` del `.env`).

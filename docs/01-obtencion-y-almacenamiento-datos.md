# Obtención y almacenamiento de vacantes

## Qué se implementó

Se construyeron dos scripts que cubren la primera fase del pipeline RAG: obtener vacantes de tecnología desde una API pública, convertirlas a texto con significado semántico y almacenar sus embeddings en Pinecone para búsqueda vectorial posterior.

- `scripts/01-obtener_vacantes.js` — consulta la API, filtra y guarda 35 vacantes en `data/vacantes.json`.
- `scripts/02-almacenar_vacantes.js` — lee ese JSON, construye un texto por vacante, genera su embedding con Gemini y lo sube a Pinecone.

---

## Por qué 35 vacantes y no el dataset completo

El plan gratuito de Pinecone tiene un límite de almacenamiento de vectores. Subir todas las vacantes que devuelve la API sin filtrar superaría esa cuota. Por eso el script 01 aplica dos filtros antes de guardar:

1. **Afinidad temática** — se conservan solo las vacantes cuyo título o tags contienen al menos una de las palabras clave definidas en `KEYWORDS` (software, developer, web, backend, frontend, fullstack, data, cloud, devops, python, java, etc.).
2. **Ubicación válida** — se conservan solo las vacantes remotas o con ubicación en Colombia.

Después de aplicar los filtros se toman los primeros 35 resultados acumulados (`.slice(0, 35)`) y se escriben en `data/vacantes.json`. El número 35 es el tope elegido para mantenerse dentro de la cuota gratuita, no una limitación de la API.

---

## Flujo paso a paso

```
API Arbeitnow
     │
     │  GET /api/job-board-api?page=N  (paginado hasta acumular 35)
     ▼
Filtrado (afinidad + ubicación)
     │
     ▼
data/vacantes.json          ← 35 objetos con campos normalizados
     │
     │  construirTextoVacante()
     ▼
Texto en lenguaje natural   ← cadena semánticamente rica por vacante
     │
     │  GeminiUtils.generarEmbeddings()
     │  modelo: gemini-embedding-001 / outputDimensionality: 1536
     ▼
Vector de 1536 floats
     │
     │  PineconeUtils.almacenarDatos()  → index.upsert()
     ▼
Pinecone (index: mi-app-rag)
```

---

## Decisiones técnicas relevantes

### Formato del texto natural (`construirTextoVacante`)

En lugar de pasar el JSON crudo al modelo de embeddings, cada vacante se convierte a una oración coherente. Esto es intencional: los modelos de embeddings capturan mejor el significado semántico a partir de texto fluido que a partir de pares clave-valor.

La función construye la cadena así:

```
Vacante como {titulo} en la empresa {empresa}, en modalidad {remota | presencial en {ubicacion}}.
Tecnologías y áreas: {tags}.
Descripción: {descripcion}
```

- Si `remoto` es `true`, la modalidad se escribe como `"remota"`.
- Si hay tags, se añaden precedidos de `"Tecnologías y áreas:"`.
- Si hay descripción, se añade al final. El script 01 ya la limpia de HTML y la recorta a 500 caracteres.

### Estructura del objeto almacenado en Pinecone

Pinecone requiere que cada vector tenga un `id` único, un array `values` y opcionalmente `metadata`. El script 02 construye:

```js
{
  id: vacante.id,           // ej. "vacante-0"
  values: embedding,        // array de 1536 floats generado por Gemini
  metadata: {
    titulo, empresa, ubicacion, remoto, tags, url,
    texto                   // el mismo texto que se usó para generar el embedding
  }
}
```

El campo `texto` se incluye en metadata para que, cuando una búsqueda vectorial devuelva un match, la aplicación pueda mostrar el texto original sin necesidad de reconstruirlo.

### Manejo de fallos por vacante

Si `generarEmbeddings` devuelve `undefined` (error en la API de Gemini), el script registra una advertencia y omite esa vacante en lugar de abortar todo el proceso. Esto evita perder un lote completo por un fallo puntual.

---

## Ejemplo real: antes y después de la transformación

### Antes — objeto en `data/vacantes.json`

```json
{
  "id": "vacante-0",
  "titulo": "Solution Architect - AWS Plattform & Cloud Security (m/w/d)",
  "empresa": "Rockstardevelopers GmbH",
  "ubicacion": "Stuttgart",
  "remoto": true,
  "tags": "Remote, Software Development",
  "descripcion": "Wer wir sind\nRockstardevelopers, gegründet 2015 in Mannheim...\nDeine Aufgaben\n\nPlattformarchitektur auf AWS entwerfen und weiterentwickeln: EKS, ECR, Fargate, Cluster-Design, Namespace-Strat",
  "url": "https://www.arbeitnow.com/jobs/companies/rockstardevelopers-gmbh/solution-architect-aws-plattform-cloud-security-stuttgart-12120"
}
```

### Después — texto que recibe el modelo de embeddings

```
Vacante como Solution Architect - AWS Plattform & Cloud Security (m/w/d) en la empresa Rockstardevelopers GmbH, en modalidad remota. Tecnologías y áreas: Remote, Software Development. Descripción: Wer wir sind\nRockstardevelopers, gegründet 2015 in Mannheim...
```

### Objeto final almacenado en Pinecone

```json
{
  "id": "vacante-0",
  "values": [0.0412, -0.0187, 0.0934, "...1536 valores en total..."],
  "metadata": {
    "titulo": "Solution Architect - AWS Plattform & Cloud Security (m/w/d)",
    "empresa": "Rockstardevelopers GmbH",
    "ubicacion": "Stuttgart",
    "remoto": true,
    "tags": "Remote, Software Development",
    "url": "https://www.arbeitnow.com/jobs/companies/rockstardevelopers-gmbh/...",
    "texto": "Vacante como Solution Architect... en modalidad remota. Tecnologías y áreas: Remote, Software Development. Descripción: ..."
  }
}
```

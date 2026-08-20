# Flujo actual del sitio — #GatoEncerrado

> Versión 6 · 19 de agosto de 2026  
> El recorrido editorial es la columna vertebral. Identidad, memoria, GAT, analítica y pagos son capas transversales; no etapas obligatorias del relato.

```mermaid
flowchart TB
  classDef acto fill:#17111d,stroke:#ae8ac5,color:#f4edf8,stroke-width:1.5px;
  classDef escena fill:#0d1421,stroke:#7487aa,color:#f1f5fb,stroke-width:1.25px;
  classDef respuesta fill:#071b1a,stroke:#58bca7,color:#eafff9,stroke-width:1.25px;
  classDef cierre fill:#21120f,stroke:#ef8a5c,color:#fff4ee,stroke-width:1.25px;
  classDef capa fill:#111318,stroke:#626a78,color:#d8dee9,stroke-dasharray:4 3;
  classDef pendiente fill:#191919,stroke:#777,color:#bbb,stroke-dasharray:3 3;

  subgraph RECORRIDO[RECORRIDO EDITORIAL]
    direction TB

    HERO[PRIMERA FILA<br/><small>Hero · activar la escena</small>]:::acto
    ULTIMA[ÚLTIMA LLAMADA<br/><small>Entrada narrativa al universo</small>]:::acto
    MINI[LA OBRA TOMA FORMA<br/><small>Miniversos · nueve formas creativas</small>]:::escena
    INTER[INTERMEDIO<br/><small>¿Qué obra ocurre en ti?</small>]:::acto
    CURA[CURADURÍA<br/><small>Buscador Backstage + contenidos editoriales</small>]:::escena
    REPLICA[LA RÉPLICA<br/><small>Voces del público + reacción sonora de la obra</small>]:::respuesta
    TELON[CAÍDA DEL TELÓN<br/><small>Dos maneras de continuar</small>]:::cierre

    HERO -->|Activa el recorrido| ULTIMA
    ULTIMA -.->|Al completar la entrada o tener sesión| MINI
    ULTIMA --> INTER
    MINI --> INTER
    INTER -.->|Reflexiona aquí| CURA
    CURA --> REPLICA
    INTER --> TELON
    REPLICA --> TELON

    subgraph MEMORIA_ESCENICA[ENTRA A VER]
      direction TB
      OBRA[OBRA FUNDACIONAL]:::escena
      CREDITOS[CRÉDITOS]:::escena
      GALERIA[GALERÍA FRACTAL<br/><small>Revelado propio</small>]:::escena
      OBRA --> CREDITOS
      CREDITOS -.-> GALERIA
    end

    subgraph CONTINUIDAD[ANTES DE IRTE]
      direction TB
      MODELO[MODELO DE NEGOCIO<br/><small>Expande · Habita · Impulsa</small>]:::respuesta
      ALIANZA[ALIANZA SOCIAL<br/><small>Impacto en cadena</small>]:::respuesta
      HUELLA[ACTIVAR HUELLA<br/><small>Identidad progresiva + suscripción</small>]:::respuesta
      OTRAS[OTRAS HUELLAS<br/><small>Compras y otras aportaciones · en definición</small>]:::pendiente
      MODELO --> ALIANZA
      ALIANZA --> HUELLA
      OTRAS -.-> HUELLA
    end

    TELON -->|Entra a ver| OBRA
    TELON -->|Antes de irte| MODELO
    CREDITOS --> CONTACTO[CONTACTO]:::cierre
    GALERIA --> CONTACTO
    HUELLA --> CONTACTO
  end

  subgraph CAPAS[CAPAS TRANSVERSALES — NO SON EL RECORRIDO]
    direction LR
    IDENTIDAD[IDENTIDAD<br/><small>Cuenta y atribución</small>]:::capa
    MEMORIA[MEMORIA<br/><small>Sesión, historial y revelados</small>]:::capa
    GAT[GAT<br/><small>Capa simbólica y registro de participación</small>]:::capa
    DATOS[ANALÍTICA<br/><small>Interacciones e investigación</small>]:::capa
    PAGOS[PAGOS<br/><small>Huella y Stripe</small>]:::capa
  end

  IDENTIDAD -.-> MINI
  IDENTIDAD -.-> REPLICA
  IDENTIDAD -.-> HUELLA
  MEMORIA -.-> ULTIMA
  MEMORIA -.-> CURA
  MEMORIA -.-> TELON
  GAT -.-> MINI
  DATOS -.-> REPLICA
  DATOS -.-> HUELLA
  PAGOS -.-> HUELLA
```

## Lectura del diagrama

- Las flechas continuas representan el recorrido editorial o el orden natural de lectura.
- Las flechas discontinuas representan revelados, condiciones o capas que intervienen sin convertirse en una etapa narrativa.
- La autenticación permite persistencia y ciertas interacciones, pero no divide el sitio entre una experiencia incompleta y otra completa.
- GAT dejó de ser una mecánica de engagement y se documenta como capa simbólica del sistema.
- “Otras huellas” permanece marcado como evolución pendiente para no presentar como terminado el futuro registro de compras u otras aportaciones.

## Subflujo técnico de La Réplica

```mermaid
flowchart LR
  VOZ[Voz elegida del público] --> MODO[Modo<br/>confusion-lucida]
  MODO --> API[POST<br/>/api/obra-conciencia]
  API --> RAG[RAG interno<br/>escenas · símbolos · emociones]
  RAG --> PROMPT[Conciencia de la obra<br/>reacciona, no resuelve]
  PROMPT --> TEXTO[Reacción textual]
  TEXTO --> TTS[Síntesis de voz]
  TTS --> AUDIO[Reacción sonora irrepetible]

  classDef entrada fill:#17111d,stroke:#ae8ac5,color:#f4edf8;
  classDef proceso fill:#0d1421,stroke:#7487aa,color:#f1f5fb;
  classDef salida fill:#071b1a,stroke:#58bca7,color:#eafff9;
  class VOZ,MODO entrada;
  class API,RAG,PROMPT,TEXTO proceso;
  class TTS,AUDIO salida;
```

## Fuente de verdad

- Orden de montaje y estados de revelado: `src/App.jsx`.
- Navegación editorial: `src/components/Header.jsx`.
- Miniversos y Alianza: `src/components/MiniverseInlineSection.jsx` y `src/components/MiniverseModal.jsx`.
- La Réplica: `src/components/About.jsx` y `src/hooks/useSilvestreVoice.js`.
- Reacción de la obra: `backend/gato-enigmatico-api/routes/obraConciencia.js`.

# Assistant IA pour le support client
**Présentation d'un prototype fonctionnel : système IA de traitement automatique des tickets client.**

![Python](https://img.shields.io/badge/Python-3.13%2B-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.123-009688?logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1-412991?logo=openai&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-Redis-37814A?logo=celery&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase&logoColor=white)
![pydantic-ai](https://img.shields.io/badge/pydantic--ai-agent%20framework-E92063?logo=pydantic&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)

---

## Contexte

Ce projet est un **P.O.C.** qui illustre le fonctionnement réel de la conception d'un workflow complet autour de la gestion automatisée des tickets clients, capable d'orchestrer intelligemment toute requête utilisateur issue de situations concrètes et réelles. Pour simuler des cas réels, le projet prend l'exemple de la SNCF, qui gère quotidiennement des demandes clients exhaustives, répétitives et complexes. Notre cas d'usage est donc particulièrement pertinent.

## Architecture

```mermaid
flowchart LR
    user[Utilisateur] --> browser[Browser\nReact chat app]

    subgraph docker[Docker]
        frontend[Frontend\nVite + React]
        backend[Backend\nFastAPI + PydanticAI]
        worker[Celery]
        redis[(Redis)]
        pgvector[(pgvector)]
    end

    subgraph supabase[Supabase]
        db[(Postgres\névénements + tickets)]
    end

    openai[OpenAI\nGPT-4.1 + embeddings]
    sources[Knowledge Base\nPDFs + pages Web]
    ingestion[Ingestion pipeline\nDocling, chunking, embeddings]

    frontend -->|sert l'app| browser
    browser -->|envoie un message| backend
    backend -->|stocke le ticket| db
    backend -->|met en file| redis
    redis -->|déclenche| worker
    worker -->|récupère passages pertinents| pgvector
    worker -->|génère réponse en français| openai
    worker -->|écrit le résultat| db
    backend -->|poll résultat| db
    backend -->|retourne réponse + trace workflow| browser
    sources --> ingestion
    ingestion -->|crée les embeddings| openai
    ingestion -->|stocke les chunks| pgvector
```

L'architecture de l'application repose sur un stack *full-stack* (**backend** + **frontend**) dans lequel un workflow de nœuds agentiques de **PydanticAI** est orchestré côté backend, tandis que le frontend a pour objectif d'illustrer simplement ce workflow en action à travers un chat UI. Concrètement, des tickets sont envoyés à une API **FastAPI**, stockés dans **Supabase** (**PostgreSQL**), mis en file d'attente via **Redis**, puis traités de manière asynchrone par un worker **Celery**.

## Workflow

Les demandes utilisateurs soumises via le chat UI, sont envoyes a une API, qui cause le declenchement de ce workflow, quipermettra l'automatisation du traitement, et est designe de la maniere suivante:
Chaque ticket traverse un workflow multi-nœuds comme illustre ci-dessous

```mermaid
flowchart LR
    Ticket([Ticket]) --> ClassificationIntention[Classification d'intention]
    ClassificationIntention --> Filtrage[Filtrage]
    Filtrage --> Routage{Routage}
    Routage -->|Fermer| FermeTicket[Fermeture]
    Routage -->|Escalader| EscaladeHumain[Escalade à un humain]
    Routage -->|Traiter| GenerationReponse[Génération de réponse]
    GenerationReponse --> EnvoiReponse[Envoi de réponse]
```

### Étapes

**Réception**<br>
Le ticket arrive via **FastAPI** et est stocké en base (**Supabase**).

**Traitement async**<br>
Le ticket est mis en file d'attente (**Redis**), un **worker Celery** le récupère et lance le workflow.

**Analyse** *(3 sous-agents en parallèle)*
- **Classification d'intention** : L’IA (**PydanticAI** + **OpenAI**) détermine l’intention (ex: "conditions", "délais", "retard de train", "remboursement")
- **Filtrage** : Détection de spam""
- **Routage** : Selon l’analyse, le ticket est fermé, escaladé à un humain, ou traité automatiquement.
- **Génération de réponse** : Si traitement automatique, l’IA génère une réponse pertinente via **RAG**, en se basant sur la base de vecteurs **pgvector**.
- **Envoi de réponse** : La réponse est envoyée au client ou le ticket est escaladé.


### Gains opérationnels

---

## Démonstration

![Démonstration du workflow](assets/demo.gif)

---

## Pourquoi c'est utile ?

Les équipes de support client traitent chaque jour des tickets répétitifs : suivi de commande, demande de remboursement, problème de compte. Ce système IA automatise ce premier niveau de traitement :

- Les questions courantes reçoivent une réponse immédiate, rédigée à partir de la base de connaissances interne de l'entreprise.
- Les cas sensibles (remboursement, plainte) sont détectés automatiquement et transmis à un agent humain avec le contexte déjà préparé.
- Les messages parasites (spam, bots) sont filtrés et fermés systématiquement.

**Ce projet montre la capacité à concevoir, assembler et faire fonctionner un système IA complet.**

---

## Ce que j'ai construit

```
Email client
    │
    ▼
[FastAPI] ──────────────────────────────────► [Base de données Supabase]
    │                                              (tickets + résultats)
    ▼
[Redis] (file d'attente)
    │
    ▼
[Celery Worker]
    │
    ▼
[Workflow Engine]
    │
    ├──► Classification de l'intention ──┐
    ├──► Détection de spam              ├──► [Routeur]
    └──► Validation du ticket ──────────┘        │
                                                  ├── Question générale → [Génère réponse] ◄──► [Base vectorielle]
                                                  ├── Remboursement     → Escalade humaine
                                                  ├── Facturation       → Service facturation
                                                  └── Spam              → Fermeture automatique
```
                                                  
![Architecture du workflow](assets/workflow.png)

### Processus détaillé

1. Un ticket client est envoyé sur l'endpoint de l'API (pouvant être automatiquement transmis à l'aide d'un webhook)
2. Le ticket est enregistré daans la base de données et publié dans la file d'attente Redis.
3. Le worker Celery consomme la tâche et lance le moteur de workflow.
4. Trois agents IA s'exécutent **en parallèle** : classification de l'intention, détection de spam, validation.
5. Le routeur lit les résultats et choisit le traitement adapté.
6. Pour les demandes plus spécifiques liées à l'entreprise, le système recherche dans la base de connaissances les 5 passages les plus proches sémantiquement, puis génère une réponse. *(principe du RAG — Retrieval-Augmented Generation)*
7. La réponse et toutes les métadonnées sont sauvegardées et consultables via l'endpoint de l'API.

---

## Stack technique

### Backend

| Outil | Rôle |
|-------|------|
| **FastAPI** | Reçoit les tickets via HTTP et expose les résultats |
| **Celery** | Exécute les workflows en arrière-plan, hors du cycle de requête |
| **Redis** | File d'attente entre l'API et le worker |
| **SQLAlchemy** | Accès structuré à la base de données PostgreSQL |

### IA

| Outil | Rôle |
|-------|------|
| **pydantic-ai** | Orchestre les agents IA avec des sorties structurées et typées |
| **OpenAI GPT-4.1** | Modèle de langage utilisé pour l'analyse et la génération de réponses |
| **OpenAI text-embedding-3-small** | Transforme le texte en vecteurs numériques pour la recherche sémantique |
| **pgvector** | Extension PostgreSQL pour retrouver rapidement les documents les plus similaires |
| **Supabase (PostgreSQL)** | Stockage des tickets, résultats et base de connaissances |

### Infrastructure

| Outil | Rôle |
|-------|------|
| **Docker Compose** | Orchestre les 3 conteneurs (API, worker, Redis) en une seule commande |
| **uv** | Gestionnaire de dépendances Python rapide et reproductible |

---

## Fonctionnalités clés

- **Analyse en parallèle** — 3 agents IA s'exécutent simultanément sur chaque ticket, au lieu de tourner l'un après l'autre.
- **Routage conditionnel** — le système choisit automatiquement le traitement adapté selon l'intention détectée : réponse générée, escalade humaine, transfert facturation, ou fermeture.
- **RAG - Réponses ancrées dans des documents internes** — le système consulte la base de connaissances avant de rédiger, pour ne jamais inventer d'information.
- **Architecture extensible en nœuds** — ajouter un nouveau type d'analyse se fait sans modifier le moteur existant.
- **Compatible multi-fournisseurs IA** — OpenAI, Anthropic, Gemini, Azure, Bedrock et Ollama sont interchangeables sans changer la logique métier.
- **Traçabilité complète** — intention, score de confiance, documents récupérés et réponse générée sont persistés en base et consultables via l'API.

---

## Résultats & métriques

| Indicateur | Valeur |
|------------|--------|
| Analyses IA par ticket | 3, exécutées en parallèle |
| Documents récupérés par requête | 5, sélectionnés par similarité sémantique |
| Dimensions des vecteurs d'embedding | 1 536 (text-embedding-3-small) |
| Catégories d'intention reconnues | 4 (question générale, produit, facturation, remboursement) |
| Fournisseurs IA interchangeables | 6 (OpenAI, Anthropic, Gemini, Azure, Bedrock, Ollama) |
| Services Docker | 3 conteneurs indépendants avec healthcheck |

---

*Workflow inspiré du cours [Datalumina GenAI Launchpad](https://datalumina.com). Tout le code de ce dépôt a été écrit indépendamment.*

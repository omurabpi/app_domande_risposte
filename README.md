# App Domande Ometec

App per raccogliere domande anonime durante le lezioni, con pannello admin per gestirle.

---

## Struttura

```
App_Domande_Ometec/
├── backend/          Node.js + Express + SQL Server
├── frontend/         React + Vite + Tailwind CSS
└── schema.sql        Schema del database
```

---

## Setup iniziale

### 1. Database SQL Server

Esegui `schema.sql` sul tuo database SQL Server.  
Poi crea l'hash della password admin (una tantum):

```bash
cd backend
npm install
node -e "const b=require('bcryptjs'); b.hash('LA_TUA_PASSWORD',12).then(h=>console.log(h))"
```

Incolla l'hash nell'`INSERT` di `schema.sql` e rieseguilo.

---

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Compila .env con le credenziali del DB e un JWT_SECRET sicuro
npm run dev
```

Il server parte su **http://localhost:3001** (configurabile via `PORT` in `.env`).

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Il frontend parte su **http://localhost:5173**.

---

## Route dell'app

| URL | Descrizione |
|-----|-------------|
| `/` | Pagina studenti — invio domande anonime |
| `/bacheca` | Bacheca pubblica — domande pubblicate dal docente |
| `/admin/login` | Login admin |
| `/admin` | Dashboard admin (protetta) |

---

## Funzionalità admin

Dalla dashboard il docente può per ogni domanda:
- **Segna letta** — nasconde visivamente la domanda già gestita
- **Metti in evidenza** — evidenzia in giallo la domanda (visibile anche in bacheca)
- **Pubblica sulla bacheca** — rende la domanda visibile alla pagina `/bacheca`
- **Elimina** — rimuove definitivamente la domanda

---

## Variabili d'ambiente backend (`.env`)

| Variabile | Descrizione |
|-----------|-------------|
| `PORT` | Porta del server (default: 3001) |
| `FRONTEND_URL` | URL del frontend per CORS |
| `DB_SERVER` | Host SQL Server |
| `DB_NAME` | Nome database |
| `DB_USER` | Utente database |
| `DB_PASSWORD` | Password database |
| `DB_PORT` | Porta SQL Server (default: 1433) |
| `DB_ENCRYPT` | Abilita TLS (true/false) |
| `DB_TRUST_CERT` | Accetta certificato self-signed (true/false) |
| `JWT_SECRET` | Chiave segreta JWT (stringa lunga e casuale) |
| `JWT_EXPIRES_IN` | Durata token (default: 8h) |

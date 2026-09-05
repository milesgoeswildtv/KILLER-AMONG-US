# KILLER AMONG US

A Full Tilt social-deduction murder mystery played inside **Full Tilt Headquarters**.

**MOVE → SEARCH → LEARN → LIE → CASE CONFERENCE → FORCED TRUTH → REASSESS**

## Current state — Multiplayer foundation

The project has moved beyond the single-browser prototype. A Cloudflare Worker + Durable Object now owns the authoritative match state, while every browser receives only its own private information.

### Implemented gameplay
- 9-room Full Tilt Headquarters board
- Casino Floor as central evidence-free hub
- 8 independently searchable evidence rooms
- Hidden Killer + Weapon + Crime Room solution
- Random player characters and hidden Killer role
- Killer knows WHO (themself) but not WHERE or WITH WHAT
- Private card hands
- Suggestions and ordered disproval logic
- Private suggestion history including who passed and what was shown
- d6 movement with actual route calculation
- Security configurations that alter routes
- Vault ↔ Back Room and High Roller ↔ Workshop secret passages
- Control Room private 1-or-6 switch rolls
- Persistent security and passage state
- Private 1-or-6 evidence searches
- Private room-origin evidence notebook
- Public Case Board with evidence origin intentionally hidden
- Case Conferences every fifth round with guaranteed truth progression
- Earned accusations after 3 unique verified clues
- Wrong-accusation penalty: discard hand face-down on 1/6, otherwise expose hand publicly
- Accusation re-lock until another new private room clue is recovered
- Killer **COVER YOUR TRACKS** win condition

## Multiplayer architecture

`worker.js` is authoritative. Clients never generate roles, solutions, hands, evidence, rolls, movement legality, suggestion results, or accusation results themselves.

Each player has an opaque private session token. `/state` returns:
- shared public match state
- public player locations/status
- public evidence / exposed hands
- only that player's role, hand, evidence, suggestion history and Killer knowledge

Match state lives inside a per-lobby Cloudflare Durable Object, keyed by a six-character lobby code.

### Browser flow

- `lobby.html` / `lobby.js` — create or join a match, wait for host, receive private role
- `game.html` / `game.js` — real multiplayer board connected to server actions
- `index.html` / `app.js` — earlier single-browser design prototype retained for reference/testing

### Server actions

- `POST /api/lobby/create`
- `POST /api/lobby/:code/join`
- `GET /api/lobby/:code/state`
- `POST /api/lobby/:code/start`
- `POST /api/lobby/:code/roll`
- `POST /api/lobby/:code/move`
- `POST /api/lobby/:code/search`
- `POST /api/lobby/:code/suggest`
- `POST /api/lobby/:code/switch`
- `POST /api/lobby/:code/accuse`
- `POST /api/lobby/:code/end`

## Cloudflare

The Wrangler configuration deploys the Worker, Durable Object and static browser assets together so the website and `/api/*` share one origin.

```bash
npm install
npm run deploy
```

The Durable Object binding is named `MATCHES` and class `MatchLobby`.

## Main mode: KILLER AMONG US

One investigator secretly committed the murder. Investigators are playing Clue. **The Killer is playing Clue backwards.**

The server's evidence is always truthful. The players are absolutely not required to be.

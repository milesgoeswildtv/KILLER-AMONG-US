# KILLER AMONG US

A Full Tilt social-deduction murder mystery inside **Full Tilt Headquarters**.

**MOVE → SEARCH → FIND EVIDENCE → LIE → CASE CONFERENCE → FORCED TRUTH → DEDUCE → ACCUSE**

## Canon gameplay

This is not an Among Us clone and it does not use suggestion/disproval turns. Its deduction bones are Clue: a hidden **Killer + Weapon + Room** solution, a physical board, movement, private information, evidence, and a final theory that has to be exactly right.

- Exactly 9 Headquarters rooms: The Vault, Control Room, High Roller Room, Back Office, Casino Floor, Afterhours, Workshop, Kitchen, Back Room.
- Casino Floor is the central hub and contains no evidence.
- The other 8 rooms each hold one fixed verified clue for that match.
- Search is private: roll 1 or 6 to recover that room's evidence.
- Every player can independently discover every clue; evidence is never consumed by another player's search.
- Your notebook remembers the clue's true room. Public evidence never reveals its room origin.
- One player is secretly the Killer. Investigators must identify Killer + Weapon + Room.
- The Killer knows WHO because it is them, but does not know WHERE or WITH WHAT. They are reconstructing their own crime while trying not to get caught.
- Investigators are competing with the Killer and with one another. A correct solution wins the game; there is one winner.

## Case Conferences

A Case Conference happens **after every 6 completed rounds**.

1. Normal play stops.
2. Everyone gets **one shared minute** to state their case together. There is deliberately no speaking order; the chaos is part of the social game.
3. When the minute ends, everyone votes for one player to testify.
4. The selected player must reveal a **NEW** piece of evidence they personally found. It cannot be evidence already shown publicly.
5. The clue becomes permanent public information, but its room origin stays hidden.

That creates the bluffing layer: a player can tell everyone where they *claim* the evidence came from, but the server never confirms that origin publicly.

## Headquarters systems

- d6 movement with server-calculated legal routes.
- Secret passages: **Vault ↔ Back Room** and **High Roller ↔ Workshop**.
- Control Room players can privately choose Security Doors or Hidden Passages and roll. Only 1 or 6 succeeds.
- Failed Control Room attempts remain private.
- Hidden passages remain open/closed until another successful Control Room action changes them.
- Security configurations can alter legal routes through Headquarters.
- Wrong accusations trigger the hand penalty system and lock another accusation until the player personally recovers a new private clue.
- Killer's final action is **COVER YOUR TRACKS**: correctly identify the Weapon + Room of their own murder.

## Browser multiplayer

The game is being built as a mobile-first browser game: no download, cross-device multiplayer, private player sessions, shared authoritative match state, and eventually an illustrated Headquarters board with **zoom + pan** so it feels like exploring a real tabletop/building rather than tapping flat menu squares.

`worker.js` owns the authoritative match inside a per-lobby Cloudflare Durable Object. Browsers receive public state plus only their own private role, hand, evidence origins, and Killer knowledge.

Current flow:
- `lobby.html` / `lobby.js` — create/join lobby and receive a private session.
- `game.html` / `game.js` — live multiplayer match.
- Cloudflare Worker + Durable Object — roles, solution, rolls, evidence, movement, conferences, votes, accusations, timers and persistence.

The server's evidence is always truthful. **The players absolutely do not have to be.**

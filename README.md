# KILLER AMONG US

A Full Tilt social-deduction murder mystery played inside **Full Tilt Headquarters**.

## Pass 1 — Headquarters Prototype

The first browser-playable prototype establishes the game's core loop:

**MOVE → SEARCH → LEARN → LIE → CASE CONFERENCE → FORCED TRUTH → REASSESS**

### Implemented
- Nine-room Full Tilt Headquarters board
- Casino Floor as central evidence-free hub
- Eight searchable evidence rooms
- Private d6 evidence search: only 1 or 6 succeeds
- Fixed hidden room-to-clue mapping generated per match
- Evidence is independently discoverable by every player
- Private notebook remembers both clue and its true origin room
- Public Case Board deliberately hides clue origins
- Case Conference every fifth round
- Conference publishes a genuinely new clue from the player's discoveries when possible
- Headquarters movement and adjacency
- Vault ↔ Back Room secret passage
- High Roller Room ↔ Workshop secret passage
- Control Room FLIP SWITCH
- Private 1-or-6 Control Room rolls
- Persistent hidden-passage open/locked state
- Security configuration state foundation
- Responsive/mobile layout

### Next passes
Multiplayer authoritative state, Discord identity/launch flow, real turn order, private roles, Killer assignment, card dealing, suggestions/disprovals, meeting testimony selection, balanced security-door layouts, earned accusation rules, reconnect/persistence, and final headquarters art/animation.

## Main Mode: KILLER AMONG US

One investigator secretly committed the murder. The Killer knows **WHO** — themselves — but begins without knowing **WHERE** or **WITH WHAT**. Investigators must solve Killer + Weapon + Crime Room. The Killer must investigate their own crime while hiding in plain sight.

The server's evidence is always truthful. The players are not required to be.

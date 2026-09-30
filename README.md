# coil — neon snake arena

A friendly, glowing snake game that runs in any browser — desktop or phone. Eat orbs, grow, trap rival snakes, unlock skins, and climb the worldwide leaderboard.

**Play:** `https://YOURNAME.github.io/coil-arena/` (replace with your link after publishing)

## Features

- Glowing neon arena with smooth snake physics, minimap, sounds and a kill feed
- **Solo** (12 bots), **Shrink** (battle royale — the zone closes in, last snake wins) and **Online**
- **Shared online world** — everyone in a room sees the same food, and death orbs drop for everyone
- **Private rooms** with invite links (`?room=COIL-XXXX`) and a **friends** system with friend codes
- **Player profiles** — click any name on a leaderboard
- **Weekly** and **all-time** leaderboards; weekly top 3 earn the exclusive Weekly Champ skin
- 26 **achievements** that unlock coins and titles
- 18 ranks (Bronze → Champion) with exclusive rewards; 21 shop skins including character skins (train, rocket, shark, donuts…)
- Accounts: guest, email/password, Google; cloud saves; developer accounts

## Controls

| Action | Desktop | Phone |
| --- | --- | --- |
| Steer | Mouse, or arrow keys / WASD | Touch where you want to go |
| Boost | Hold left click or Space | Hold the BOOST button |
| Pause (solo) | Esc or P | Pause button |
| Start | Enter | Play button |
| Mute | M | Speaker button |

## Run locally

```bash
./run-parrot.sh        # opens http://127.0.0.1:8000/
```

## Put it online

Follow **SETUP.txt** — it walks through creating GitHub and Firebase accounts, connecting Firebase, and publishing with one command:

```bash
./publish-github.sh
```

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css` | Page layout and neon look |
| `app.js` | The game: physics, bots, drawing, shop, UI |
| `net.js` | Firebase backend: auth, multiplayer, leaderboard, cloud save |
| `firebase-config.js` | Your Firebase project settings (paste them here) |
| `database.rules.json` | Security rules to paste into Realtime Database → Rules |
| `publish-github.sh` | Creates/updates the GitHub repo and turns on Pages |
| `.github/workflows/pages.yml` | Builds the GitHub Pages site on every push |

No build step, no frameworks — plain HTML, CSS and JavaScript.

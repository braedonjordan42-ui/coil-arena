# coil — neon snake arena

A friendly, glowing snake game that runs in any browser — desktop or phone. Eat orbs, grow, trap rival snakes, unlock skins, and climb the worldwide leaderboard.

**Play:** `https://YOURNAME.github.io/coil-arena/` (replace with your link after publishing)

## Features

- Smooth snake physics, cute animated snakes, glowing neon arena and minimap
- 12 bots with different personalities in Solo — some hunt you, some just snack
- **Online mode** with real players (Firebase Realtime Database) and KO credit across players
- Worldwide all-time leaderboard, players-online counter
- Coins, XP levels, daily streak rewards, 8 skins and 5 KO effects
- Cloud save (guest) plus optional **Save progress with Google** to sync devices
- Mouse, keyboard (arrows / WASD) and touch controls with a boost button; pause with Esc
- Works fully offline with bots if Firebase isn't set up yet

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

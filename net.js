(() => {
// Firebase backend for coil.
// Everything here is optional: if firebase-config.js still has placeholder values,
// initNet() returns null and the game runs fully offline with bots.

const V = '10.14.1';
const SDK = `https://www.gstatic.com/firebasejs/${V}`;

function isConfigured(cfg) {
  return !!(cfg && cfg.apiKey && !String(cfg.apiKey).startsWith('YOUR_') && cfg.databaseURL && !String(cfg.databaseURL).includes('YOUR_'));
}

async function initNet(cfg, { onStatus = () => {}, onUser = () => {} } = {}) {
  if (!isConfigured(cfg)) { onStatus('offline'); return null; }
  onStatus('connecting');

  const [appMod, authMod, dbMod] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-database.js`),
  ]);
  const { initializeApp } = appMod;
  const { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, linkWithPopup, signInWithPopup, signInWithCredential } = authMod;
  const { getDatabase, ref, set, update, remove, get, onValue, onDisconnect, query, orderByChild, limitToLast, equalTo, push, onChildAdded, serverTimestamp } = dbMod;

  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getDatabase(app);

  let uid = null;
  let user = null;
  let offset = 0;
  let room = null;
  let roomUnsubs = [];
  let myPlayerRef = null;

  onValue(ref(db, '.info/serverTimeOffset'), s => { offset = s.val() || 0; });

  // Presence: count everyone who has the game open.
  let presenceRef = null;
  onValue(ref(db, '.info/connected'), s => {
    const up = s.val() === true;
    onStatus(up && uid ? 'online' : uid ? 'reconnecting' : 'connecting');
    if (up && uid) setPresence();
  });
  function setPresence() {
    presenceRef = ref(db, `presence/${uid}`);
    onDisconnect(presenceRef).remove().then(() => set(presenceRef, serverTimestamp())).catch(() => {});
  }

  const ready = new Promise((resolve, reject) => {
    let first = true;
    onAuthStateChanged(auth, u => {
      if (!u) { signInAnonymously(auth).catch(err => { onStatus('error', err); if (first) reject(err); }); return; }
      const changed = uid && uid !== u.uid;
      if (changed && presenceRef) remove(presenceRef).catch(() => {});
      uid = u.uid; user = u;
      setPresence();
      onStatus('online');
      onUser(describeUser(u), changed);
      if (first) { first = false; resolve(); }
    });
  });

  function describeUser(u) {
    return { uid: u.uid, anonymous: u.isAnonymous, name: u.displayName || '', email: u.email || '' };
  }

  await ready;

  const api = {
    get uid() { return uid; },
    get user() { return user ? describeUser(user) : null; },
    now: () => Date.now() + offset,

    // ---------- Google sign-in (keeps the same player id when upgrading a guest) ----------
    async signInGoogle() {
      const provider = new GoogleAuthProvider();
      try {
        if (auth.currentUser && auth.currentUser.isAnonymous) await linkWithPopup(auth.currentUser, provider);
        else await signInWithPopup(auth, provider);
      } catch (err) {
        if (err.code === 'auth/credential-already-in-use' || err.code === 'auth/email-already-in-use') {
          const cred = GoogleAuthProvider.credentialFromError(err);
          if (cred) { await signInWithCredential(auth, cred); }
          else throw err;
        } else throw err;
      }
      user = auth.currentUser;
      onUser(describeUser(user), false);
      return describeUser(user);
    },

    // ---------- cloud save ----------
    async loadProfile() {
      const s = await get(ref(db, `profiles/${uid}`));
      return s.exists() ? s.val() : null;
    },
    saveProfile(data) {
      return set(ref(db, `profiles/${uid}`), { ...data, updated: serverTimestamp() });
    },

    // ---------- global leaderboard ----------
    submitScore(name, score, skin) {
      return set(ref(db, `leaderboard/${uid}`), { name: String(name).slice(0, 16) || 'Rookie', score: Math.floor(score), skin: skin || '', t: serverTimestamp() });
    },
    watchLeaderboard(cb, n = 10) {
      return onValue(query(ref(db, 'leaderboard'), orderByChild('score'), limitToLast(n)), s => {
        const rows = [];
        s.forEach(c => { rows.push({ uid: c.key, ...c.val() }); });
        rows.sort((a, b) => b.score - a.score);
        cb(rows);
      }, () => cb(null));
    },
    watchOnline(cb) {
      return onValue(ref(db, 'presence'), s => cb(s.size || 0), () => cb(0));
    },

    // ---------- live multiplayer room ----------
    joinRoom(roomId, { onPlayers, onKill }) {
      api.leaveRoom();
      room = roomId;
      myPlayerRef = ref(db, `rooms/${room}/players/${uid}`);
      onDisconnect(myPlayerRef).remove().catch(() => {});
      roomUnsubs.push(onValue(ref(db, `rooms/${room}/players`), s => {
        const players = {};
        const now = api.now();
        s.forEach(c => {
          const v = c.val();
          if (c.key !== uid && v && now - (v.t || 0) < 8000) players[c.key] = v;
        });
        onPlayers(players);
      }));
      const killsQ = query(ref(db, `rooms/${room}/kills`), orderByChild('k'), equalTo(uid));
      roomUnsubs.push(onChildAdded(killsQ, c => {
        const v = c.val();
        remove(c.ref).catch(() => {});
        if (v && api.now() - (v.t || 0) < 15000) onKill(v);
      }));
    },
    publish(state) {
      if (!myPlayerRef) return;
      set(myPlayerRef, { ...state, t: serverTimestamp() }).catch(() => {});
    },
    removeMe() {
      if (myPlayerRef) remove(myPlayerRef).catch(() => {});
    },
    reportKill(killerUid, victimName) {
      if (!room || !killerUid) return;
      push(ref(db, `rooms/${room}/kills`), { k: killerUid, v: uid, n: String(victimName).slice(0, 16), t: serverTimestamp() }).catch(() => {});
    },
    leaveRoom() {
      roomUnsubs.forEach(u => u());
      roomUnsubs = [];
      if (myPlayerRef) { remove(myPlayerRef).catch(() => {}); onDisconnect(myPlayerRef).cancel().catch(() => {}); }
      myPlayerRef = null;
      room = null;
    },
  };
  return api;
}

window.coilNet = { isConfigured, initNet };
})();

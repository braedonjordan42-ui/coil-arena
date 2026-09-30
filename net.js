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
  const { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, linkWithPopup, signInWithPopup, signInWithCredential, EmailAuthProvider, linkWithCredential, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } = authMod;
  const { getDatabase, ref, set, update, remove, get, onValue, onDisconnect, query, orderByChild, limitToLast, equalTo, push, onChildAdded, onChildChanged, onChildRemoved, serverTimestamp } = dbMod;

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
    const providers = (u.providerData || []).map(p => p.providerId);
    return { uid: u.uid, anonymous: u.isAnonymous, name: u.displayName || '', email: u.email || '', providers };
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

    // ---------- email + password ----------
    // Creating an account while playing as a guest upgrades that guest, so progress is kept.
    async signUpEmail(email, password) {
      const cur = auth.currentUser;
      if (cur && cur.isAnonymous) {
        const cred = EmailAuthProvider.credential(email, password);
        await linkWithCredential(cur, cred);
        await cur.reload();
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      user = auth.currentUser;
      onUser(describeUser(user), false);
      return describeUser(user);
    },
    async signInEmail(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
      user = auth.currentUser;
      return describeUser(user);
    },
    resetPassword(email) {
      return sendPasswordResetEmail(auth, email);
    },
    async signOutUser() {
      api.leaveRoom();
      if (presenceRef) await remove(presenceRef).catch(() => {});
      await signOut(auth);
    },

    // ---------- developer accounts ----------
    // An account is a dev only if the project owner added  devs/<uid>: true  in the Firebase console.
    // Clients can read their own flag but can never write it (see database.rules.json).
    async checkDev() {
      try { const s = await get(ref(db, `devs/${uid}`)); return s.val() === true; } catch { return false; }
    },
    removeLeaderboardEntry() {
      return remove(ref(db, `leaderboard/${uid}`));
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
    submitScore(name, score, skin, rk = -1) {
      return set(ref(db, `leaderboard/${uid}`), { name: String(name).slice(0, 16) || 'Rookie', score: Math.floor(score), skin: skin || '', rk: Number.isInteger(rk) ? rk : -1, t: serverTimestamp() });
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

    // ---------- weekly leaderboard ----------
    submitWeekly(week, name, score, skin, rk = -1) {
      return set(ref(db, `weekly/${week}/${uid}`), { name: String(name).slice(0, 16) || 'Rookie', score: Math.floor(score), skin: skin || '', rk: Number.isInteger(rk) ? rk : -1, t: serverTimestamp() });
    },
    watchWeekly(week, cb, n = 10) {
      return onValue(query(ref(db, `weekly/${week}`), orderByChild('score'), limitToLast(n)), s => {
        const rows = [];
        s.forEach(c => { rows.push({ uid: c.key, ...c.val() }); });
        rows.sort((a, b) => b.score - a.score);
        cb(rows);
      }, () => cb(null));
    },
    async topOfWeek(week, n = 3) {
      const s = await get(query(ref(db, `weekly/${week}`), orderByChild('score'), limitToLast(n)));
      const rows = [];
      s.forEach(c => { rows.push({ uid: c.key, ...c.val() }); });
      return rows.sort((a, b) => b.score - a.score);
    },

    // ---------- public profiles ----------
    savePublic(data) { return set(ref(db, `publicProfiles/${uid}`), { ...data, seen: serverTimestamp() }); },
    async getPublic(id) { const s = await get(ref(db, `publicProfiles/${id}`)); return s.exists() ? s.val() : null; },
    watchPublic(id, cb) { return onValue(ref(db, `publicProfiles/${id}`), s => cb(s.val()), () => cb(null)); },
    watchPresence(id, cb) { return onValue(ref(db, `presence/${id}`), s => cb(s.exists()), () => cb(false)); },
    setWhere(roomId) {
      const r = ref(db, `whereabouts/${uid}`);
      if (roomId) onDisconnect(r).remove().catch(() => {});
      return set(r, roomId ? { room: roomId, t: serverTimestamp() } : null).catch(() => {});
    },
    watchWhere(id, cb) { return onValue(ref(db, `whereabouts/${id}`), s => cb(s.val()), () => cb(null)); },

    // ---------- friends ----------
    async claimFriendCode(code) {
      try { await set(ref(db, `friendCodes/${code}`), uid); return true; } catch { return false; }
    },
    async lookupFriendCode(code) { const s = await get(ref(db, `friendCodes/${code}`)); return s.exists() ? s.val() : null; },
    sendFriendRequest(to, name) { return set(ref(db, `friendRequests/${to}/${uid}`), { n: String(name).slice(0, 16), t: serverTimestamp() }); },
    watchRequests(cb) {
      return onValue(ref(db, `friendRequests/${uid}`), s => { const out = []; s.forEach(c => { out.push({ uid: c.key, ...c.val() }); }); cb(out); }, () => cb([]));
    },
    acceptRequest(from) {
      return update(ref(db), { [`friends/${uid}/${from}`]: true, [`friends/${from}/${uid}`]: true, [`friendRequests/${uid}/${from}`]: null });
    },
    declineRequest(from) { return remove(ref(db, `friendRequests/${uid}/${from}`)); },
    removeFriend(f) { return update(ref(db), { [`friends/${uid}/${f}`]: null, [`friends/${f}/${uid}`]: null }); },
    watchFriends(cb) {
      return onValue(ref(db, `friends/${uid}`), s => { const out = []; s.forEach(c => { out.push(c.key); }); cb(out); }, () => cb([]));
    },

    // ---------- live multiplayer room (shared world) ----------
    // h: { onPlayers, onKill, onFood(slot, gen), onDrop(id, v), onDropChange(id, v), onDropRemoved(id) }
    joinRoom(roomId, h) {
      api.leaveRoom();
      room = roomId;
      myPlayerRef = ref(db, `rooms/${room}/players/${uid}`);
      onDisconnect(myPlayerRef).remove().catch(() => {});
      const base = `rooms/${room}`;
      roomUnsubs.push(onValue(ref(db, `${base}/players`), s => {
        const players = {};
        const now = api.now();
        s.forEach(c => {
          const v = c.val();
          if (c.key !== uid && v && now - (v.t || 0) < 8000) players[c.key] = v;
        });
        h.onPlayers && h.onPlayers(players);
      }));
      const killsQ = query(ref(db, `${base}/kills`), orderByChild('k'), equalTo(uid));
      roomUnsubs.push(onChildAdded(killsQ, c => {
        const v = c.val();
        remove(c.ref).catch(() => {});
        if (v && api.now() - (v.t || 0) < 15000) h.onKill && h.onKill(v);
      }));
      const foodRef = ref(db, `${base}/food`);
      const onFood = c => h.onFood && h.onFood(Number(c.key), Number(c.val()) || 0);
      roomUnsubs.push(onChildAdded(foodRef, onFood), onChildChanged(foodRef, onFood));
      const dropsRef = ref(db, `${base}/drops`);
      roomUnsubs.push(
        onChildAdded(dropsRef, c => h.onDrop && h.onDrop(c.key, c.val())),
        onChildChanged(dropsRef, c => h.onDropChange && h.onDropChange(c.key, c.val())),
        onChildRemoved(dropsRef, c => h.onDropRemoved && h.onDropRemoved(c.key)),
      );
    },
    eatFood(slot, gen) {
      if (!room) return;
      set(ref(db, `rooms/${room}/food/${slot}`), gen + 1).catch(() => {});
    },
    pushDrop(d) {
      if (!room) return;
      push(ref(db, `rooms/${room}/drops`), { ...d, u: uid, t: serverTimestamp() }).catch(() => {});
    },
    eatDrop(id, k) {
      if (!room) return;
      set(ref(db, `rooms/${room}/drops/${id}/e/${k}`), 1).catch(() => {});
    },
    removeDrop(id) {
      if (!room) return;
      remove(ref(db, `rooms/${room}/drops/${id}`)).catch(() => {});
    },
    publish(state) {
      if (!myPlayerRef) return;
      set(myPlayerRef, { ...state, t: serverTimestamp() }).catch(() => {});
    },
    removeMe() {
      if (myPlayerRef) remove(myPlayerRef).catch(() => {});
    },
    reportKill(killerUid, victimName, killerName = '') {
      if (!room || !killerUid) return;
      push(ref(db, `rooms/${room}/kills`), { k: killerUid, v: uid, n: String(victimName).slice(0, 16), kn: String(killerName).slice(0, 16), t: serverTimestamp() }).catch(() => {});
    },
    get room() { return room; },
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

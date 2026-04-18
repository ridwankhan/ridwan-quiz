# Ridwan's 30th Birthday Quiz

A multiplayer browser quiz game powered by Firebase Realtime Database. Players join from their phones, the host runs the game from one screen.

---

## How to Run the Quiz

### 1. Open the quiz
Host the `index.html` file anywhere (GitHub Pages, Netlify, local server, etc.) or just open it directly in a browser. All players need access to the same URL.

### 2. Start as host
- Open the URL on the screen everyone can see (TV, laptop, projector)
- Click **"I'm the Host"**
- The host screen shows the current question and an answer count as players respond

### 3. Players join
- Everyone else opens the same URL on their phone or device
- They type their name and click **Join Game**
- They'll see a waiting screen with all joined players listed

### 4. Run the game
For each question:
1. Players see the question and tap their answer on their own device
2. The host watches the answer count go up
3. Host clicks **Reveal Answer** — correct/wrong highlights appear on the host screen and players see their result
4. Host clicks **Show Leaderboard** to display standings, then **Next Question** to continue
5. Repeat for all 20 questions + 3 bonus rounds (double points)

### 5. End of game
After the final question, click **See Final Results** to show the winner.

---

## Resetting for a New Session

Click the **Reset Game** button at the bottom of the host screen. This clears all players, answers, and scores so a fresh game can start. The host stays in place.

---

## If the Host Screen is Lost or Crashes

If the host tab closes unexpectedly and the "A host is already in the session" message blocks you, use the force override URL:

```
https://your-quiz-url/index.html?forceHost=1
```

Then click **"I'm the Host"** — this bypasses the lock and takes over as host.

The lock also clears automatically when the host browser disconnects cleanly.

---

## Question Structure

| Tier | Points | Count |
|------|--------|-------|
| Easy | 100 | 5 |
| Medium | 100 | 5 |
| Hard | 100 | 5 |
| Chaos | 100 | 5 |
| Bonus | 200 (2x) | 3 |

**Total questions:** 23 (20 main + 3 bonus)  
**Max score:** 2,200 pts

---

## Stress Testing

To simulate 35 players for a load test (requires Node.js):

```bash
node stress-test.js
```

Run this after opening the host screen. The script registers 35 fake players and submits random answers for each question as you advance. Press `Ctrl+C` to stop — it will clean up the test players automatically.

---

## Firebase Setup

The quiz uses Firebase Realtime Database. The config is already set in `index.html`. If you need to use your own Firebase project, replace the `firebaseConfig` block near the top of the script section:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

Make sure your Firebase Realtime Database rules allow read/write (the default for a new project is fine for a private event):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

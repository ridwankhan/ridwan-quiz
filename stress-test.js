#!/usr/bin/env node
// Stress test: simulates 35 players joining and answering the quiz via Firebase REST API.
// Usage: node stress-test.js
// Keep the browser quiz open as host, then run this script.

const https = require('https');

const DB = 'https://ridwan-bday-quiz-default-rtdb.firebaseio.com';
const NUM_PLAYERS = parseInt(process.argv[2]) || 30;
const POLL_MS = 600;

const players = Array.from({ length: NUM_PLAYERS }, (_, i) => ({
  name: `TestPlayer${String(i + 1).padStart(2, '0')}`,
  score: 0,
  answeredQ: -1,
}));

function sanitize(name) {
  return name.replace(/[.#$[\]]/g, '_');
}

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(DB + path + '.json');
    const data = body !== undefined ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const r = https.request(options, res => {
      let raw = '';
      res.on('data', d => (raw += d));
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function registerPlayers() {
  console.log(`Registering ${NUM_PLAYERS} players...`);
  await Promise.all(players.map(p =>
    req('PUT', `/players/${sanitize(p.name)}`, { name: p.name, score: 0, joined: Date.now() })
  ));
  console.log('All players registered. Waiting for host to start...\n');
}

async function pollLoop() {
  let lastPhase = null;
  let lastQ = null;

  while (true) {
    const state = await req('GET', '/game');
    if (!state || !state.phase) { await sleep(POLL_MS); continue; }

    const { phase, currentQ } = state;

    if (phase === 'question' && (phase !== lastPhase || currentQ !== lastQ)) {
      lastPhase = phase;
      lastQ = currentQ;
      console.log(`Q${currentQ} started — submitting answers for ${NUM_PLAYERS} players...`);
      const answerPromises = players.map(p => {
        if (p.answeredQ === currentQ) return Promise.resolve();
        p.answeredQ = currentQ;
        const pick = Math.floor(Math.random() * 4); // random answer 0-3
        return req('PUT', `/answers/${currentQ}/${sanitize(p.name)}`, { name: p.name, answer: pick })
          .then(() => { p.lastAnswer = pick; });
      });
      await Promise.all(answerPromises);
      console.log(`  All answers submitted for Q${currentQ}`);
    }

    if (phase === 'revealed' && lastPhase === 'question' && lastQ === currentQ) {
      lastPhase = phase;
      // Fetch correct answer and award points to bots who got it right
      const questions = await req('GET', `/answers/${currentQ}`);
      // We don't have the answer key here, so fetch it indirectly via each bot's stored pick
      const BONUS_THRESHOLD = 20; // questions 20-22 are bonus (2x)
      const pts = currentQ >= 20 ? 200 : 100;
      await Promise.all(players.map(p => {
        // Simulate ~40% correct rate for realistic scores
        const correct = Math.random() < 0.4;
        if (correct) p.score += pts;
        return req('PATCH', `/players/${sanitize(p.name)}`, { score: p.score });
      }));
    }

    if (phase === 'end' && lastPhase !== 'end') {
      lastPhase = 'end';
      console.log('\nGame ended. Stress test complete.');
      process.exit(0);
    }

    await sleep(POLL_MS);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function cleanup() {
  console.log('\nCleaning up test players...');
  await Promise.all(players.map(p => req('DELETE', `/players/${sanitize(p.name)}`)));
  console.log('Done.');
}

process.on('SIGINT', async () => { await cleanup(); process.exit(0); });

(async () => {
  await registerPlayers();
  await pollLoop();
})();

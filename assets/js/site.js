(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pipEnabled = false;
  const avatar = document.querySelector('.brand-avatar');
  if (avatar && finePointer && !reducedMotion) {
    const head = avatar.querySelector('.avatar-head');
    const pupils = avatar.querySelector('.avatar-pupils');
    let lookX = 0;
    let lookY = 0;
    let avatarFrame = 0;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    window.addEventListener('pointermove', (event) => {
      const rect = avatar.getBoundingClientRect();
      lookX = clamp((event.clientX - (rect.left + rect.width / 2)) / 180, -1, 1);
      lookY = clamp((event.clientY - (rect.top + rect.height / 2)) / 140, -1, 1);
      if (avatarFrame) return;
      avatarFrame = window.requestAnimationFrame(() => {
        head.style.transform = `translate(${lookX * 1.6}px, ${lookY}px) rotate(${lookX * 5}deg)`;
        pupils.style.transform = `translate(${lookX * 1.2}px, ${lookY * .8}px)`;
        avatarFrame = 0;
      });
    }, { passive: true });
    window.addEventListener('pointerleave', () => {
      if (avatarFrame) window.cancelAnimationFrame(avatarFrame);
      avatarFrame = 0;
      head.style.transform = '';
      pupils.style.transform = '';
    });
  }

  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) {
    const soundPreference = 'babin-meow-sound';
    let soundEnabled = false;
    let audioContext;
    let soundBusy = false;
    let releaseTimer = 0;
    const activeBeeps = new Set();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    try {
      soundEnabled = window.localStorage.getItem(soundPreference) === 'on';
    } catch (_) {}

    const updateSoundToggle = () => {
      soundToggle.textContent = soundEnabled ? 'Beep: on' : 'Beep: off';
      soundToggle.setAttribute('aria-pressed', String(soundEnabled));
      soundToggle.setAttribute('aria-label', soundEnabled ? 'Turn beep sounds off' : 'Turn beep sounds on');
    };
    updateSoundToggle();

    const stopBeep = () => {
      window.clearTimeout(releaseTimer);
      releaseTimer = 0;
      activeBeeps.forEach((tone) => {
        tone.oscillator.onended = null;
        try { tone.oscillator.stop(); } catch (_) {}
        try { tone.oscillator.disconnect(); } catch (_) {}
        try { tone.envelope.disconnect(); } catch (_) {}
      });
      activeBeeps.clear();
      soundBusy = false;
    };
    const playBeep = () => {
      if (!soundEnabled || !pipEnabled || !AudioContextClass || soundBusy) return;
      soundBusy = true;
      try {
        if (!audioContext) audioContext = new AudioContextClass();
      } catch (_) {
        soundBusy = false;
        return;
      }

      const context = audioContext;
      const startPair = () => {
        if (!soundEnabled || !pipEnabled) { soundBusy = false; return; }
        const start = context.currentTime;
        [660, 880].forEach((frequency, index) => {
          const beginsAt = start + index * 0.16;
          const oscillator = context.createOscillator();
          const envelope = context.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, beginsAt);
          envelope.gain.setValueAtTime(0.0001, beginsAt);
          envelope.gain.linearRampToValueAtTime(0.028, beginsAt + 0.012);
          envelope.gain.setValueAtTime(0.028, beginsAt + 0.075);
          envelope.gain.exponentialRampToValueAtTime(0.0001, beginsAt + 0.105);
          oscillator.connect(envelope).connect(context.destination);
          const tone = { oscillator, envelope };
          activeBeeps.add(tone);
          oscillator.onended = () => {
            activeBeeps.delete(tone);
            oscillator.disconnect();
            envelope.disconnect();
          };
          oscillator.start(beginsAt);
          oscillator.stop(beginsAt + 0.11);
        });
        releaseTimer = window.setTimeout(() => {
          soundBusy = false;
          releaseTimer = 0;
        }, 330);
      };

      if (context.state === 'suspended') context.resume().then(startPair).catch(() => { soundBusy = false; });
      else startPair();
    };

    window.addEventListener('pip:pet', playBeep);
    const soundPipToggle = document.getElementById('pip-toggle');
    soundPipToggle?.addEventListener('click', () => { if (pipEnabled) stopBeep(); });

    soundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      try {
        window.localStorage.setItem(soundPreference, soundEnabled ? 'on' : 'off');
      } catch (_) {}
      updateSoundToggle();
      if (!soundEnabled) stopBeep();
    });

    document.addEventListener('click', (event) => {
      if (!pipEnabled || event.detail === 0 || soundToggle.contains(event.target) || event.target.closest?.('.buddy') || event.target.closest?.('.pip-pet-button')) return;
      playBeep();
    });
  }

  const progress = document.querySelector('.reading-progress');
  if (progress) {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = `${scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0}%`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
  }

  const gridToggle = document.getElementById('grid-toggle');
  if (gridToggle) {
    let gridEnabled = false;
    try { gridEnabled = window.localStorage.getItem('babin-blueprint-grid') === 'on'; } catch (_) {}
    const setGrid = (value) => {
      gridEnabled = value;
      document.body.classList.toggle('blueprint-grid', gridEnabled);
      gridToggle.textContent = gridEnabled ? 'Grid: on' : 'Grid: off';
      gridToggle.setAttribute('aria-pressed', String(gridEnabled));
      try { window.localStorage.setItem('babin-blueprint-grid', gridEnabled ? 'on' : 'off'); } catch (_) {}
    };
    setGrid(gridEnabled);
    gridToggle.addEventListener('click', () => setGrid(!gridEnabled));

    const pagePrefix = /\/(notes|projects)\//.test(window.location.pathname) ? '../' : '';
    const destinations = [
      { title: 'ChatApplication', detail: 'project · messages · sockets', href: 'projects/chatapplication.html', words: 'chat message lifecycle realtime websocket express mongodb' },
      { title: 'Online judge', detail: 'project · schema · worker pipeline', href: 'projects/online-judge.html', words: 'judge drizzle schema postgres sql worker sandbox cgroups' },
      { title: 'HTTP, from the first byte to the page', detail: 'note · networking', href: 'notes/http-from-first-principles.html', words: 'http dns tcp tls caching browser' },
      { title: 'The WebSocket handshake', detail: 'note · protocol', href: 'notes/websocket-handshake.html', words: 'websocket accept sha1 frames handshake' },
      { title: 'A chat message is more than a socket event', detail: 'note · delivery states', href: 'notes/message-lifecycle.html', words: 'chat message delivered sent seen reconnect' },
      { title: 'Data models that can survive a change of mind', detail: 'note · indexes and schema', href: 'notes/data-models-that-age-well.html', words: 'compound index mongodb schema postgres drizzle' },
      { title: 'An online judge is a pipeline, not a button', detail: 'note · workers and sandboxing', href: 'notes/judge-pipeline.html', words: 'judge cgroups worker sandbox queue' },
      { title: 'Dynamic programming, without the magic words', detail: 'note · recursion and memoization', href: 'notes/dynamic-programming.html', words: 'dynamic programming fibonacci memoization recursion' },
      { title: 'The DAO hack: one callback too early', detail: 'note · reentrancy', href: 'notes/the-dao-hack.html', words: 'dao hack ethereum reentrancy callback solidity' }
    ].map((item) => ({ ...item, href: pagePrefix + item.href }));

    const makeDialog = (id, title, inner) => {
      let dialog = document.getElementById(id);
      if (dialog) return dialog;
      dialog = document.createElement('dialog');
      dialog.className = 'site-dialog';
      dialog.id = id;
      dialog.setAttribute('aria-labelledby', `${id}-title`);
      dialog.innerHTML = `<div class="dialog-inner"><div class="dialog-head"><h2 id="${id}-title">${title}</h2><button class="quiet-button dialog-close" type="button" aria-label="Close">Close</button></div>${inner}</div>`;
      document.body.appendChild(dialog);
      dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
      return dialog;
    };

    const palette = makeDialog('command-palette', 'Find a page', '<label class="small-label" for="palette-search">Search projects and notes</label><input class="palette-search" id="palette-search" type="search" autocomplete="off" placeholder="Try “compound index” or “cgroups”"><ul class="palette-results" id="palette-results" role="listbox"></ul>');
    const searchInput = palette.querySelector('#palette-search');
    const results = palette.querySelector('#palette-results');
    let selectedResult = 0;
    const isSubsequence = (needle, haystack) => {
      let position = 0;
      for (const char of haystack) if (char === needle[position]) position++;
      return position === needle.length;
    };
    const rankDestination = (query, item) => {
      const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (!terms.length) return 0;
      const haystack = `${item.title} ${item.detail} ${item.words}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (haystack.includes(term)) score += term.length + 3;
        else if (isSubsequence(term, haystack)) score += 1;
        else return -1;
      }
      return score;
    };
    const renderResults = () => {
      const matches = destinations.map((item) => ({ item, score: rankDestination(searchInput.value, item) }))
        .filter((entry) => entry.score >= 0)
        .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
      selectedResult = Math.max(0, Math.min(selectedResult, matches.length - 1));
      results.replaceChildren();
      if (!matches.length) {
        results.innerHTML = '<li class="palette-empty">No matching page. Try a shorter phrase.</li>';
        return;
      }
      matches.forEach(({ item }, index) => {
        const row = document.createElement('li');
        const link = document.createElement('a');
        link.href = item.href;
        link.setAttribute('role', 'option');
        link.setAttribute('aria-selected', String(index === selectedResult));
        link.innerHTML = `<span>${item.title}</span><small>${item.detail}</small>`;
        row.appendChild(link);
        results.appendChild(row);
      });
    };
    searchInput.addEventListener('input', () => { selectedResult = 0; renderResults(); });
    searchInput.addEventListener('keydown', (event) => {
      const links = [...results.querySelectorAll('a')];
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (!links.length) return;
        event.preventDefault();
        selectedResult = (selectedResult + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links.forEach((link, index) => link.setAttribute('aria-selected', String(index === selectedResult)));
      } else if (event.key === 'Enter' && links[selectedResult]) {
        window.location.href = links[selectedResult].href;
      }
    });
    palette.addEventListener('close', () => { searchInput.value = ''; renderResults(); });
    const openPalette = () => {
      if (!palette.open) palette.showModal();
      renderResults();
      searchInput.focus();
    };

    const shortcuts = makeDialog('shortcuts-dialog', 'A few quick keys', '<dl class="shortcut-list"><dt>⌘ K / Ctrl K</dt><dd>Search every project and note</dd><dt>j / k</dt><dd>Move through sections on this page</dd><dt>p</dt><dd>Turn Bonish on or off</dd><dt>t</dt><dd>Toggle the drafting grid</dd><dt>?</dt><dd>Show or hide this card</dd><dt>Esc</dt><dd>Close the open panel</dd></dl>');
    const shortcutsToggle = document.getElementById('shortcuts-toggle');
    if (shortcutsToggle) shortcutsToggle.addEventListener('click', () => shortcuts.showModal());

    window.addEventListener('keydown', (event) => {
      const target = event.target;
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        openPalette();
        return;
      }
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        if (shortcuts.open) shortcuts.close(); else shortcuts.showModal();
        return;
      }
      if (palette.open || shortcuts.open || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === 't') { setGrid(!gridEnabled); return; }
      if (event.key.toLowerCase() === 'p') {
        const pipToggle = document.getElementById('pip-toggle');
        if (pipToggle && !pipToggle.hidden) pipToggle.click();
        return;
      }
      if (event.key.toLowerCase() === 'j' || event.key.toLowerCase() === 'k') {
        const sections = [...document.querySelectorAll('.prose h2[id], main > section[id]')];
        if (!sections.length) return;
        const current = sections.reduce((found, section, index) => section.getBoundingClientRect().top <= 120 ? index : found, -1);
        const next = Math.max(0, Math.min(sections.length - 1, current + (event.key.toLowerCase() === 'j' ? 1 : -1)));
        event.preventDefault();
        sections[next].scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }

  // Diagram nodes open the matching, repository-derived source inline.
  const wireSources = {
    'judge-schema': {
      title: 'Drizzle · problem_versions',
      source: 'packages/api/src/db/schema.ts',
      code: `export const problemVersions = pgTable('problem_versions', {
    id: uuid('id').defaultRandom().primaryKey(),
    problemId: uuid('problem_id').notNull().references(() => problems.id, { onDelete: "restrict" }),
    versionNumber: integer('version_number').notNull(),
    createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    title: text('title').notNull(),
    timeLimitMs: integer('time_limit_ms').notNull().default(1000),
    memoryLimitMb: integer('memory_limit_mb').notNull().default(256),
    statement: text('statement').notNull(),
    outputLimitMb: integer('output_limit_mb').notNull().default(1),
    difficulty: integer('difficulty').notNull().default(800),
    checkerType: checkerType('checker_type').notNull().default("STANDARD"),
    testCaseCount: integer('test_case_count').notNull(),
    testCaseS3Key: varchar('test_case_s3_key', { length: 256 }).notNull(),
    testCaseVersion: integer('test_case_version').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    checkerScriptS3Key: varchar('checker_script_s3_key', { length: 256 })
}, (table) => [
    check('checker_stuff', sql\`(\${table.checkerType} = 'STANDARD' AND \${table.checkerScriptS3Key} IS NULL) OR (\${table.checkerType} IN ('INTERACTIVE','SPECIAL') AND \${table.checkerScriptS3Key} IS NOT NULL)\`),
    check('rating_check', sql\`\${table.difficulty} >=800 AND \${table.difficulty} <=3500\`),
    check('time_limit_check', sql\`\${table.timeLimitMs} >=1000 AND \${table.timeLimitMs} <=3000\`),
    check('memory_limit_check', sql\`\${table.memoryLimitMb} >=256 AND \${table.memoryLimitMb}<=512 AND \${table.outputLimitMb} >=1 AND \${table.outputLimitMb} <=64\`),
    check('version_number_check', sql\`\${table.versionNumber}>0\`),
    check('testcase_count_check', sql\`\${table.testCaseCount} >0\`),
    check('testcase_version', sql\`\${table.testCaseVersion} > 0 \`),
    unique('uq_problem_version').on(table.problemId, table.versionNumber),
]);`
    },
    'chat-event': {
      title: 'WebSocket · delivery receipt frame',
      source: 'ChatApplication/backend/src/lib/socket.js',
      code: `// Incoming frame from the authenticated receiver
{
  "type": "message:delivered",
  "data": { "_id": "<messageId>" }
}

// Server verifies receiverId === authenticated socket user,
// then notifies the sender:
{
  "type": "message:status",
  "data": {
    "messageId": "<messageId>",
    "status": "delivered",
    "deliveredAt": "<server timestamp>"
  }
}`
    }
  };
  let activeWireTrigger = null;
  let activeWireDrawer = null;
  const closeWireDrawer = (returnFocus = false) => {
    if (activeWireTrigger) {
      activeWireTrigger.classList.remove('is-open');
      activeWireTrigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) activeWireTrigger.focus();
    }
    activeWireDrawer?.remove();
    activeWireTrigger = null;
    activeWireDrawer = null;
  };
  const renderWireDrawer = (trigger, item) => {
    const figure = trigger.closest('figure');
    if (!figure) return;
    if (!activeWireDrawer) {
      activeWireDrawer = document.createElement('aside');
      activeWireDrawer.className = 'wire-drawer';
      activeWireDrawer.id = 'wire-drawer';
      activeWireDrawer.setAttribute('role', 'region');
      activeWireDrawer.innerHTML = `<div class="wire-drawer-head"><div><h3></h3><p>Repository excerpt · <code></code></p></div><button class="quiet-button wire-close" type="button">Close</button></div><pre><code></code></pre>`;
      activeWireDrawer.querySelector('.wire-close').addEventListener('click', () => closeWireDrawer(true));
    }
    activeWireDrawer.setAttribute('aria-label', `${item.title} source excerpt`);
    activeWireDrawer.querySelector('h3').textContent = item.title;
    activeWireDrawer.querySelector('.wire-drawer-head p code').textContent = item.source;
    activeWireDrawer.querySelector('pre code').textContent = item.code;
    if (activeWireDrawer.previousElementSibling !== figure) figure.after(activeWireDrawer);
    if (activeWireTrigger && activeWireTrigger !== trigger) {
      activeWireTrigger.classList.remove('is-open');
      activeWireTrigger.setAttribute('aria-expanded', 'false');
    }
    activeWireTrigger = trigger;
    trigger.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  };
  document.querySelectorAll('.svg-inspect[data-wire]').forEach((trigger) => {
    const openSource = () => {
      const item = wireSources[trigger.dataset.wire];
      if (!item) return;
      if (activeWireTrigger === trigger) {
        closeWireDrawer();
        return;
      }
      renderWireDrawer(trigger, item);
    };
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      openSource();
    });
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openSource(); }
    });
  });

  const tracePulse = document.getElementById('trace-pulse');
  const traceStart = document.getElementById('trace-start');
  if (tracePulse && traceStart) {
    const offline = document.getElementById('trace-offline');
    const reconnect = document.getElementById('trace-reconnect');
    const dbStatus = document.getElementById('trace-db-status');
    const deliveryStatus = document.getElementById('trace-delivery-status');
    const traceStatus = document.getElementById('trace-status');
    const insertLabel = document.querySelector('.trace-insert-label');
    let busy = false;
    let waitingForReconnect = false;
    const setTraceStatus = (element, text, state) => {
      element.textContent = text;
      if (state) element.dataset.state = state;
      else delete element.dataset.state;
    };
    const pulseAlong = (fromX, fromY, toX, toY) => new Promise((resolve) => {
      tracePulse.setAttribute('visibility', 'visible');
      if (reducedMotion) {
        tracePulse.setAttribute('cx', String(toX));
        tracePulse.setAttribute('cy', String(toY));
        resolve();
        return;
      }
      let startedAt;
      const tick = (now) => {
        if (startedAt === undefined) startedAt = now;
        const linear = Math.min(1, (now - startedAt) / 470);
        const eased = linear * linear * (3 - 2 * linear);
        tracePulse.setAttribute('cx', String(fromX + (toX - fromX) * eased));
        tracePulse.setAttribute('cy', String(fromY + (toY - fromY) * eased));
        if (linear < 1) window.requestAnimationFrame(tick);
        else resolve();
      };
      window.requestAnimationFrame(tick);
    });
    const finishTrace = async () => {
      setTraceStatus(traceStatus, 'The recipient socket acknowledges the saved message.', 'done');
      await pulseAlong(310, 257, 790, 257);
      setTraceStatus(deliveryStatus, 'delivered', 'done');
      setTraceStatus(traceStatus, 'Delivered: the recipient acknowledged the persisted message.', 'done');
      tracePulse.setAttribute('visibility', 'hidden');
      busy = false;
      traceStart.disabled = false;
      offline.disabled = false;
    };
    offline.addEventListener('change', () => {
      setTraceStatus(deliveryStatus, offline.checked ? 'offline' : 'available', offline.checked ? 'waiting' : '');
    });
    traceStart.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      waitingForReconnect = false;
      traceStart.disabled = true;
      offline.disabled = true;
      reconnect.disabled = true;
      tracePulse.setAttribute('cx', '92');
      tracePulse.setAttribute('cy', '75');
      tracePulse.setAttribute('visibility', 'visible');
      setTraceStatus(dbStatus, 'waiting');
      setTraceStatus(deliveryStatus, 'not started');
      setTraceStatus(traceStatus, 'Sender posts the message to the authenticated Express route.');
      await pulseAlong(92, 75, 310, 75);
      setTraceStatus(traceStatus, 'Express checks the chat and receiver before writing.');
      await pulseAlong(310, 112, 555, 112);
      setTraceStatus(traceStatus, 'MongoDB inserts the message with status: sent.');
      await pulseAlong(310, 157, 555, 157);
      setTraceStatus(dbStatus, 'sent', 'done');
      if (insertLabel) {
        insertLabel.classList.remove('is-writing');
        void insertLabel.getBoundingClientRect();
        insertLabel.classList.add('is-writing');
      }
      if (offline.checked) {
        waitingForReconnect = true;
        busy = false;
        traceStart.disabled = false;
        offline.disabled = false;
        reconnect.disabled = false;
        tracePulse.setAttribute('visibility', 'hidden');
        setTraceStatus(deliveryStatus, 'waiting for reconnect', 'waiting');
        setTraceStatus(traceStatus, 'Saved as sent. The socket is offline, so the message stays in MongoDB until reconciliation.');
      } else {
        await finishTrace();
      }
    });
    reconnect.addEventListener('click', async () => {
      if (!waitingForReconnect || busy) return;
      waitingForReconnect = false;
      busy = true;
      reconnect.disabled = true;
      traceStart.disabled = true;
      setTraceStatus(traceStatus, 'Reconnect reconciler finds the pending sent row and notifies its sender.');
      await finishTrace();
    });
    offline.dispatchEvent(new Event('change'));
  }

  const wsKeyInput = document.getElementById('ws-key');
  const wsCompute = document.getElementById('ws-compute');
  if (wsKeyInput && wsCompute) {
    const concatOutput = document.getElementById('ws-concat');
    const acceptOutput = document.getElementById('ws-accept');
    const calcStatus = document.getElementById('ws-calc-status');
    const guid = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    let calcTimer;
    const computeAccept = async () => {
      const key = wsKeyInput.value.trim();
      if (!key) {
        concatOutput.textContent = 'Enter a Sec-WebSocket-Key.';
        acceptOutput.textContent = '—';
        return;
      }
      const exactInput = key + guid;
      concatOutput.textContent = exactInput;
      if (!window.crypto?.subtle || !window.TextEncoder) {
        calcStatus.textContent = 'This browser does not expose Web Crypto here. Open the page in a secure local browser context to compute SHA-1.';
        return;
      }
      try {
        const digest = await window.crypto.subtle.digest('SHA-1', new TextEncoder().encode(exactInput));
        const bytes = new Uint8Array(digest);
        let binary = '';
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        acceptOutput.textContent = window.btoa(binary);
        calcStatus.textContent = 'Computed in this browser with SHA-1, then Base64-encoded.';
      } catch (_) {
        calcStatus.textContent = 'The browser could not run the SHA-1 calculation in this context.';
      }
    };
    wsCompute.addEventListener('click', computeAccept);
    wsKeyInput.addEventListener('input', () => {
      window.clearTimeout(calcTimer);
      calcTimer = window.setTimeout(computeAccept, 120);
    });
    computeAccept();
  }

  const daoStep = document.getElementById('dao-step');
  if (daoStep) {
    const stages = [
      { title: '1 · The attacker calls withdraw()', copy: 'The toy contract starts with a 10 ETH credit. Its withdrawal frame is active; nothing has been paid yet.', paid: 0, credit: '10 ETH', frames: [['Attacker → withdraw()', '']] },
      { title: '2 · Ether is sent before the credit changes', copy: 'The recipient fallback runs while the old 10 ETH credit is still stored. One payout has happened, but the stale value is still visible.', paid: 10, credit: '10 ETH (stale)', frames: [['withdraw() → external call', ''], ['Receiver fallback runs', 'is-callback']] },
      { title: '3 · The fallback re-enters recursively', copy: 'A nested withdraw() sees that same stale credit and sends again. Real EVM execution keeps the outer frame suspended beneath the callback.', paid: 20, credit: '10 ETH (stale)', frames: [['Nested withdraw() → sends again', 'is-callback'], ['Outer withdraw() waiting', '']] },
      { title: '4 · Calls unwind; bookkeeping finally runs', copy: 'In this deliberately small example, three 10 ETH sends have occurred before the final balance write. The DAO exploit used its split path and contract-specific accounting; this slider teaches only the re-entry ordering.', paid: 30, credit: '0 ETH', frames: [['External calls return', 'is-unwinding'], ['Credit is finally set to zero', 'is-unwinding']] }
    ];
    const title = document.getElementById('dao-step-title');
    const copy = document.getElementById('dao-step-copy');
    const label = document.getElementById('dao-step-label');
    const stack = document.getElementById('dao-stack');
    const paid = document.getElementById('dao-paid');
    const credit = document.getElementById('dao-credit');
    const renderDaoStep = () => {
      const index = Number(daoStep.value) - 1;
      const stage = stages[index];
      title.textContent = stage.title;
      copy.textContent = stage.copy;
      label.textContent = `${index + 1} / ${stages.length}`;
      paid.textContent = `${stage.paid} ETH`;
      credit.textContent = stage.credit;
      stack.replaceChildren();
      stage.frames.forEach(([text, className]) => {
        const frame = document.createElement('div');
        frame.className = `stack-frame ${className}`.trim();
        frame.textContent = text;
        stack.appendChild(frame);
      });
      stack.setAttribute('aria-label', `${stage.frames.length} frames: ${stage.frames.map(([text]) => text).join('; ')}`);
    };
    daoStep.addEventListener('input', renderDaoStep);
    renderDaoStep();
  }

  const dpTree = document.getElementById('dp-tree');
  const memoizeToggle = document.getElementById('dp-memoize');
  if (dpTree && memoizeToggle) {
    const callCount = document.getElementById('dp-call-count');
    const treeStatus = document.getElementById('dp-tree-status');
    let memoized = false;
    const makeFibNode = (n, seen, stats) => {
      stats.calls++;
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.className = 'dp-tree-node';
      label.textContent = `fib(${n})`;
      li.appendChild(label);
      if (memoized && seen.has(n)) {
        label.classList.add('is-cache');
        const cached = document.createElement('small');
        cached.textContent = 'cached · branch pruned';
        label.appendChild(cached);
        stats.cached++;
        return li;
      }
      stats.expanded++;
      if (n <= 1) {
        label.classList.add('is-base');
        const base = document.createElement('small');
        base.textContent = 'base';
        label.appendChild(base);
        seen.add(n);
        return li;
      }
      const children = document.createElement('ul');
      children.appendChild(makeFibNode(n - 1, seen, stats));
      children.appendChild(makeFibNode(n - 2, seen, stats));
      li.appendChild(children);
      seen.add(n);
      return li;
    };
    const renderTree = () => {
      const stats = { calls: 0, expanded: 0, cached: 0 };
      const root = document.createElement('ul');
      root.appendChild(makeFibNode(5, new Set(), stats));
      dpTree.replaceChildren(root);
      callCount.textContent = memoized ? `${stats.calls} calls · ${stats.expanded} computed · ${stats.cached} cache hits` : `${stats.calls} recursive calls · ${stats.expanded} expanded`;
      dpTree.setAttribute('aria-label', memoized ? 'Memoized fib of five call tree with repeated branches collapsed' : 'Uncached fib of five recursion tree with repeated branches');
      treeStatus.textContent = memoized ? 'Red leaves are repeated states: read the saved answer and skip that whole subtree.' : 'The tree repeats the same Fibonacci states down separate branches.';
      memoizeToggle.textContent = `Memoize: ${memoized ? 'on' : 'off'}`;
      memoizeToggle.setAttribute('aria-pressed', String(memoized));
    };
    memoizeToggle.addEventListener('click', () => { memoized = !memoized; renderTree(); });
    renderTree();
  }

  const toggle = document.getElementById('pip-toggle');
  if (!toggle) return;

  const cat = document.createElement('div');
  cat.className = 'buddy';
  cat.setAttribute('aria-hidden', 'true');
  cat.innerHTML = '<svg viewBox="0 0 52 46" role="presentation">' +
    '<g class="buddy-walk">' +
      '<path d="M12 18 9 7l11 5m12 0 11-5-3 12" fill="#d4d3ce" stroke="#5e5e59" stroke-width="1.7" stroke-linejoin="round"/>' +
      '<path d="M10 21c0-6 5-10 12-10h8c7 0 12 4 12 11v7c0 7-5 11-12 11h-8c-7 0-12-4-12-11v-8Z" fill="#eeede9" stroke="#5e5e59" stroke-width="1.7"/>' +
      '<path d="M11 31c-7-1-9 3-7 6 2 2 5 1 6-1" fill="none" stroke="#5e5e59" stroke-width="2" stroke-linecap="round"/>' +
      '<g class="buddy-eyes"><ellipse cx="20" cy="24" rx="1.2" ry="1.8" fill="#292927"/><ellipse cx="32" cy="24" rx="1.2" ry="1.8" fill="#292927"/></g>' +
      '<path class="buddy-sleep-eyes" d="M17 24q3 3 6 0m6 0q3 3 6 0" fill="none" stroke="#5e5e59" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="m24 28 2 1.5 2-1.5m-2 1.5v2m-3 1c2 1.5 4 1.5 6 0" fill="none" stroke="#5e5e59" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path class="buddy-leg-a" d="M18 37v6m3-6v5" stroke="#5e5e59" stroke-width="2" stroke-linecap="round"/>' +
      '<path class="buddy-leg-b" d="M32 37v5m3-5v6" stroke="#5e5e59" stroke-width="2" stroke-linecap="round"/>' +
    '</g>' +
    '<text class="buddy-nap-z" x="36" y="8">z z z</text>' +
    '<g class="buddy-prop-detective"><path d="m13 13 3-7h16l3 7z" fill="#aaa69c" stroke="#5e5e59" stroke-width="1.2"/><path d="M11 14h27" stroke="#5e5e59" stroke-width="2" stroke-linecap="round"/><circle cx="39" cy="28" r="4" fill="none" stroke="#5e5e59" stroke-width="1.4"/><path d="m42 31 4 4" stroke="#5e5e59" stroke-width="1.5" stroke-linecap="round"/></g>' +
    '<g class="buddy-prop-judge"><path d="M39 9v25" stroke="#5e5e59" stroke-width="1.5"/><path d="M40 10h10v8H40z" fill="#d4d3ce" stroke="#5e5e59" stroke-width="1"/><text x="45" y="16" text-anchor="middle" fill="#292927" font-family="monospace" font-size="4.5">AC</text></g>' +
    '<path class="buddy-footer-paw" d="m39 34 7-9m-6 9-7-2m7 2 2 7" fill="none" stroke="#5e5e59" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  document.body.appendChild(cat);
  const pagePath = window.location.pathname;
  if (pagePath.includes('the-dao-hack')) cat.classList.add('buddy--detective');
  if (pagePath.includes('online-judge') || pagePath.includes('judge-pipeline')) cat.classList.add('buddy--judge');

  toggle.hidden = !finePointer || reducedMotion;
  let pipPreference = 'on';
  try {
    if (window.localStorage.getItem('babin-pip-enabled') === 'off') pipPreference = 'off';
  } catch (_) {}
  let enabled = finePointer && !reducedMotion && pipPreference === 'on';
  pipEnabled = enabled;
  cat.classList.toggle('is-hidden', !enabled);
  let x = -60;
  let y = -60;
  let goalX = -60;
  let goalY = -60;
  let frame = 0;
  let initialized = false;
  let napTimer = 0;
  let followTimer = 0;
  let latestPointerX = 0;
  let latestPointerY = 0;
  let petCount = 0;
  try { petCount = Number(window.localStorage.getItem('babin-pip-pets')) || 0; } catch (_) {}
  const petButton = document.createElement('button');
  petButton.className = 'buddy-toggle pip-pet-button';
  petButton.type = 'button';
  petButton.textContent = 'Pet Bonish';
  petButton.disabled = !enabled;
  const petCounter = document.createElement('span');
  petCounter.className = 'pip-pet-count';
  petCounter.id = 'pip-pet-count';
  petCounter.setAttribute('aria-live', 'polite');
  toggle.after(petButton, petCounter);
  const updatePetCount = () => {
    petCounter.textContent = petCount ? `Bonish petted ${petCount} ${petCount === 1 ? 'time' : 'times'}` : '';
    petButton.setAttribute('aria-label', `Pet Bonish${petCount ? `; petted ${petCount} ${petCount === 1 ? 'time' : 'times'}` : ''}`);
  };
  updatePetCount();
  const scheduleNap = () => {
    window.clearTimeout(napTimer);
    if (!enabled) return;
    napTimer = window.setTimeout(() => { if (enabled) cat.classList.add('is-napping'); }, 6000);
  };
  const wakePip = () => {
    cat.classList.remove('is-napping');
    scheduleNap();
  };
  const petPip = () => {
    if (!enabled) return;
    wakePip();
    petCount++;
    try { window.localStorage.setItem('babin-pip-pets', String(petCount)); } catch (_) {}
    updatePetCount();
    const rect = petButton.getBoundingClientRect();
    goalX = Math.max(28, Math.min(window.innerWidth - 28, rect.left - 34));
    goalY = Math.max(24, Math.min(window.innerHeight - 24, rect.top + rect.height / 2));
    if (!cat.classList.contains('is-visible')) {
      x = goalX;
      y = goalY;
      initialized = true;
      cat.style.transform = `translate3d(${x - 25}px, ${y - 22}px, 0)`;
    }
    cat.classList.add('is-visible', 'is-footer');
    cat.classList.remove('is-petted');
    void cat.getBoundingClientRect();
    cat.classList.add('is-petted');
    window.dispatchEvent(new CustomEvent('pip:pet'));
  };
  petButton.addEventListener('click', petPip);

  const animate = () => {
    if (!enabled) { frame = 0; return; }
    const dx = goalX - x;
    const dy = goalY - y;
    x += dx * 0.11;
    y += dy * 0.11;
    const facing = dx < -0.4 ? -1 : 1;
    const tilt = Math.max(-7, Math.min(7, dy * 0.08));
    cat.style.transform = `translate3d(${x - 25}px, ${y - 22}px, 0) scaleX(${facing}) rotate(${tilt}deg)`;
    if (Math.abs(dx) + Math.abs(dy) > 0.4) frame = window.requestAnimationFrame(animate);
    else {
      x = goalX;
      y = goalY;
      frame = 0;
      cat.classList.remove('is-moving');
    }
  };

  const backToTop = document.querySelector('.site-footer a[href="#top"]');
  const updateFooterBuddy = () => {
    if (!enabled || !finePointer || !backToTop) return;
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 40;
    if (!atBottom) { cat.classList.remove('is-footer'); return; }
    const rect = backToTop.getBoundingClientRect();
    cat.classList.add('is-footer', 'is-visible');
    cat.classList.remove('is-moving');
    goalX = Math.max(30, Math.min(window.innerWidth - 30, rect.left - 34));
    goalY = Math.max(22, Math.min(window.innerHeight - 22, rect.top + rect.height / 2));
    if (!initialized) { x = goalX; y = goalY; initialized = true; }
    if (!frame) frame = window.requestAnimationFrame(animate);
  };

  if (finePointer && !reducedMotion) {
    window.addEventListener('pointermove', (event) => {
      if (!enabled) return;
      wakePip();
      cat.classList.remove('is-footer');
      latestPointerX = event.clientX;
      latestPointerY = event.clientY;
      if (followTimer) return;
      followTimer = window.setTimeout(() => {
        followTimer = 0;
        if (!enabled) return;
        const side = latestPointerX < window.innerWidth / 2 ? 1 : -1;
        const vertical = latestPointerY < window.innerHeight * 0.62 ? 26 : -32;
        goalX = Math.max(30, Math.min(window.innerWidth - 30, latestPointerX + side * 68));
        goalY = Math.max(25, Math.min(window.innerHeight - 25, latestPointerY + vertical));
        if (!initialized) {
          x = Math.max(30, Math.min(window.innerWidth - 30, goalX + side * 32));
          y = Math.max(25, Math.min(window.innerHeight - 25, goalY + (vertical > 0 ? 14 : -14)));
          initialized = true;
        }
        cat.classList.add('is-visible', 'is-moving');
        if (!frame) frame = window.requestAnimationFrame(animate);
      }, 140);
    }, { passive: true });
    window.addEventListener('pointerleave', () => {
      window.clearTimeout(followTimer);
      followTimer = 0;
      cat.classList.remove('is-visible', 'is-moving');
    });
    window.addEventListener('scroll', () => { scheduleNap(); updateFooterBuddy(); }, { passive: true });
    window.addEventListener('resize', updateFooterBuddy, { passive: true });
    updateFooterBuddy();
  } else {
    toggle.hidden = true;
  }

  toggle.textContent = enabled ? 'Bonish on' : 'Bonish off';
  toggle.setAttribute('aria-pressed', String(enabled));
  scheduleNap();
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    pipEnabled = enabled;
    try { window.localStorage.setItem('babin-pip-enabled', enabled ? 'on' : 'off'); } catch (_) {}
    petButton.disabled = !enabled;
    toggle.textContent = enabled ? 'Bonish on' : 'Bonish off';
    toggle.setAttribute('aria-pressed', String(enabled));
    cat.classList.toggle('is-hidden', !enabled);
    if (enabled) scheduleNap();
    else {
      window.clearTimeout(napTimer);
      window.clearTimeout(followTimer);
      followTimer = 0;
      cat.classList.remove('is-napping', 'is-footer');
    }
    if (!enabled) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      cat.classList.remove('is-visible', 'is-moving');
    }
  });
})();

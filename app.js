/* Life in the UK — practice test.
   Static, dependency-free, client-side only. Progress lives in localStorage. */

(function () {
  'use strict';

  var CSV_URL = 'data/questions.csv';
  var STORE_KEY = 'liuk-session-v1';
  var LETTERS = ['A', 'B', 'C', 'D'];

  var bank = [];          // [{id, category, question, options:[4], answerIndex, explanation}]
  var byId = {};          // id -> question
  var state = null;       // {v, order, pos, results}
  var current = null;     // {q, display:[{text, isCorrect}]}
  var awaitingNext = false;

  var el = {};
  ['loading', 'error', 'error-detail', 'retry-btn', 'conflict', 'conflict-detail',
   'conflict-keep', 'conflict-fresh', 'quiz', 'category', 'question', 'options',
   'feedback', 'verdict', 'explanation', 'next-btn', 'summary', 'summary-score',
   'summary-line', 'breakdown-body', 'summary-restart', 'progress-area',
   'progress-text', 'score-text', 'bar-fill', 'restart-btn'
  ].forEach(function (id) {
    el[id] = document.getElementById(id);
  });

  /* ------------------------------------------------------------------ CSV */

  // RFC 4180-ish: handles quoted fields with commas, newlines and "" escapes.
  function parseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    var rows = [], row = [], field = '', inQuotes = false, i = 0;

    while (i < text.length) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function rowsToBank(rows) {
    if (!rows.length) throw new Error('The question file is empty.');

    var header = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var need = ['id', 'category', 'question', 'option_a', 'option_b', 'option_c',
                'option_d', 'answer', 'explanation'];
    var idx = {};
    need.forEach(function (name) {
      var at = header.indexOf(name);
      if (at === -1) throw new Error('Missing "' + name + '" column in the question file.');
      idx[name] = at;
    });

    var out = [], seen = {};
    for (var r = 1; r < rows.length; r++) {
      var row = rows[r];
      if (row.length === 1 && row[0].trim() === '') continue;   // blank line

      var answer = (row[idx.answer] || '').trim().toUpperCase();
      var answerIndex = LETTERS.indexOf(answer);
      var id = (row[idx.id] || '').trim();
      if (!id || answerIndex === -1) continue;                  // skip malformed row
      if (seen[id]) continue;                                   // skip duplicate id
      seen[id] = true;

      out.push({
        id: id,
        category: (row[idx.category] || 'General').trim(),
        question: (row[idx.question] || '').trim(),
        options: [row[idx.option_a], row[idx.option_b], row[idx.option_c], row[idx.option_d]]
                   .map(function (o) { return (o || '').trim(); }),
        answerIndex: answerIndex,
        explanation: (row[idx.explanation] || '').trim()
      });
    }

    if (!out.length) throw new Error('No usable questions were found in the file.');
    return out;
  }

  /* ---------------------------------------------------------------- state */

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function freshState() {
    return {
      v: 1,
      order: shuffle(bank.map(function (q) { return q.id; })),
      pos: 0,
      results: {}
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || s.v !== 1 || !Array.isArray(s.order) || typeof s.pos !== 'number') return null;
      if (!s.results || typeof s.results !== 'object') s.results = {};
      return s;
    } catch (e) {
      return null;   // private mode, corrupt JSON, blocked storage
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage unavailable — the session still works, it just won't resume */
    }
  }

  // Keep answered work when the bank itself has changed under the session.
  function mergeState(old) {
    var inBank = {};
    bank.forEach(function (q) { inBank[q.id] = true; });

    var answeredPrefix = old.order.slice(0, old.pos);
    var keptAnswered = answeredPrefix.filter(function (id) { return inBank[id]; });
    var keptPending = old.order.slice(old.pos).filter(function (id) { return inBank[id]; });

    var known = {};
    old.order.forEach(function (id) { known[id] = true; });
    var added = shuffle(bank.filter(function (q) { return !known[q.id]; })
                            .map(function (q) { return q.id; }));

    var results = {};
    Object.keys(old.results).forEach(function (id) {
      if (inBank[id]) results[id] = !!old.results[id];
    });

    return {
      v: 1,
      order: keptAnswered.concat(keptPending, added),
      pos: keptAnswered.length,
      results: results
    };
  }

  function score() {
    return Object.keys(state.results).reduce(function (n, id) {
      return n + (state.results[id] ? 1 : 0);
    }, 0);
  }

  /* -------------------------------------------------------------- screens */

  function show(name) {
    ['loading', 'error', 'conflict', 'quiz', 'summary'].forEach(function (s) {
      el[s].hidden = (s !== name);
    });
    var live = (name === 'quiz' || name === 'summary');
    el['progress-area'].hidden = !live;
    el['restart-btn'].hidden = !live;
  }

  function showError(message) {
    el['error-detail'].textContent = message;
    show('error');
  }

  function updateProgress() {
    var total = state.order.length;
    var answered = Object.keys(state.results).length;
    var got = score();
    var pct = answered ? Math.round((got / answered) * 100) : 0;
    var shown = Math.min(state.pos + 1, total);

    el['progress-text'].textContent = state.pos >= total
      ? 'All ' + total + ' questions answered'
      : 'Question ' + shown + ' of ' + total;
    el['score-text'].textContent = 'Score ' + got + '/' + answered + ' (' + pct + '%)';

    var through = Math.round((state.pos / total) * 100);
    el['bar-fill'].style.width = through + '%';
    el['bar-fill'].parentNode.setAttribute('aria-valuenow', String(through));
  }

  /* ---------------------------------------------------------------- quiz */

  function renderQuestion() {
    if (state.pos >= state.order.length) return renderSummary();

    var q = byId[state.order[state.pos]];
    if (!q) {                       // defensive: id vanished from the bank
      state.pos++;
      saveState();
      return renderQuestion();
    }

    var display = shuffle(q.options.map(function (text, i) {
      return { text: text, isCorrect: i === q.answerIndex };
    }));
    current = { q: q, display: display };
    awaitingNext = false;

    el.category.textContent = q.category;
    el.question.textContent = q.question;
    el.options.innerHTML = '';

    display.forEach(function (opt, i) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';

      var letter = document.createElement('span');
      letter.className = 'letter';
      letter.textContent = LETTERS[i];

      var text = document.createElement('span');
      text.textContent = opt.text;

      btn.appendChild(letter);
      btn.appendChild(text);
      btn.addEventListener('click', function () { answer(i); });
      li.appendChild(btn);
      el.options.appendChild(li);
    });

    el.feedback.hidden = true;
    el['next-btn'].hidden = true;
    updateProgress();
    show('quiz');
  }

  function answer(chosenIndex) {
    if (awaitingNext || !current) return;
    awaitingNext = true;

    var correct = current.display[chosenIndex].isCorrect;

    // Recorded and advanced right away, so a reload never repeats this question.
    state.results[current.q.id] = correct;
    state.pos++;
    saveState();

    var buttons = el.options.querySelectorAll('.option');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (current.display[i].isCorrect) {
        buttons[i].classList.add('correct');
      } else if (i === chosenIndex) {
        buttons[i].classList.add('wrong');
      } else {
        buttons[i].classList.add('muted-out');
      }
    }

    el.verdict.textContent = correct ? 'Correct' : 'Not quite';
    el.verdict.className = 'verdict ' + (correct ? 'ok' : 'no');
    el.explanation.textContent = current.q.explanation;
    el.feedback.hidden = false;

    var last = state.pos >= state.order.length;
    el['next-btn'].textContent = last ? 'See your results' : 'Next question';
    el['next-btn'].hidden = false;
    el['next-btn'].focus();

    updateProgress();
  }

  function next() {
    if (!awaitingNext) return;
    renderQuestion();
  }

  /* ------------------------------------------------------------- summary */

  function renderSummary() {
    var answered = Object.keys(state.results).length;
    var got = score();
    var pct = answered ? Math.round((got / answered) * 100) : 0;

    el['summary-score'].textContent = got + ' / ' + answered + '  (' + pct + '%)';
    el['summary-line'].textContent = pct >= 75
      ? 'That is comfortably above the 75% pass mark used by the real test.'
      : 'The real test asks for 75% to pass — worth another run through the bank.';

    var groups = {};
    Object.keys(state.results).forEach(function (id) {
      var q = byId[id];
      if (!q) return;
      var g = groups[q.category] || (groups[q.category] = { n: 0, ok: 0 });
      g.n++;
      if (state.results[id]) g.ok++;
    });

    el['breakdown-body'].innerHTML = '';
    Object.keys(groups).sort().forEach(function (name) {
      var g = groups[name];
      var tr = document.createElement('tr');
      [name, g.ok + '/' + g.n, Math.round((g.ok / g.n) * 100) + '%'].forEach(function (v) {
        var td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      el['breakdown-body'].appendChild(tr);
    });

    updateProgress();
    show('summary');
  }

  /* -------------------------------------------------------------- wiring */

  function restart() {
    if (!confirm('Start a new session? Your current progress and score will be cleared.')) return;
    state = freshState();
    saveState();
    renderQuestion();
  }

  el['next-btn'].addEventListener('click', next);
  el['restart-btn'].addEventListener('click', restart);
  el['summary-restart'].addEventListener('click', restart);
  el['retry-btn'].addEventListener('click', start);

  document.addEventListener('keydown', function (e) {
    if (el.quiz.hidden || e.metaKey || e.ctrlKey || e.altKey) return;

    if (awaitingNext) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
      return;
    }
    var pick = -1;
    if (e.key >= '1' && e.key <= '4') pick = Number(e.key) - 1;
    else pick = LETTERS.indexOf(e.key.toUpperCase());

    if (pick >= 0 && pick < 4) { e.preventDefault(); answer(pick); }
  });

  /* --------------------------------------------------------------- start */

  function begin(s) {
    state = s;
    saveState();
    renderQuestion();
  }

  function start() {
    show('loading');

    fetch(CSV_URL, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('The server returned ' + res.status + ' for ' + CSV_URL + '.');
        return res.text();
      })
      .then(function (text) {
        bank = rowsToBank(parseCSV(text));
        byId = {};
        bank.forEach(function (q) { byId[q.id] = q; });

        var saved = loadState();
        if (!saved) return begin(freshState());

        var sameSize = saved.order.length === bank.length;
        var allKnown = sameSize && saved.order.every(function (id) { return !!byId[id]; });
        if (allKnown) {
          state = saved;
          return renderQuestion();
        }

        var done = Object.keys(saved.results).length;
        el['conflict-detail'].textContent =
          'This browser has a session of ' + saved.order.length + ' question' +
          (saved.order.length === 1 ? '' : 's') + ' with ' + done + ' answered, but the bank now ' +
          'holds ' + bank.length + '. You can carry your answers across, or wipe the slate clean.';
        show('conflict');

        el['conflict-keep'].onclick = function () { begin(mergeState(saved)); };
        el['conflict-fresh'].onclick = function () { begin(freshState()); };
      })
      .catch(function (err) {
        showError(err && err.message ? err.message : String(err));
      });
  }

  start();
})();

/* Life in the UK — mock tests and practice.
   Static, dependency-free, client-side only. Progress lives in localStorage. */

(function () {
  'use strict';

  var CSV_URL = 'data/questions.csv';
  var STORE_KEY = 'liuk-session-v1';
  var LETTERS = ['A', 'B', 'C', 'D'];

  var TEST_SIZE = 24;            // questions in one mock test
  var PASS_MARK = 18;            // 75% of 24, as in the real test
  var TIME_LIMIT_MS = 45 * 60 * 1000;

  var bank = [];       // [{id, category, question, options:[4], answerIndex, explanation}]
  var byId = {};       // id -> question
  var state = null;    // see freshState()
  var mode = null;     // 'mock' | 'practice' while the quiz screen is up
  var current = null;  // practice mode: {q, display:[{text, isCorrect}]}
  var awaitingNext = false;
  var ticker = null;

  var el = {};
  ['loading', 'error', 'error-detail', 'retry-btn', 'home', 'home-btn',
   'mock-title', 'pool-line', 'pool-empty', 'timed-toggle', 'start-mock', 'abandon-mock',
   'history-card', 'history-line', 'history-body', 'reset-mocks',
   'practice-line', 'start-practice', 'reset-practice',
   'quiz', 'category', 'question', 'options', 'feedback', 'verdict', 'explanation',
   'prev-btn', 'next-btn', 'quiz-hint', 'dots-wrap', 'dots',
   'result', 'result-badge', 'result-title', 'result-score', 'result-line',
   'result-breakdown', 'result-review', 'result-next', 'result-home',
   'review', 'review-title', 'review-line', 'review-list', 'review-back', 'review-back-2',
   'summary', 'summary-score', 'summary-line', 'breakdown-body', 'summary-restart',
   'summary-home', 'progress-area', 'progress-text', 'score-text', 'bar-fill'
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

  /* -------------------------------------------------------------- helpers */

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function allIds() {
    return bank.map(function (q) { return q.id; });
  }

  function pct(n, d) {
    return d ? Math.round((n / d) * 100) : 0;
  }

  function plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  function clock(ms) {
    if (ms < 0) ms = 0;
    var total = Math.round(ms / 1000);
    var m = Math.floor(total / 60), s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ---------------------------------------------------------------- state */

  function freshMock() {
    return { pool: shuffle(allIds()), tests: [], active: null };
  }

  function freshPractice() {
    return { order: shuffle(allIds()), pos: 0, results: {} };
  }

  function freshState() {
    return {
      v: 2,
      timed: true,
      mock: freshMock(),
      practice: freshPractice()
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) || null;
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

  // Accept a saved session of any shape: upgrade v1 (one long practice run),
  // drop ids the bank no longer has, and fold newly-added ids into the pool.
  function adoptState(saved) {
    var s = freshState();
    if (!saved || typeof saved !== 'object') return s;

    if (typeof saved.timed === 'boolean') s.timed = saved.timed;

    // v1 kept a single {order, pos, results} run — that becomes practice.
    var practice = saved.v === 1 ? saved : saved.practice;
    if (practice && Array.isArray(practice.order) && typeof practice.pos === 'number') {
      var results = {};
      if (practice.results && typeof practice.results === 'object') {
        Object.keys(practice.results).forEach(function (id) {
          if (byId[id]) results[id] = !!practice.results[id];
        });
      }
      var answered = practice.order.slice(0, practice.pos).filter(function (id) { return !!byId[id]; });
      var pending = practice.order.slice(practice.pos).filter(function (id) { return !!byId[id]; });
      var known = {};
      practice.order.forEach(function (id) { known[id] = true; });
      var added = shuffle(allIds().filter(function (id) { return !known[id]; }));
      s.practice = { order: answered.concat(pending, added), pos: answered.length, results: results };
    }

    var m = saved.mock;
    if (m && Array.isArray(m.pool) && Array.isArray(m.tests)) {
      s.mock.tests = m.tests.filter(function (t) {
        return t && Array.isArray(t.ids) && typeof t.n === 'number';
      });
      s.mock.active = validActive(m.active);

      // Anything not already used by a finished or in-flight test stays available.
      var used = {};
      s.mock.tests.forEach(function (t) {
        t.ids.forEach(function (id) { used[id] = true; });
      });
      if (s.mock.active) s.mock.active.ids.forEach(function (id) { used[id] = true; });
      s.mock.pool = shuffle(allIds().filter(function (id) { return !used[id]; }));
    }

    return s;
  }

  function validActive(a) {
    if (!a || !Array.isArray(a.ids) || !a.ids.length) return null;
    if (!a.ids.every(function (id) { return !!byId[id]; })) return null;   // bank changed under it
    if (!a.order || typeof a.order !== 'object') return null;
    if (!a.answers || typeof a.answers !== 'object') a.answers = {};
    if (typeof a.pos !== 'number' || a.pos < 0 || a.pos >= a.ids.length) a.pos = 0;
    return a;
  }

  /* ------------------------------------------------- picking a mock test */

  // Sainte-Lague highest averages: every topic that still has questions gets at
  // least one, then the rest go in proportion to what is left in the pool. On
  // the full bank that is History 9, Modern Society 6, Government and Law 6,
  // Values and Principles 2, What is the UK 1.
  function allocate(avail, want) {
    var cats = Object.keys(avail).filter(function (c) { return avail[c] > 0; });
    cats.sort(function (a, b) { return avail[b] - avail[a] || (a < b ? -1 : 1); });

    var quota = {}, used = 0, total = 0;
    cats.forEach(function (c) { quota[c] = 0; total += avail[c]; });
    if (want > total) want = total;

    for (var i = 0; i < cats.length && used < want; i++) { quota[cats[i]] = 1; used++; }

    while (used < want) {
      var best = null, bestScore = -1;
      for (var j = 0; j < cats.length; j++) {
        var c = cats[j];
        if (quota[c] >= avail[c]) continue;
        var s = avail[c] / (2 * quota[c] + 1);
        if (s > bestScore) { bestScore = s; best = c; }
      }
      if (!best) break;
      quota[best]++; used++;
    }
    return quota;
  }

  // Draws TEST_SIZE ids out of the unused pool, spread across the topics.
  // The ids come out of the pool, so no later test can serve them again.
  function drawTest() {
    var pool = state.mock.pool;
    var byCat = {};
    pool.forEach(function (id) {
      var c = byId[id].category;
      (byCat[c] || (byCat[c] = [])).push(id);
    });

    var avail = {};
    Object.keys(byCat).forEach(function (c) { avail[c] = byCat[c].length; });
    var quota = allocate(avail, TEST_SIZE);

    var picked = [];
    Object.keys(quota).forEach(function (c) {
      var ids = shuffle(byCat[c].slice());
      picked = picked.concat(ids.slice(0, quota[c]));
    });
    shuffle(picked);

    var taken = {};
    picked.forEach(function (id) { taken[id] = true; });
    state.mock.pool = pool.filter(function (id) { return !taken[id]; });

    var order = {};
    picked.forEach(function (id) {
      order[id] = shuffle([0, 1, 2, 3]);
    });

    return {
      n: state.mock.tests.length + 1,
      ids: picked,
      order: order,     // id -> display slot k shows original option order[id][k]
      answers: {},      // id -> original option index chosen
      pos: 0,
      timed: !!state.timed,
      startedAt: Date.now(),
      endsAt: state.timed ? Date.now() + TIME_LIMIT_MS : 0
    };
  }

  function testsLeft() {
    return Math.floor(state.mock.pool.length / TEST_SIZE);
  }

  /* -------------------------------------------------------------- screens */

  var SCREENS = ['loading', 'error', 'home', 'quiz', 'result', 'review', 'summary'];

  function show(name) {
    SCREENS.forEach(function (s) { el[s].hidden = (s !== name); });
    el['progress-area'].hidden = (name !== 'quiz');
    el['home-btn'].hidden = (name === 'loading' || name === 'error' || name === 'home');
    if (name !== 'quiz') stopTicker();
    window.scrollTo(0, 0);
  }

  function showError(message) {
    el['error-detail'].textContent = message;
    show('error');
  }

  /* ----------------------------------------------------------------- home */

  function renderHome() {
    mode = null;
    current = null;

    var m = state.mock;
    var left = testsLeft();
    var active = m.active;

    el['mock-title'].textContent = active
      ? 'Mock test ' + active.n + ' — in progress'
      : 'Mock test ' + (m.tests.length + 1);

    el['start-mock'].textContent = active ? 'Resume mock test ' + active.n : 'Start mock test';
    el['abandon-mock'].hidden = !active;
    el['timed-toggle'].checked = !!state.timed;
    el['timed-toggle'].disabled = !!active;

    el['pool-line'].textContent =
      plural(m.pool.length, 'question') + ' never used yet — ' +
      (left > 0 ? 'enough for ' + plural(left, 'more full test') + '.'
                : 'not enough for another full test.');

    var short = !active && m.pool.length < TEST_SIZE;
    el['pool-empty'].hidden = !short;
    if (short) {
      el['pool-empty'].textContent = m.pool.length === 0
        ? 'You have worked through every question in the bank. Reset the mock tests below to go ' +
          'round again — your finished scores are kept until you do.'
        : 'Only ' + plural(m.pool.length, 'unused question') + ' left, so the next test would be ' +
          'short. Reset the mock tests below for a fresh run through the bank.';
    }
    el['start-mock'].disabled = !active && m.pool.length === 0;

    renderHistory();

    var p = state.practice;
    var doneP = Object.keys(p.results).length;
    el['practice-line'].textContent = doneP
      ? doneP + ' of ' + p.order.length + ' answered, ' +
        scorePractice() + ' right (' + pct(scorePractice(), doneP) + '%).'
      : p.order.length + ' questions in the bank.';
    el['start-practice'].textContent = doneP ? 'Continue practice' : 'Start practice';
    el['reset-practice'].hidden = !doneP;

    show('home');
  }

  function renderHistory() {
    var tests = state.mock.tests;
    el['history-card'].hidden = !tests.length;
    if (!tests.length) return;

    var passed = tests.filter(function (t) { return t.score >= PASS_MARK; }).length;
    var totalScore = tests.reduce(function (n, t) { return n + t.score; }, 0);
    el['history-line'].textContent =
      plural(tests.length, 'test') + ' completed, ' + passed + ' passed. ' +
      'Average ' + (Math.round((totalScore / tests.length) * 10) / 10) + ' out of ' + TEST_SIZE + '.';

    el['history-body'].innerHTML = '';
    tests.slice().reverse().forEach(function (t) {
      var tr = document.createElement('tr');

      var tdN = document.createElement('td');
      tdN.textContent = 'Test ' + t.n;
      tr.appendChild(tdN);

      var tdS = document.createElement('td');
      tdS.textContent = t.score + '/' + t.ids.length;
      tr.appendChild(tdS);

      var tdR = document.createElement('td');
      var tag = document.createElement('span');
      var ok = t.score >= PASS_MARK;
      tag.className = 'tag ' + (ok ? 'ok' : 'no');
      tag.textContent = ok ? 'Passed' : 'Not passed';
      tdR.appendChild(tag);
      tr.appendChild(tdR);

      var tdB = document.createElement('td');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'link-btn';
      btn.textContent = 'Review';
      btn.addEventListener('click', function () { renderResult(t); });
      tdB.appendChild(btn);
      tr.appendChild(tdB);

      el['history-body'].appendChild(tr);
    });
  }

  /* ------------------------------------------------------------ mock test */

  function startMock() {
    if (!state.mock.active) {
      if (!state.mock.pool.length) return;
      state.mock.active = drawTest();
      saveState();
    }
    mode = 'mock';
    renderMock();
  }

  function abandonMock() {
    var a = state.mock.active;
    if (!a) return;
    if (!confirm('Abandon mock test ' + a.n + '? Its questions go back in the pool for a later test.')) return;
    state.mock.pool = shuffle(state.mock.pool.concat(a.ids));
    state.mock.active = null;
    saveState();
    renderHome();
  }

  function timeLeft() {
    var a = state.mock.active;
    if (!a || !a.timed) return Infinity;
    return a.endsAt - Date.now();
  }

  function startTicker() {
    stopTicker();
    var a = state.mock.active;
    if (!a || !a.timed) return;
    ticker = setInterval(function () {
      if (mode !== 'mock' || !state.mock.active) return stopTicker();
      if (timeLeft() <= 0) { stopTicker(); return finishMock(true); }
      updateProgress();
    }, 1000);
  }

  function stopTicker() {
    if (ticker) { clearInterval(ticker); ticker = null; }
  }

  function renderMock() {
    var a = state.mock.active;
    if (!a) return renderHome();
    if (a.timed && timeLeft() <= 0) return finishMock(true);

    var q = byId[a.ids[a.pos]];
    awaitingNext = false;
    current = null;

    el.category.textContent = q.category;
    el.question.textContent = q.question;
    el.feedback.hidden = true;
    el.options.innerHTML = '';

    var chosen = a.answers.hasOwnProperty(q.id) ? a.answers[q.id] : null;

    a.order[q.id].forEach(function (orig, slot) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option' + (chosen === orig ? ' chosen' : '');
      btn.setAttribute('aria-pressed', chosen === orig ? 'true' : 'false');

      var letter = document.createElement('span');
      letter.className = 'letter';
      letter.textContent = LETTERS[slot];

      var text = document.createElement('span');
      text.textContent = q.options[orig];

      btn.appendChild(letter);
      btn.appendChild(text);
      btn.addEventListener('click', function () { chooseMock(orig); });
      li.appendChild(btn);
      el.options.appendChild(li);
    });

    var last = a.pos === a.ids.length - 1;
    el['prev-btn'].hidden = a.pos === 0;
    el['next-btn'].hidden = false;
    el['next-btn'].textContent = last ? 'Finish test' : 'Next question';
    el['quiz-hint'].innerHTML =
      'Tip: press <kbd>1</kbd>–<kbd>4</kbd> to answer, <kbd>Enter</kbd> for the next question. ' +
      'You can go back and change an answer before you finish.';

    renderDots();
    updateProgress();
    show('quiz');
    startTicker();
  }

  function chooseMock(orig) {
    var a = state.mock.active;
    if (!a) return;
    a.answers[a.ids[a.pos]] = orig;
    saveState();

    var buttons = el.options.querySelectorAll('.option');
    var slots = a.order[a.ids[a.pos]];
    for (var i = 0; i < buttons.length; i++) {
      var on = slots[i] === orig;
      buttons[i].classList.toggle('chosen', on);
      buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    renderDots();
    updateProgress();
  }

  function goMock(pos) {
    var a = state.mock.active;
    if (!a || pos < 0 || pos >= a.ids.length) return;
    a.pos = pos;
    saveState();
    renderMock();
  }

  function nextMock() {
    var a = state.mock.active;
    if (!a) return;
    if (a.pos < a.ids.length - 1) return goMock(a.pos + 1);

    var blank = a.ids.filter(function (id) { return !a.answers.hasOwnProperty(id); }).length;
    if (blank && !confirm(plural(blank, 'question') + ' still unanswered. Finish the test anyway?')) return;
    finishMock(false);
  }

  function renderDots() {
    var a = state.mock.active;
    el['dots-wrap'].hidden = false;
    el.dots.innerHTML = '';

    a.ids.forEach(function (id, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot' +
        (a.answers.hasOwnProperty(id) ? ' answered' : '') +
        (i === a.pos ? ' current' : '');
      b.textContent = String(i + 1);
      b.setAttribute('aria-label', 'Question ' + (i + 1) +
        (a.answers.hasOwnProperty(id) ? ', answered' : ', not answered'));
      if (i === a.pos) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', function () { goMock(i); });
      el.dots.appendChild(b);
    });
  }

  function finishMock(timedOut) {
    stopTicker();
    var a = state.mock.active;
    if (!a) return renderHome();

    var score = 0;
    a.ids.forEach(function (id) {
      if (a.answers[id] === byId[id].answerIndex) score++;
    });

    var test = {
      n: a.n,
      ids: a.ids,
      order: a.order,
      answers: a.answers,
      score: score,
      timed: !!a.timed,
      timedOut: !!timedOut,
      startedAt: a.startedAt,
      finishedAt: Date.now()
    };

    state.mock.tests.push(test);
    state.mock.active = null;
    saveState();
    renderResult(test);
  }

  function renderResult(test) {
    mode = null;
    var total = test.ids.length;
    var ok = test.score >= PASS_MARK;

    el['result-badge'].textContent = ok ? 'Passed' : 'Not passed';
    el['result-badge'].className = 'badge ' + (ok ? 'badge-ok' : 'badge-no');
    el['result-title'].textContent = 'Mock test ' + test.n;
    el['result-score'].textContent = test.score + ' / ' + total + '  (' + pct(test.score, total) + '%)';

    var mins = Math.max(1, Math.round((test.finishedAt - test.startedAt) / 60000));
    var bits = [];
    bits.push(ok
      ? 'The pass mark is ' + PASS_MARK + ' out of ' + TEST_SIZE + ', so this one is a pass.'
      : 'The pass mark is ' + PASS_MARK + ' out of ' + TEST_SIZE + ' — ' +
        plural(PASS_MARK - test.score, 'more') + ' needed.');
    if (test.timedOut) bits.push('Time ran out before you finished.');
    else if (test.timed) bits.push('Finished in about ' + plural(mins, 'minute') + ' of the 45 allowed.');
    var blank = test.ids.filter(function (id) { return !test.answers.hasOwnProperty(id); }).length;
    if (blank) bits.push(plural(blank, 'question') + ' left unanswered.');
    el['result-line'].textContent = bits.join(' ');

    fillBreakdown(el['result-breakdown'], test.ids, function (id) {
      return test.answers[id] === byId[id].answerIndex;
    });

    el['result-review'].onclick = function () { renderReview(test); };
    el['result-next'].hidden = state.mock.pool.length === 0;
    el['result-next'].textContent = state.mock.active
      ? 'Resume mock test ' + state.mock.active.n
      : 'Start mock test ' + (state.mock.tests.length + 1);

    show('result');
  }

  function renderReview(test) {
    mode = null;
    el['review-title'].textContent = 'Mock test ' + test.n + ' — your answers';
    el['review-line'].textContent =
      test.score + ' of ' + test.ids.length + ' correct. These questions will not come back in a ' +
      'later mock test, so read the explanations now.';

    el['review-list'].innerHTML = '';
    test.ids.forEach(function (id, i) {
      var q = byId[id];
      if (!q) return;
      var chosen = test.answers.hasOwnProperty(id) ? test.answers[id] : null;
      var right = chosen === q.answerIndex;

      var li = document.createElement('li');
      li.className = 'card review-item';

      var head = document.createElement('div');
      head.className = 'review-head';

      var num = document.createElement('span');
      num.className = 'rnum';
      num.textContent = 'Q' + (i + 1);

      var cat = document.createElement('span');
      cat.className = 'badge';
      cat.textContent = q.category;

      var tag = document.createElement('span');
      tag.className = 'tag ' + (right ? 'ok' : 'no');
      tag.textContent = chosen === null ? 'Not answered' : (right ? 'Correct' : 'Incorrect');

      head.appendChild(num);
      head.appendChild(cat);
      head.appendChild(tag);
      li.appendChild(head);

      var h = document.createElement('p');
      h.className = 'review-q';
      h.textContent = q.question;
      li.appendChild(h);

      var ul = document.createElement('ul');
      ul.className = 'options';
      (test.order[id] || [0, 1, 2, 3]).forEach(function (orig, slot) {
        var row = document.createElement('li');
        var div = document.createElement('div');
        div.className = 'option static';
        if (orig === q.answerIndex) div.className += ' correct';
        else if (orig === chosen) div.className += ' wrong';
        else div.className += ' muted-out';

        var letter = document.createElement('span');
        letter.className = 'letter';
        letter.textContent = LETTERS[slot];

        var text = document.createElement('span');
        text.textContent = q.options[orig];

        div.appendChild(letter);
        div.appendChild(text);
        if (orig === chosen) {
          var mark = document.createElement('span');
          mark.className = 'your-pick';
          mark.textContent = 'your answer';
          div.appendChild(mark);
        }
        row.appendChild(div);
        ul.appendChild(row);
      });
      li.appendChild(ul);

      var exp = document.createElement('p');
      exp.className = 'explanation';
      exp.textContent = q.explanation;
      li.appendChild(exp);

      el['review-list'].appendChild(li);
    });

    el['review-back'].onclick = function () { renderResult(test); };
    el['review-back-2'].onclick = function () { renderResult(test); };
    show('review');
  }

  function fillBreakdown(tbody, ids, isRight) {
    var groups = {};
    ids.forEach(function (id) {
      var q = byId[id];
      if (!q) return;
      var g = groups[q.category] || (groups[q.category] = { n: 0, ok: 0 });
      g.n++;
      if (isRight(id)) g.ok++;
    });

    tbody.innerHTML = '';
    Object.keys(groups).sort().forEach(function (name) {
      var g = groups[name];
      var tr = document.createElement('tr');
      [name, g.ok + '/' + g.n, pct(g.ok, g.n) + '%'].forEach(function (v) {
        var td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  /* ------------------------------------------------------------- practice */

  function scorePractice() {
    var r = state.practice.results;
    return Object.keys(r).reduce(function (n, id) { return n + (r[id] ? 1 : 0); }, 0);
  }

  function startPractice() {
    mode = 'practice';
    renderPractice();
  }

  function renderPractice() {
    var p = state.practice;
    if (p.pos >= p.order.length) return renderSummary();

    var q = byId[p.order[p.pos]];
    if (!q) {                       // defensive: id vanished from the bank
      p.pos++;
      saveState();
      return renderPractice();
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
      btn.addEventListener('click', function () { answerPractice(i); });
      li.appendChild(btn);
      el.options.appendChild(li);
    });

    el.feedback.hidden = true;
    el['prev-btn'].hidden = true;
    el['next-btn'].hidden = true;
    el['dots-wrap'].hidden = true;
    el['quiz-hint'].innerHTML =
      'Tip: press <kbd>1</kbd>–<kbd>4</kbd> to answer, <kbd>Enter</kbd> to continue.';

    updateProgress();
    show('quiz');
  }

  function answerPractice(chosenIndex) {
    if (awaitingNext || !current) return;
    awaitingNext = true;

    var p = state.practice;
    var correct = current.display[chosenIndex].isCorrect;

    // Recorded and advanced right away, so a reload never repeats this question.
    p.results[current.q.id] = correct;
    p.pos++;
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

    var last = p.pos >= p.order.length;
    el['next-btn'].textContent = last ? 'See your results' : 'Next question';
    el['next-btn'].hidden = false;
    el['next-btn'].focus();

    updateProgress();
  }

  function renderSummary() {
    mode = null;
    var p = state.practice;
    var answered = Object.keys(p.results).length;
    var got = scorePractice();

    el['summary-score'].textContent = got + ' / ' + answered + '  (' + pct(got, answered) + '%)';
    el['summary-line'].textContent = pct(got, answered) >= 75
      ? 'That is comfortably above the 75% pass mark used by the real test.'
      : 'The real test asks for 75% to pass — worth another run through the bank.';

    fillBreakdown(el['breakdown-body'], Object.keys(p.results), function (id) {
      return !!p.results[id];
    });
    show('summary');
  }

  /* ------------------------------------------------------------- progress */

  function updateProgress() {
    if (mode === 'mock') {
      var a = state.mock.active;
      if (!a) return;
      var answered = Object.keys(a.answers).length;
      el['progress-text'].textContent = 'Question ' + (a.pos + 1) + ' of ' + a.ids.length +
        ' · test ' + a.n;
      if (a.timed) {
        var left = timeLeft();
        el['score-text'].textContent = clock(left) + ' left';
        el['score-text'].className = left <= 5 * 60 * 1000 ? 'low-time' : '';
      } else {
        el['score-text'].textContent = plural(answered, 'answer') + ' given';
        el['score-text'].className = '';
      }
      setBar(pct(answered, a.ids.length));
      return;
    }

    var p = state.practice;
    var total = p.order.length;
    var done = Object.keys(p.results).length;
    var right = scorePractice();
    el['progress-text'].textContent = p.pos >= total
      ? 'All ' + total + ' questions answered'
      : 'Question ' + Math.min(p.pos + 1, total) + ' of ' + total;
    el['score-text'].textContent = 'Score ' + right + '/' + done + ' (' + pct(right, done) + '%)';
    el['score-text'].className = '';
    setBar(pct(p.pos, total));
  }

  function setBar(value) {
    el['bar-fill'].style.width = value + '%';
    el['bar-fill'].parentNode.setAttribute('aria-valuenow', String(value));
  }

  /* --------------------------------------------------------------- wiring */

  el['home-btn'].addEventListener('click', renderHome);
  el['retry-btn'].addEventListener('click', start);

  el['start-mock'].addEventListener('click', startMock);
  el['abandon-mock'].addEventListener('click', abandonMock);
  el['timed-toggle'].addEventListener('change', function () {
    state.timed = el['timed-toggle'].checked;
    saveState();
  });
  el['reset-mocks'].addEventListener('click', function () {
    if (!confirm('Reset the mock tests? Your finished test scores are cleared and every question ' +
                 'becomes available again.')) return;
    state.mock = freshMock();
    saveState();
    renderHome();
  });

  el['start-practice'].addEventListener('click', startPractice);
  el['reset-practice'].addEventListener('click', function () {
    if (!confirm('Reset practice? Your practice score is cleared. Mock tests are not affected.')) return;
    state.practice = freshPractice();
    saveState();
    renderHome();
  });

  el['next-btn'].addEventListener('click', function () {
    if (mode === 'mock') return nextMock();
    if (awaitingNext) renderPractice();
  });
  el['prev-btn'].addEventListener('click', function () {
    if (mode === 'mock') goMock(state.mock.active.pos - 1);
  });

  el['result-next'].addEventListener('click', startMock);
  el['result-home'].addEventListener('click', renderHome);
  el['summary-restart'].addEventListener('click', function () {
    state.practice = freshPractice();
    saveState();
    startPractice();
  });
  el['summary-home'].addEventListener('click', renderHome);

  document.addEventListener('keydown', function (e) {
    if (el.quiz.hidden || e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'Enter' || (e.key === ' ' && mode === 'practice' && awaitingNext)) {
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
      if (mode === 'mock') { e.preventDefault(); return nextMock(); }
      if (awaitingNext) { e.preventDefault(); return renderPractice(); }
      return;
    }

    var pick = -1;
    if (e.key >= '1' && e.key <= '4') pick = Number(e.key) - 1;
    else if (e.key.length === 1) pick = LETTERS.indexOf(e.key.toUpperCase());
    if (pick < 0 || pick > 3) return;

    e.preventDefault();
    if (mode === 'mock') {
      var a = state.mock.active;
      chooseMock(a.order[a.ids[a.pos]][pick]);
    } else if (!awaitingNext) {
      answerPractice(pick);
    }
  });

  /* --------------------------------------------------------------- start */

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

        state = adoptState(loadState());
        saveState();

        // Drop straight back into a test that is still running — on a timed
        // test the clock has been ticking while the tab was closed.
        if (state.mock.active) {
          mode = 'mock';
          renderMock();
        } else {
          renderHome();
        }
      })
      .catch(function (err) {
        showError(err && err.message ? err.message : String(err));
      });
  }

  start();
})();

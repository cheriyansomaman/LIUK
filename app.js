/* Life in the UK — 45 fixed mock tests of 24 questions.
   Static, dependency-free, client-side only. Progress lives in localStorage. */

(function () {
  'use strict';

  var CSV_URL = 'data/questions.csv';
  var STORE_KEY = 'liuk-session-v1';
  var LETTERS = ['A', 'B', 'C', 'D'];

  var PASS_RATE = 0.75;                     // the real test's pass mark
  var TIME_LIMIT_MS = 45 * 60 * 1000;
  var SAVE_EVERY_TICKS = 5;

  var bank = [];        // [{id, test, category, question, options:[4], answerIndex, explanation}]
  var byId = {};        // id -> question
  var tests = [];       // [{n, ids:[id]}] in test order
  var byTest = {};      // n -> {n, ids}

  var state = null;     // {v:3, timed, tests:{n: attempt}}
  var openTest = 0;     // the test on screen, 0 when none
  var clock = null;
  var clockAt = 0;
  var ticks = 0;

  var el = {};
  ['loading', 'error', 'error-detail', 'retry-btn', 'home', 'home-btn', 'home-title',
   'home-blurb', 'overall-line', 'overall-fill', 'timed-toggle', 'reset-all', 'test-list',
   'quiz', 'category', 'question', 'options', 'prev-btn', 'next-btn', 'quiz-hint',
   'dots-wrap', 'dots', 'result', 'result-badge', 'result-title', 'result-score',
   'result-line', 'result-breakdown', 'result-review', 'result-retake', 'result-next',
   'result-home', 'review', 'review-title', 'review-line', 'review-list', 'review-back',
   'review-back-2', 'progress-area', 'progress-text', 'score-text', 'bar-fill'
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
    var need = ['id', 'test', 'category', 'question', 'option_a', 'option_b', 'option_c',
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
      var test = parseInt((row[idx.test] || '').trim(), 10);
      if (!id || answerIndex === -1 || !(test > 0)) continue;   // skip malformed row
      if (seen[id]) continue;                                   // skip duplicate id
      seen[id] = true;

      out.push({
        id: id,
        test: test,
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

  function groupTests() {
    byTest = {};
    bank.forEach(function (q) {
      var t = byTest[q.test] || (byTest[q.test] = { n: q.test, ids: [] });
      t.ids.push(q.id);
    });
    tests = Object.keys(byTest)
      .map(Number)
      .sort(function (a, b) { return a - b; })
      .map(function (n) { return byTest[n]; });
    if (!tests.length) throw new Error('No mock tests were found in the question file.');
  }

  /* -------------------------------------------------------------- helpers */

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  function passMark(size) { return Math.ceil(size * PASS_RATE); }

  function stamp(ms) {
    if (ms < 0) ms = 0;
    var total = Math.round(ms / 1000);
    var m = Math.floor(total / 60), s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ---------------------------------------------------------------- state */

  function freshState() { return { v: 3, timed: true, open: 0, tests: {} }; }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;   // private mode, corrupt JSON, blocked storage
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage unavailable — the app still works, it just won't resume */
    }
  }

  // Keep whatever still makes sense; drop anything the question file no
  // longer backs. Sessions from before the fixed tests cannot be mapped on
  // to them, so they are simply replaced.
  function adoptState(saved) {
    var s = freshState();
    if (!saved || saved.v !== 3 || !saved.tests || typeof saved.tests !== 'object') return s;
    if (typeof saved.timed === 'boolean') s.timed = saved.timed;
    if (typeof saved.open === 'number') s.open = saved.open;

    Object.keys(saved.tests).forEach(function (key) {
      var n = Number(key);
      var a = saved.tests[key];
      if (!byTest[n] || !a || !Array.isArray(a.qorder) || !a.order) return;

      var want = byTest[n].ids.slice().sort();
      var got = a.qorder.slice().sort();
      if (want.length !== got.length) return;
      for (var i = 0; i < want.length; i++) if (want[i] !== got[i]) return;   // test changed

      if (!a.answers || typeof a.answers !== 'object') a.answers = {};
      if (typeof a.pos !== 'number' || a.pos < 0 || a.pos >= a.qorder.length) a.pos = 0;
      if (typeof a.used !== 'number' || a.used < 0) a.used = 0;
      s.tests[n] = a;
    });

    if (!s.tests[s.open] || s.tests[s.open].done) s.open = 0;
    return s;
  }

  function attempt(n) { return state.tests[n] || null; }

  function startAttempt(n) {
    var ids = shuffle(byTest[n].ids.slice());
    var order = {};
    ids.forEach(function (id) { order[id] = shuffle([0, 1, 2, 3]); });
    state.tests[n] = {
      qorder: ids,
      order: order,           // id -> display slot k shows original option order[id][k]
      answers: {},            // id -> original option index chosen
      pos: 0,
      used: 0,                // milliseconds of the allowance spent
      timed: !!state.timed,
      done: false,
      startedAt: Date.now()
    };
    saveState();
    return state.tests[n];
  }

  function answered(a) { return Object.keys(a.answers).length; }

  function scoreOf(a) {
    var n = 0;
    a.qorder.forEach(function (id) {
      if (byId[id] && a.answers[id] === byId[id].answerIndex) n++;
    });
    return n;
  }

  function passed(a) { return a.done && a.score >= passMark(a.qorder.length); }

  function nextUnfinished(after) {
    for (var i = 0; i < tests.length; i++) {
      var n = tests[(i + after) % tests.length].n;
      var a = attempt(n);
      if (!a || !a.done) return n;
    }
    return 0;
  }

  /* --------------------------------------------------------------- clock */

  function remaining(a) {
    return a.timed ? TIME_LIMIT_MS - a.used : Infinity;
  }

  function startClock() {
    stopClock();
    var a = attempt(openTest);
    if (!a || !a.timed || a.done) return;
    clockAt = Date.now();
    ticks = 0;
    clock = setInterval(function () {
      var a2 = attempt(openTest);
      if (!a2 || a2.done || el.quiz.hidden) return stopClock();
      var now = Date.now();
      a2.used += now - clockAt;
      clockAt = now;
      if (remaining(a2) <= 0) { stopClock(); return finish(true); }
      if (++ticks % SAVE_EVERY_TICKS === 0) saveState();
      updateProgress();
    }, 1000);
  }

  function stopClock() {
    if (!clock) return;
    clearInterval(clock);
    clock = null;
    var a = attempt(openTest);
    if (a && a.timed && !a.done) {
      a.used += Date.now() - clockAt;
      saveState();
    }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopClock();
    else if (!el.quiz.hidden) startClock();
  });
  window.addEventListener('pagehide', stopClock);

  /* -------------------------------------------------------------- screens */

  var SCREENS = ['loading', 'error', 'home', 'quiz', 'result', 'review'];

  function show(name) {
    if (name !== 'quiz') stopClock();
    SCREENS.forEach(function (s) { el[s].hidden = (s !== name); });
    el['progress-area'].hidden = (name !== 'quiz');
    el['home-btn'].hidden = (name === 'loading' || name === 'error' || name === 'home');
    window.scrollTo(0, 0);
  }

  function showError(message) {
    el['error-detail'].textContent = message;
    show('error');
  }

  /* ----------------------------------------------------------------- home */

  function renderHome() {
    stopClock();
    openTest = 0;
    if (state.open) { state.open = 0; saveState(); }

    var size = tests[0].ids.length;
    el['home-title'].textContent = tests.length + ' mock tests';
    el['home-blurb'].textContent =
      'Every test is a fixed set of ' + size + ' questions covering all five topics, with a pass ' +
      'mark of ' + passMark(size) + '. The ' + bank.length + ' questions in the bank are split ' +
      'between the tests, so no question appears in two of them. Take them in any order, in your ' +
      'own time — each one keeps its own progress.';

    var done = 0, won = 0, total = 0, started = 0;
    tests.forEach(function (t) {
      var a = attempt(t.n);
      if (!a) return;
      if (a.done) { done++; total += a.score; if (passed(a)) won++; }
      else if (answered(a)) started++;
    });

    var bits = [done + ' of ' + tests.length + ' tests completed'];
    if (done) {
      bits.push(won + ' passed');
      bits.push('average ' + (Math.round((total / done) * 10) / 10) + ' out of ' + size);
    }
    if (started) bits.push(plural(started, 'test') + ' in progress');
    el['overall-line'].textContent = bits.join(' · ') + '.';

    var through = pct(done, tests.length);
    el['overall-fill'].style.width = through + '%';
    el['overall-fill'].parentNode.setAttribute('aria-valuenow', String(through));
    el['reset-all'].hidden = !Object.keys(state.tests).length;

    renderList();
    show('home');
  }

  function renderList() {
    el['test-list'].innerHTML = '';

    tests.forEach(function (t) {
      var a = attempt(t.n);
      var size = t.ids.length;

      var li = document.createElement('li');
      li.className = 'card test-row';

      var head = document.createElement('div');
      head.className = 'test-head';

      var name = document.createElement('span');
      name.className = 'test-name';
      name.textContent = 'Mock test ' + t.n;
      head.appendChild(name);

      var tag = document.createElement('span');
      if (!a || (!a.done && !answered(a))) {
        tag.className = 'tag idle';
        tag.textContent = plural(size, 'question');
      } else if (!a.done) {
        tag.className = 'tag part';
        tag.textContent = answered(a) + ' of ' + size + ' answered';
      } else {
        tag.className = 'tag ' + (passed(a) ? 'ok' : 'no');
        tag.textContent = (passed(a) ? 'Passed' : 'Not passed') + ' · ' + a.score + '/' + size;
      }
      head.appendChild(tag);
      li.appendChild(head);

      if (a && (a.done || answered(a))) {
        var bar = document.createElement('div');
        bar.className = 'bar slim';
        var fill = document.createElement('div');
        fill.className = 'bar-fill' + (a.done ? (passed(a) ? ' good' : ' bad') : '');
        fill.style.width = (a.done ? pct(a.score, size) : pct(answered(a), size)) + '%';
        bar.appendChild(fill);
        li.appendChild(bar);
      }

      var actions = document.createElement('div');
      actions.className = 'actions';

      function button(label, cls, fn) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = cls;
        b.textContent = label;
        b.addEventListener('click', fn);
        actions.appendChild(b);
      }

      if (!a) {
        button('Start test', 'primary-btn', function () { begin(t.n); });
      } else if (!a.done) {
        button(answered(a) ? 'Resume' : 'Start test', 'primary-btn', function () { begin(t.n); });
        if (answered(a)) button('Reset', 'ghost-btn', function () { resetTest(t.n); });
      } else {
        button('Review', 'primary-btn', function () { renderResult(t.n); });
        button('Take again', 'ghost-btn', function () { retake(t.n); });
        button('Reset', 'ghost-btn', function () { resetTest(t.n); });
      }
      li.appendChild(actions);

      el['test-list'].appendChild(li);
    });
  }

  function resetTest(n) {
    var a = attempt(n);
    if (!a) return;
    var what = a.done ? 'Clear your result for mock test ' + n + '?'
                      : 'Clear your answers so far in mock test ' + n + '?';
    if (!confirm(what)) return;
    delete state.tests[n];
    saveState();
    renderHome();
  }

  function retake(n) {
    if (!confirm('Take mock test ' + n + ' again? Your previous result for it is replaced.')) return;
    delete state.tests[n];
    saveState();
    begin(n);
  }

  function resetAll() {
    if (!confirm('Reset every mock test? All your results and answers are cleared.')) return;
    state.tests = {};
    saveState();
    renderHome();
  }

  /* ------------------------------------------------------------- the test */

  function begin(n) {
    openTest = n;
    var a = attempt(n) || startAttempt(n);
    if (a.done) return renderResult(n);
    state.open = n;                 // so closing the tab comes back to this test
    saveState();
    renderQuestion();
  }

  function renderQuestion() {
    var a = attempt(openTest);
    if (!a) return renderHome();
    if (remaining(a) <= 0) return finish(true);

    var q = byId[a.qorder[a.pos]];
    var chosen = a.answers.hasOwnProperty(q.id) ? a.answers[q.id] : null;

    el.category.textContent = q.category;
    el.question.textContent = q.question;
    el.options.innerHTML = '';

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
      btn.addEventListener('click', function () { choose(orig); });
      li.appendChild(btn);
      el.options.appendChild(li);
    });

    el['prev-btn'].hidden = a.pos === 0;
    el['next-btn'].textContent = a.pos === a.qorder.length - 1 ? 'Finish test' : 'Next question';

    renderDots();
    updateProgress();
    show('quiz');
    startClock();
  }

  function choose(orig) {
    var a = attempt(openTest);
    if (!a || a.done) return;
    var id = a.qorder[a.pos];
    a.answers[id] = orig;
    saveState();

    var buttons = el.options.querySelectorAll('.option');
    var slots = a.order[id];
    for (var i = 0; i < buttons.length; i++) {
      var on = slots[i] === orig;
      buttons[i].classList.toggle('chosen', on);
      buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    renderDots();
    updateProgress();
  }

  function goTo(pos) {
    var a = attempt(openTest);
    if (!a || pos < 0 || pos >= a.qorder.length) return;
    a.pos = pos;
    saveState();
    renderQuestion();
  }

  function next() {
    var a = attempt(openTest);
    if (!a) return;
    if (a.pos < a.qorder.length - 1) return goTo(a.pos + 1);

    var blank = a.qorder.length - answered(a);
    if (blank && !confirm(plural(blank, 'question') + ' still unanswered. Finish the test anyway?')) return;
    finish(false);
  }

  function renderDots() {
    var a = attempt(openTest);
    el.dots.innerHTML = '';

    a.qorder.forEach(function (id, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot' +
        (a.answers.hasOwnProperty(id) ? ' answered' : '') +
        (i === a.pos ? ' current' : '');
      b.textContent = String(i + 1);
      b.setAttribute('aria-label', 'Question ' + (i + 1) +
        (a.answers.hasOwnProperty(id) ? ', answered' : ', not answered'));
      if (i === a.pos) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', function () { goTo(i); });
      el.dots.appendChild(b);
    });
  }

  function finish(timedOut) {
    stopClock();
    var a = attempt(openTest);
    if (!a) return renderHome();

    a.score = scoreOf(a);
    a.done = true;
    a.timedOut = !!timedOut;
    a.finishedAt = Date.now();
    state.open = 0;
    saveState();
    renderResult(openTest);
  }

  function updateProgress() {
    var a = attempt(openTest);
    if (!a) return;

    el['progress-text'].textContent =
      'Question ' + (a.pos + 1) + ' of ' + a.qorder.length + ' · test ' + openTest;

    if (a.timed) {
      var left = remaining(a);
      el['score-text'].textContent = stamp(left) + ' left';
      el['score-text'].className = left <= 5 * 60 * 1000 ? 'low-time' : '';
    } else {
      el['score-text'].textContent = plural(answered(a), 'answer') + ' given';
      el['score-text'].className = '';
    }

    var through = pct(answered(a), a.qorder.length);
    el['bar-fill'].style.width = through + '%';
    el['bar-fill'].parentNode.setAttribute('aria-valuenow', String(through));
  }

  /* -------------------------------------------------------------- results */

  function renderResult(n) {
    stopClock();
    openTest = n;
    var a = attempt(n);
    if (!a || !a.done) return renderHome();

    var size = a.qorder.length;
    var mark = passMark(size);
    var ok = a.score >= mark;

    el['result-badge'].textContent = ok ? 'Passed' : 'Not passed';
    el['result-badge'].className = 'badge ' + (ok ? 'badge-ok' : 'badge-no');
    el['result-title'].textContent = 'Mock test ' + n;
    el['result-score'].textContent = a.score + ' / ' + size + '  (' + pct(a.score, size) + '%)';

    var bits = [ok
      ? 'The pass mark is ' + mark + ' out of ' + size + ', so this one is a pass.'
      : 'The pass mark is ' + mark + ' out of ' + size + ' — ' +
        plural(mark - a.score, 'more') + ' needed.'];
    if (a.timedOut) bits.push('Time ran out before you finished.');
    else if (a.timed) bits.push('You used ' + stamp(a.used) + ' of the 45 minutes.');
    var blank = size - answered(a);
    if (blank) bits.push(plural(blank, 'question') + ' left unanswered.');
    el['result-line'].textContent = bits.join(' ');

    var groups = {};
    a.qorder.forEach(function (id) {
      var q = byId[id];
      if (!q) return;
      var g = groups[q.category] || (groups[q.category] = { n: 0, ok: 0 });
      g.n++;
      if (a.answers[id] === q.answerIndex) g.ok++;
    });

    el['result-breakdown'].innerHTML = '';
    Object.keys(groups).sort().forEach(function (name) {
      var g = groups[name];
      var tr = document.createElement('tr');
      [name, g.ok + '/' + g.n, pct(g.ok, g.n) + '%'].forEach(function (v) {
        var td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      el['result-breakdown'].appendChild(tr);
    });

    var upNext = nextUnfinished(indexOfTest(n) + 1);
    el['result-next'].hidden = !upNext || upNext === n;
    el['result-next'].textContent = 'Next test' + (upNext ? ' (' + upNext + ')' : '');
    el['result-next'].onclick = function () { begin(upNext); };

    show('result');
  }

  function indexOfTest(n) {
    for (var i = 0; i < tests.length; i++) if (tests[i].n === n) return i;
    return 0;
  }

  function renderReview(n) {
    var a = attempt(n);
    if (!a || !a.done) return renderHome();
    openTest = n;

    el['review-title'].textContent = 'Mock test ' + n + ' — your answers';
    el['review-line'].textContent = a.score + ' of ' + a.qorder.length + ' correct. ' +
      'These questions belong to this test only, so they will not come up in another one.';

    el['review-list'].innerHTML = '';
    a.qorder.forEach(function (id, i) {
      var q = byId[id];
      if (!q) return;
      var chosen = a.answers.hasOwnProperty(id) ? a.answers[id] : null;
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
      (a.order[id] || [0, 1, 2, 3]).forEach(function (orig, slot) {
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

    show('review');
  }

  /* --------------------------------------------------------------- wiring */

  el['home-btn'].addEventListener('click', renderHome);
  el['retry-btn'].addEventListener('click', start);
  el['reset-all'].addEventListener('click', resetAll);

  el['timed-toggle'].addEventListener('change', function () {
    state.timed = el['timed-toggle'].checked;
    saveState();
  });

  el['next-btn'].addEventListener('click', next);
  el['prev-btn'].addEventListener('click', function () {
    var a = attempt(openTest);
    if (a) goTo(a.pos - 1);
  });

  el['result-review'].addEventListener('click', function () { renderReview(openTest); });
  el['result-retake'].addEventListener('click', function () { retake(openTest); });
  el['result-home'].addEventListener('click', renderHome);
  el['review-back'].addEventListener('click', function () { renderResult(openTest); });
  el['review-back-2'].addEventListener('click', function () { renderResult(openTest); });

  document.addEventListener('keydown', function (e) {
    if (el.quiz.hidden || e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'Enter') {
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
      e.preventDefault();
      return next();
    }

    var pick = -1;
    if (e.key >= '1' && e.key <= '4') pick = Number(e.key) - 1;
    else if (e.key.length === 1) pick = LETTERS.indexOf(e.key.toUpperCase());
    if (pick < 0 || pick > 3) return;

    e.preventDefault();
    var a = attempt(openTest);
    if (a) choose(a.order[a.qorder[a.pos]][pick]);
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
        groupTests();

        state = adoptState(loadState());
        saveState();
        el['timed-toggle'].checked = !!state.timed;

        // Come back into a test that was left running rather than the list.
        if (state.open) begin(state.open);
        else renderHome();
      })
      .catch(function (err) {
        showError(err && err.message ? err.message : String(err));
      });
  }

  start();
})();

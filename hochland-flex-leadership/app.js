'use strict';

const questions = globalThis.cases;
const styles = {
  S1: { name: 'Директивный', actions: 'Задать шаги и договориться, когда проверить результат.' },
  S2: { name: 'Наставнический', actions: 'Дать ориентиры, объяснить их и обсудить вопросы сотрудника.' },
  S3: { name: 'Поддерживающий', actions: 'Обсудить сомнения и помочь сотруднику выбрать свой способ действий.' },
  S4: { name: 'Делегирующий', actions: 'Согласовать результат и рамки, оставив способ работы сотруднику.' }
};
const levels = {
  D1: { description: 'Сотрудник впервые берётся за задачу и хочет попробовать.', style: 'S1' },
  D2: { description: 'Сотрудник освоил часть задачи, но после трудностей теряет уверенность или желание продолжать.', style: 'S2' },
  D3: { description: 'Сотрудник умеет выполнять задачу, но сейчас сомневается.', style: 'S3' },
  D4: { description: 'Сотрудник умеет выполнять задачу и готов действовать самостоятельно.', style: 'S4' }
};
const practicePrompts = {
  D1: 'Вспомните сотрудника, который берётся за новую задачу. Что вы покажете ему на примере перед первой самостоятельной попыткой?',
  D2: 'Какие шаги стоит уточнить и какие трудности обсудить с сотрудником?',
  D3: 'Что поможет сотруднику разобраться с сомнениями и самому выбрать, как действовать?',
  D4: 'Какие рамки достаточно согласовать, чтобы сотрудник выбрал способ работы сам?'
};
const storageKey = 'hochland-flex-leadership-v1';
const app = document.querySelector('#app');
const emptyState = () => ({ started: false, completed: false, index: 0, answers: questions.map(() => null) });
let state = readState();
let showWelcome = location.hash !== '#razbor';
let storageAvailable = true;

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || !Array.isArray(saved.answers) || saved.answers.length !== questions.length) return emptyState();
    const answers = saved.answers.map((answer) => Number.isInteger(answer) && answer >= 0 && answer < 4 ? answer : null);
    return {
      started: saved.started === true,
      completed: saved.completed === true && answers.every((answer) => answer !== null),
      index: Number.isInteger(saved.index) && saved.index >= 0 && saved.index < questions.length ? saved.index : 0,
      answers
    };
  } catch {
    return emptyState();
  }
}

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    storageAvailable = false;
  }
}

function render() {
  const reviewOpen = location.hash === '#razbor';
  if (reviewOpen && state.completed) {
    app.innerHTML = resultView();
  } else if (showWelcome) {
    app.innerHTML = welcomeView();
  } else if (state.completed) {
    app.innerHTML = completedView();
  } else {
    app.innerHTML = state.started ? questionView() : welcomeView();
  }
}

function welcomeView() {
  const hasAnswers = state.answers.some((answer) => answer !== null);
  const button = state.completed
    ? '<button data-action="reset">Пройти заново</button>'
    : `<button data-action="start">${hasAnswers ? 'Продолжить' : 'Начать'}</button>`;
  const savedNote = state.completed
    ? 'Вы уже прошли опросник. Ваш результат доступен по ссылке для разбора.'
    : hasAnswers ? 'Можно продолжить с того места, где вы остановились.' : '';
  return `
    <section class="panel intro">
      <p class="label">Модуль «Ситуационное руководство»</p>
      <h1 tabindex="-1">Гибкое лидерство</h1>
      <p class="lede">Представьте, что вы руководитель в каждой из ситуаций. Выберите одно действие, с которого вы, скорее всего, начали бы при описанных условиях.</p>
      <div class="meta"><span>16 ситуаций</span><span>Около 15 минут</span></div>
      <p class="muted">Ответы сохраняются в этом браузере. Личный результат откроется по ссылке для разбора, которую даст тренер.</p>
      ${savedNote ? `<p>${savedNote}</p>` : ''}
      <div class="controls">${button}</div>
      ${state.completed ? resetDialog() : ''}
    </section>`;
}

function questionView() {
  const question = questions[state.index];
  const selected = state.answers[state.index];
  const answered = state.answers.filter((answer) => answer !== null).length;
  return `
    <section class="panel">
      <div class="progress-row"><span>Ситуация ${state.index + 1} из ${questions.length}</span><span id="answered" aria-live="polite">Ответов ${answered} из ${questions.length}</span></div>
      <progress id="progress" aria-label="Прогресс опросника" max="${questions.length}" value="${answered}"></progress>
      <h1 tabindex="-1">${question.title}</h1>
      <p class="prompt" id="prompt">${question.prompt}</p>
      <form id="question-form">
        <fieldset aria-describedby="prompt">
          <legend class="sr-only">Выберите одно действие</legend>
          <div class="options">
            ${question.options.map((option, index) => `
              <label class="option">
                <input type="radio" name="answer" value="${index}" ${selected === index ? 'checked' : ''}>
                <span>${option.text}</span>
              </label>`).join('')}
          </div>
        </fieldset>
        <div class="controls spread">
          <button type="button" class="secondary" data-action="back">${state.index ? 'Назад' : 'К инструкции'}</button>
          <button type="submit" data-action="next" ${selected === null ? 'disabled' : ''}>${state.index === questions.length - 1 ? 'Завершить' : 'Далее'}</button>
        </div>
      </form>
    </section>`;
}

function completedView() {
  return `
    <section class="panel intro">
      <h1 tabindex="-1">Опросник пройден</h1>
      <p class="lede">${storageAvailable ? 'Вы ответили на все 16 вопросов. Ответы сохранены в этом браузере.' : 'Вы ответили на все 16 вопросов. Ответы доступны в этой вкладке до её закрытия или обновления.'}</p>
      <p>Когда тренер даст ссылку для разбора, ${storageAvailable ? 'откройте её на этом же устройстве и в этом же браузере.' : 'добавьте #razbor в конец адреса этой вкладки.'}</p>
      <div class="controls"><button class="secondary" data-action="reset">Пройти заново</button></div>
      ${resetDialog()}
    </section>`;
}

function summarize(answers) {
  const counts = Object.fromEntries(Object.keys(styles).map((style) => [style, 0]));
  const byLevel = Object.fromEntries(Object.keys(levels).map((level) => [level, { total: 0, matches: 0 }]));
  let matches = 0;
  questions.forEach((question, index) => {
    const answer = answers[index];
    const style = question.options[answer].style;
    const group = byLevel[question.level];
    counts[style]++;
    group.total++;
    if (answer === question.recommended) {
      group.matches++;
      matches++;
    }
  });
  return { counts, byLevel, matches };
}

function levelsToReview(result) {
  if (result.matches === questions.length) return [];
  const groups = Object.entries(result.byLevel);
  const lowest = Math.min(...groups.map(([, group]) => group.matches));
  return groups.filter(([, group]) => group.matches === lowest);
}

function observation(reviewLevels) {
  if (reviewLevels.length === 0) {
    return '<p>Для разбора выберите ситуацию, которая ближе всего к вашей работе.</p>';
  }
  if (reviewLevels.length > 1) {
    const codes = reviewLevels.map(([level]) => level);
    const list = new Intl.ListFormat('ru').format(codes);
    const { matches, total } = reviewLevels[0][1];
    return `<h3>Меньше всего совпадений на уровнях ${list}</h3><p>На каждом из этих уровней совпадений с моделью по <strong>${matches} из ${total}</strong>.</p>`;
  }
  const [[level, group]] = reviewLevels;
  const { description, style } = levels[level];
  const { name, actions } = styles[style];
  return `<h3>Меньше всего совпадений на уровне ${level}</h3>
    <p>Результат на этом уровне — <strong>${group.matches} из ${group.total}</strong>. ${description}</p>
    <p>Модель рекомендует <strong>${style} - «${name}»</strong>. ${actions}</p>`;
}

function frequencyNote(counts) {
  const entries = Object.entries(counts);
  const max = Math.max(...Object.values(counts));
  const min = Math.min(...Object.values(counts));
  if (max === min) return 'Все четыре стиля вы выбирали одинаково часто.';
  const names = (count) => entries.filter(([, value]) => value === count).map(([key]) => styles[key].name.toLowerCase()).join(', ');
  return `Чаще всего — ${names(max)}. Реже всего — ${names(min)}.`;
}

function resultView() {
  const result = summarize(state.answers);
  const reviewLevels = levelsToReview(result);
  const practiceQuestion = reviewLevels.length === 1
    ? practicePrompts[reviewLevels[0][0]]
    : 'Вспомните похожую ситуацию из своей работы. Какой стиль подошёл бы сотруднику и что вы сделаете в следующем разговоре?';
  return `
    <section class="panel">
      <div class="result-head"><p class="label">Гибкое лидерство</p><h1 tabindex="-1">Ваш выбор в ситуациях</h1></div>
      <div class="section">
        <h2>Совпадения с рекомендациями модели</h2>
        <p class="score">${result.matches} из ${questions.length}</p>
        <div class="readout">${observation(reviewLevels)}</div>
        <ul class="breakdown">
          ${Object.entries(result.byLevel).map(([level, group]) => `<li><span>${level}. ${levels[level].description}</span><strong>${group.matches} из ${group.total}</strong></li>`).join('')}
        </ul>
      </div>
      <div class="section">
        <h2>Какие стили вы выбирали</h2>
        <p class="muted">${frequencyNote(result.counts)}</p>
        <div class="style-bars">
          ${Object.entries(styles).map(([id, style]) => {
            const label = `${id} - «${style.name}»`;
            return `<div class="style-row"><span>${label}</span><progress aria-label="${label}" max="${questions.length}" value="${result.counts[id]}"></progress><strong>${result.counts[id]}</strong></div>`;
          }).join('')}
        </div>
      </div>
      <div class="section">
        <h2>Четыре стиля в модели</h2>
        <div class="model-grid">
          ${Object.entries(styles).map(([id, style]) => `<div class="model-item"><h3>${id} · ${style.name}</h3><p>${style.actions}</p></div>`).join('')}
        </div>
      </div>
      <div class="section">
        <h2>Разбор ответов</h2>
        <details id="review">
          <summary>Все 16 ситуаций</summary>
          <ol class="review-list">
            ${questions.map((question, index) => {
              const choice = question.options[state.answers[index]];
              const suggested = question.options[question.recommended];
              const matched = state.answers[index] === question.recommended;
              return `<li class="review-card">
                <h3>${question.id}. ${question.title}</h3>
                <p class="muted">${question.prompt}</p>
                <p><strong>Ваш выбор · ${styles[choice.style].name}.</strong> ${choice.text}</p>
                <p><strong>По модели · ${styles[suggested.style].name}.</strong> ${matched ? 'Совпадает с вашим выбором.' : suggested.text}</p>
                <p><strong>Что учесть в ситуации.</strong> ${question.clue}.</p>
              </li>`;
            }).join('')}
          </ol>
        </details>
      </div>
      <aside class="forward"><h3>Как применить в работе</h3><p>${practiceQuestion}</p></aside>
      <div class="controls">
        <button data-action="print">Сохранить PDF</button>
        <button class="secondary" data-action="reset">Пройти заново</button>
      </div>
      ${resetDialog()}
    </section>`;
}

function resetDialog() {
  return `<dialog class="dialog" aria-labelledby="reset-title"><h2 id="reset-title">Начать новое прохождение?</h2>
    <p>Текущие ответы будут удалены из этого браузера.</p>
    <form class="controls" method="dialog"><button class="secondary" value="cancel" autofocus>Отмена</button><button type="button" data-action="confirm-reset">Начать заново</button></form></dialog>`;
}

function navigate() {
  saveState();
  render();
  app.querySelector('h1').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

app.addEventListener('change', (event) => {
  if (!event.target.matches('input[name="answer"]')) return;
  state.answers[state.index] = Number(event.target.value);
  saveState();
  const answered = state.answers.filter((answer) => answer !== null).length;
  app.querySelector('#progress').value = answered;
  app.querySelector('#answered').textContent = `Ответов ${answered} из ${questions.length}`;
  app.querySelector('[data-action="next"]').disabled = false;
});

app.addEventListener('submit', (event) => {
  if (event.target.id !== 'question-form') return;
  event.preventDefault();
  if (state.answers[state.index] === null) return;
  if (state.index < questions.length - 1) {
    state.index++;
  } else {
    const missing = state.answers.indexOf(null);
    if (missing < 0) state.completed = true;
    else state.index = missing;
  }
  navigate();
});

app.addEventListener('click', (event) => {
  switch (event.target.closest('button')?.dataset.action) {
    case 'start':
      showWelcome = false;
      state.started = true;
      navigate();
      break;
    case 'back':
      if (state.index) state.index--;
      else state.started = false;
      navigate();
      break;
    case 'print': {
      const review = app.querySelector('#review');
      const wasOpen = review.open;
      review.open = true;
      window.addEventListener('afterprint', () => { review.open = wasOpen; }, { once: true });
      window.print();
      break;
    }
    case 'reset':
      app.querySelector('dialog').showModal();
      break;
    case 'confirm-reset':
      state = emptyState();
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      navigate();
      break;
  }
});

window.addEventListener('hashchange', () => {
  showWelcome = location.hash !== '#razbor';
  render();
  app.querySelector('h1').focus({ preventScroll: true });
});
render();

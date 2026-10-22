'use strict';
window.VantaMoney = function createMoney(ui) {
  const DELTA_MS = 2600;
  const EMPTY = { cash: null, bank: null, job: '', grade: '', hidden: true };

  let money = { ...EMPTY };
  let lastShown = { cash: null, bank: null };
  let deltaTimer = 0;

  const asNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
  const format = (amount) =>
    asNumber(amount) === null ? '—' : '$ ' + Math.round(amount).toLocaleString('fr-FR').replace(/[  ]/g, ' ');

  function paint() {
    const root = document.getElementById('money-hud');
    if (!root) return;

    const hasData = money.cash !== null || money.bank !== null || money.job;
    const visible = ui.canShow('moneyHud') && !money.hidden && hasData;
    root.hidden = !visible;
    if (!visible) return;

    document.getElementById('money-cash').textContent = format(money.cash);
    document.getElementById('money-bank').textContent = format(money.bank);
    document.getElementById('money-job').textContent = [money.job, money.grade].filter(Boolean).join(' · ');
    document.getElementById('money-job-row').hidden = !money.job;
  }

  function flash(kind, amount) {
    const element = document.getElementById('money-delta');
    if (!element || !amount) return;

    element.textContent = (amount > 0 ? '+ ' : '− ') + format(Math.abs(amount));
    element.className = 'money-delta ' + (amount > 0 ? 'gain' : 'loss') + ' on';
    element.dataset.kind = kind;
    clearTimeout(deltaTimer);
    deltaTimer = setTimeout(() => { element.className = 'money-delta'; }, DELTA_MS);
  }

  function update(data) {
    if (!data || typeof data !== 'object') return;

    if (data.hidden) {
      money = { ...EMPTY };
      lastShown = { cash: null, bank: null };
      paint();
      return;
    }

    const next = {
      cash: asNumber(data.cash),
      bank: asNumber(data.bank),
      job: String(data.job || '').slice(0, 40),
      grade: String(data.grade || '').slice(0, 40),
      hidden: false
    };

    const cashChanged = lastShown.cash !== null && next.cash !== null && next.cash !== lastShown.cash;
    const bankChanged = lastShown.bank !== null && next.bank !== null && next.bank !== lastShown.bank;
    if (cashChanged) flash('cash', next.cash - lastShown.cash);
    else if (bankChanged) flash('bank', next.bank - lastShown.bank);

    money = next;
    lastShown = { cash: next.cash, bank: next.bank };
    paint();
  }

  return { paint, update };
};

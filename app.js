(function () {
  'use strict';

  // Utils
  const pad2 = (n) => String(n).padStart(2, '0');

  function parseNumber(value) {
    if (value == null) return null;
    const trimmed = String(value).trim().replace(',', '.');
    if (trimmed === '') return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  }

  function parseTimeToSeconds(value) {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (trimmed === '') return null;
    const parts = trimmed.split(':').map((p) => p.trim());
    if (parts.some((p) => p === '' || isNaN(Number(p)))) return null;

    let hours = 0, minutes = 0, seconds = 0;
    if (parts.length === 3) {
      hours = Number(parts[0]);
      minutes = Number(parts[1]);
      seconds = Number(parts[2]);
    } else if (parts.length === 2) {
      minutes = Number(parts[0]);
      seconds = Number(parts[1]);
    } else if (parts.length === 1) {
      // tolker enkelt tal som minutter
      minutes = Number(parts[0]);
    } else {
      return null;
    }
    if (minutes >= 60 && parts.length === 2) {
      // tillad mm:ss over 59 minutter, men det er stadig ok
    }
    if (seconds >= 60 || minutes < 0 || hours < 0) return null;
    return hours * 3600 + minutes * 60 + seconds;
  }

  function formatSecondsToHMS(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '—';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (hours > 0) return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
    return `${pad2(minutes)}:${pad2(seconds)}`;
  }

  function formatSecondsToMinPerKm(secPerKm) {
    if (!Number.isFinite(secPerKm) || secPerKm <= 0) return '—';
    const minutes = Math.floor(secPerKm / 60);
    const seconds = Math.round(secPerKm % 60);
    return `${pad2(minutes)}:${pad2(seconds)}`;
  }

  function computeFromTwo({ distanceKm, timeSec, paceSecPerKm }) {
    // Returnerer et komplet sæt, eller null hvis utilstrækkeligt
    let d = distanceKm, t = timeSec, p = paceSecPerKm;
    const provided = [d != null, t != null, p != null].filter(Boolean).length;
    if (provided < 2) return null;

    if (d != null && t != null && (p == null || !Number.isFinite(p))) {
      if (d > 0) p = t / d; else p = null;
    } else if (d != null && p != null && (t == null || !Number.isFinite(t))) {
      t = d * p;
    } else if (t != null && p != null && (d == null || !Number.isFinite(d))) {
      if (p > 0) d = t / p; else d = null;
    }

    if (d == null || t == null || p == null) return null;
    if (!(d > 0) || !(t > 0) || !(p > 0)) return null;
    return { distanceKm: d, timeSec: t, paceSecPerKm: p };
  }

  function toSpeedKmH(paceSecPerKm) {
    if (!Number.isFinite(paceSecPerKm) || paceSecPerKm <= 0) return null;
    const kmPerSecond = 1 / paceSecPerKm;
    const kmPerHour = kmPerSecond * 3600;
    return kmPerHour;
  }

  function generateSplits(distanceKm, paceSecPerKm, intervalKm) {
    const splits = [];
    if (!Number.isFinite(distanceKm) || !Number.isFinite(paceSecPerKm) || distanceKm <= 0 || paceSecPerKm <= 0) return splits;
    if (!Number.isFinite(intervalKm) || intervalKm <= 0) intervalKm = 1;

    let currentKm = intervalKm;
    let elapsedSec = 0;
    while (currentKm < distanceKm - 1e-9) {
      elapsedSec = Math.round(currentKm * paceSecPerKm);
      splits.push({ km: currentKm, timeSec: elapsedSec });
      currentKm += intervalKm;
    }

    // Tilføj sidste split som præcis distance (kan være ikke-multipel)
    const totalSec = Math.round(distanceKm * paceSecPerKm);
    if (totalSec > 0) {
      splits.push({ km: distanceKm, timeSec: totalSec });
    }
    return splits;
  }

  // DOM refs
  const distanceInput = document.getElementById('distance');
  const timeInput = document.getElementById('time');
  const paceInput = document.getElementById('pace');
  const resetBtn = document.getElementById('resetBtn');
  const themeToggle = document.getElementById('themeToggle');

  const speedEl = document.getElementById('speed');
  const distanceOutEl = document.getElementById('distanceOut');
  const timeOutEl = document.getElementById('timeOut');
  const paceOutEl = document.getElementById('paceOut');

  const splitsEmptyEl = document.getElementById('splitsEmpty');
  const splitListEl = document.getElementById('splitList');
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));

  let splitIntervalKm = 1;
  let isProgrammaticUpdate = false;

  // Helpers til input parsing
  function readInputs() {
    const distanceKm = parseNumber(distanceInput.value);
    const timeSec = parseTimeToSeconds(timeInput.value);
    const paceSecPerKm = parseTimeToSeconds(paceInput.value);

    return { distanceKm, timeSec, paceSecPerKm };
  }

  function updateOutputs() {
    if (isProgrammaticUpdate) return;

    const { distanceKm, timeSec, paceSecPerKm } = readInputs();
    const values = { distanceKm, timeSec, paceSecPerKm };
    const providedCount = [distanceKm, timeSec, paceSecPerKm].filter((v) => v != null && Number.isFinite(v)).length;

    const result = computeFromTwo(values);

    // Udfyld manglende input når præcis to er angivet
    if (result && providedCount === 2) {
      isProgrammaticUpdate = true;
      try {
        if (distanceKm == null || !Number.isFinite(distanceKm)) {
          distanceInput.value = result.distanceKm.toFixed(2).replace('.', ',');
        } else if (timeSec == null || !Number.isFinite(timeSec)) {
          timeInput.value = formatSecondsToHMS(result.timeSec);
        } else if (paceSecPerKm == null || !Number.isFinite(paceSecPerKm)) {
          paceInput.value = formatSecondsToMinPerKm(result.paceSecPerKm);
        }
      } finally {
        isProgrammaticUpdate = false;
      }
    }

    if (!result) {
      distanceOutEl.textContent = '—';
      timeOutEl.textContent = '—';
      paceOutEl.textContent = '—';
      speedEl.textContent = '—';
      renderSplits(null, null);
      return;
    }

    const d = result.distanceKm;
    const t = result.timeSec;
    const p = result.paceSecPerKm;

    distanceOutEl.textContent = d.toFixed(2).replace('.', ',');
    timeOutEl.textContent = formatSecondsToHMS(t);
    paceOutEl.textContent = formatSecondsToMinPerKm(p);

    const speed = toSpeedKmH(p);
    speedEl.textContent = speed ? speed.toFixed(2).replace('.', ',') : '—';

    renderSplits(d, p);
  }

  function renderSplits(distanceKm, paceSecPerKm) {
    // Tom tilstand
    if (!Number.isFinite(distanceKm) || !Number.isFinite(paceSecPerKm)) {
      splitListEl.innerHTML = '';
      splitListEl.classList.add('hidden');
      splitsEmptyEl.classList.remove('hidden');
      return;
    }

    const splits = generateSplits(distanceKm, paceSecPerKm, splitIntervalKm);

    if (splits.length === 0) {
      splitListEl.innerHTML = '';
      splitListEl.classList.add('hidden');
      splitsEmptyEl.classList.remove('hidden');
      return;
    }

    const items = splits.map((s, idx) => {
      const kmText = s.km % 1 === 0 ? `${s.km.toFixed(0)} km` : `${s.km.toFixed(2)} km`;
      const timeText = formatSecondsToHMS(s.timeSec);
      return `
        <li class="flex items-center justify-between py-2 text-sm">
          <span class="text-gray-700">${idx === splits.length - 1 ? 'Mål' : kmText}</span>
          <span class="font-medium">${timeText}</span>
        </li>
      `;
    });

    splitListEl.innerHTML = items.join('');
    splitListEl.classList.remove('hidden');
    splitsEmptyEl.classList.add('hidden');
  }

  function resetAll() {
    distanceInput.value = '';
    timeInput.value = '';
    paceInput.value = '';
    updateOutputs();
    distanceInput.focus();
  }

  // Events
  ['input', 'change', 'blur'].forEach((evt) => {
    distanceInput.addEventListener(evt, updateOutputs);
    timeInput.addEventListener(evt, updateOutputs);
    paceInput.addEventListener(evt, updateOutputs);
  });

  resetBtn.addEventListener('click', resetAll);

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      splitIntervalKm = parseNumber(btn.getAttribute('data-interval')) || 1;
      tabButtons.forEach((b) => b.classList.remove('bg-white'));
      btn.classList.add('bg-white');
      updateOutputs();
    });
  });

  // Tema toggle (placeholder for fremtidig dark mode)
  themeToggle?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    // Kan udvides til at gemme præference i localStorage
  });

  // Init
  updateOutputs();
})();
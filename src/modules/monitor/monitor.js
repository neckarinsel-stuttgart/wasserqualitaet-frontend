import { Chart, registerables } from 'chart.js';
import { tooltip } from '../tooltip.js';

const iconBase = `${import.meta.env.BASE_URL}assets/icons/icons-small/`;
const chevronLeftIcon = `<img class="btn-icon" src="${iconBase}chevron-left.svg" width="16" height="16" alt="" aria-hidden="true">`;
const chevronRightIcon = `<img class="btn-icon" src="${iconBase}chevron-right.svg" width="16" height="16" alt="" aria-hidden="true">`;

Chart.register(...registerables);

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDMY(str) {
  const [d, m, y] = str.split('.');
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayFromISO(iso) {
  return parseInt(iso.split('-')[2]);
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchPlotData(year, month) {
  return fetch(`/api/plot-data.php?year=${year}&month=${month}`).then(r => r.json()).catch(() => null);
}

function filterRowsByMonth(rows, year, month) {
  return (rows || []).filter(row => {
    const d = new Date(row.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

// All days of a month, with plot-data merged in.
// Days without sensor data are stubs: { date: "YYYY-MM-DD" }.
function buildFullMonthDays(rows, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const rowMap = {};
  for (const row of rows) rowMap[row.date] = row;
  const result = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    result.push(rowMap[iso] ?? { date: iso });
  }
  return result;
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

function buildForecastMap(forecastData, allPredictions) {
  const map = {};
  // Populate 30-day history from allPredictions (older entries first)
  (allPredictions || []).forEach(p => {
    if (p.prediction_date && p.prediction != null)
      map[p.prediction_date] = p.prediction ? 'excellent' : 'poor';
  });
  // Today/tomorrow from forecastData override (most current — may be null if unavailable)
  const add = day => {
    if (day?.date && day?.waterquality) map[toISO(parseDMY(day.date))] = day.waterquality;
  };
  add(forecastData?.today);
  add(forecastData?.tomorrow);
  return map;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function getCalendarDays(year, month, forecastMap, todayISO) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const leadingCount = (firstDay.getDay() + 6) % 7;
  const trailingCount = (7 - ((leadingCount + daysInMonth) % 7)) % 7;
  const days = [];

  const prevLast = new Date(year, month - 1, 0).getDate();
  for (let i = leadingCount - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 2, prevLast - i), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const iso = toISO(date);
    days.push({ date, isCurrentMonth: true, iso, quality: forecastMap[iso] || null, isToday: iso === todayISO });
  }
  for (let d = 1; d <= trailingCount; d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: false });
  }
  return days;
}

function calendarHtml(data, days, selectedDate) {
  const headers = data.weekdays.map(d => `<span class="monitor__cal-header">${d}</span>`).join('');
  const cells = days.map(day => {
    if (!day.isCurrentMonth) {
      return `<button class="monitor__cal-day monitor__cal-day--other" disabled aria-hidden="true">${String(day.date.getDate()).padStart(2, '0')}</button>`;
    }
    const num = String(day.date.getDate()).padStart(2, '0');
    const classes = ['monitor__cal-day', day.quality ? `monitor__cal-day--${day.quality}` : '', day.iso === selectedDate ? 'monitor__cal-day--selected' : ''].filter(Boolean).join(' ');
    return `<button class="${classes}" data-date="${day.iso}" aria-label="${day.date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}">
      ${num}
      ${day.isToday ? '<span class="monitor__cal-dot" aria-label="heute"></span>' : ''}
    </button>`;
  }).join('');
  return `<div class="monitor__calendar"><div class="monitor__cal-grid">${headers}${cells}</div></div>`;
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function summaryHtml(data, quality) {
  const qualityLabel = quality ? (data.quality[quality]?.label ?? quality) : '–';
  const thresholdCards = data.thresholds.map(t => {
    const value = quality ? t[quality] : '–';
    return `<div class="monitor__threshold-card">
      <span class="monitor__threshold-label">${t.label}</span>
      <span class="monitor__threshold-value">${value}<span class="monitor__threshold-unit">${t.unit}</span></span>
    </div>`;
  }).join('');
  return `<div class="monitor__summary">
    <div class="monitor__quality-card" data-quality="${quality || ''}">
      <span class="monitor__quality-label">Wasserqualität</span>
      <span class="monitor__quality-value">${qualityLabel}</span>
    </div>
    ${thresholdCards}
  </div>`;
}

// ─── Chart ────────────────────────────────────────────────────────────────────

const selectionPlugin = {
  id: 'selectionBar',
  afterDraw(chart) {
    const idx = chart._selectedIndex;
    if (idx == null || !chart.data.labels?.length) return;
    const { ctx, chartArea, scales } = chart;
    const xScale = scales.x;
    if (!xScale) return;
    const x = xScale.getPixelForValue(idx);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  },
};

function formatChartDate(iso, data) {
  const d = new Date(iso + 'T12:00:00');
  const weekday = data.weekdays[(d.getDay() + 6) % 7];
  const month = data.monthNames[d.getMonth()];
  return `${weekday}, ${d.getDate()}. ${month}`;
}

function positionChartDate(container, chart, selectedIndex) {
  const dateEl = container.querySelector('.monitor__chart-date');
  if (!dateEl || !chart || selectedIndex == null) return;
  const xScale = chart.scales?.x;
  if (!xScale) return;
  const x = Math.round(xScale.getPixelForValue(selectedIndex));
  const wrapper = container.querySelector('.monitor__chart-wrapper');
  if (!wrapper) return;
  const half = dateEl.offsetWidth / 2;
  const canvasPad = 8; // matches padding: 0 8px on chart-wrapper
  const left = Math.max(half, Math.min(wrapper.clientWidth - half, x + canvasPad));
  dateEl.style.left = `${left}px`;
}

function buildChartDatasets(colDefs, colKeys, fullMonthDays, activeColumns) {
  const datasets = [];
  for (const key of colKeys) {
    const def = colDefs[key];
    if (!def || !activeColumns.has(key)) continue;
    const values = fullMonthDays.map(row => { const v = row[key]; return v != null ? v : null; });
    if (def.type === 'bar') {
      datasets.push({ label: key, type: 'bar', data: values, backgroundColor: def.color + '99', borderColor: def.color, borderWidth: 0, yAxisID: key, borderRadius: 2 });
    } else {
      datasets.push({ label: key, type: 'line', data: values, borderColor: def.color, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.4, spanGaps: true, yAxisID: key });
    }
  }
  return datasets;
}

function buildYAxes(colKeys, fullMonthDays, activeColumns) {
  const axes = { x: { display: false } };
  for (const key of colKeys) {
    if (!activeColumns.has(key)) continue;
    const values = fullMonthDays.map(r => r[key]).filter(v => v != null);
    if (!values.length) { axes[key] = { display: false }; continue; }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.15 || 1;
    axes[key] = { display: false, min: min - pad, max: max + pad };
  }
  return axes;
}

function buildChart(canvas, data, fullMonthDays, state) {
  const colDefs = data.messdaten.columns;
  const colKeys = Object.keys(colDefs);
  const labels = fullMonthDays.map((_, i) => i + 1);
  const datasets = buildChartDatasets(colDefs, colKeys, fullMonthDays, state.activeColumns);
  const scales = buildYAxes(colKeys, fullMonthDays, state.activeColumns);

  const chart = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { bottom: 22 } },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales,
      interaction: { mode: 'index', intersect: false },
    },
    plugins: [selectionPlugin],
  });
  chart._selectedIndex = state.selectedIndex;
  if (state.selectedIndex != null) chart.update('none');
  return chart;
}

// ─── Pills ────────────────────────────────────────────────────────────────────

function pillsHtml(data, activeColumns, fullMonthDays, selectedIndex) {
  const colDefs = data.messdaten.columns;
  return Object.entries(colDefs).map(([key, def]) => {
    const isActive = activeColumns.has(key);
    const row = fullMonthDays[selectedIndex];
    const rawVal = row?.[key];
    const valHtml = rawVal != null
      ? `${Number(rawVal).toFixed(1)}<span class="monitor__pill-unit">${def.unit ?? ''}</span>`
      : '–';
    return `<button class="monitor__pill${isActive ? ' monitor__pill--active' : ''}" data-col="${key}" type="button" style="--pill-color: ${def.color}">
      <span class="monitor__pill-label">${def.label}</span>
      <span class="monitor__pill-value" data-col-value="${key}">${valHtml}</span>
    </button>`;
  }).join('');
}

function updatePillValues(container, colDefs, fullMonthDays, selectedIndex) {
  const row = fullMonthDays[selectedIndex];
  container.querySelectorAll('[data-col-value]').forEach(el => {
    const key = el.dataset.colValue;
    const def = colDefs[key];
    const rawVal = row?.[key];
    if (rawVal != null) {
      el.innerHTML = `${Number(rawVal).toFixed(1)}<span class="monitor__pill-unit">${def.unit ?? ''}</span>`;
    } else {
      el.textContent = '–';
    }
  });
}

// ─── Render ───────────────────────────────────────────────────────────────────

let currentChart = null;
let currentInteractionAbort = null;

function render(container, data, lang, forecastData, state) {
  const { year, month, selectedDate, activeColumns, fullMonthDays, todayISO, currentYear, currentMonth, allPredictions } = state;
  const forecastMap = buildForecastMap(forecastData, allPredictions);
  state.forecastMap = forecastMap;
  const days = getCalendarDays(year, month, forecastMap, todayISO);
  state.selectedIndex = dayFromISO(selectedDate) - 1;

  const isViewingCurrentMonth = year === currentYear && month === currentMonth;
  const monthLabel = `${data.monthNames[month - 1]} ${year}`;

  container.innerHTML = `
    <section class="monitor">
      <div class="monitor__header">
        <h2 class="monitor__title">${data.title}</h2>
        <div class="monitor__month-nav">
          <button class="monitor__month-btn" data-dir="-1" aria-label="Vorheriger Monat">${chevronLeftIcon}</button>
          <span class="monitor__month-label">${monthLabel}</span>
          <button class="monitor__month-btn" data-dir="1" aria-label="Nächster Monat"${isViewingCurrentMonth ? ' disabled' : ''}>${chevronRightIcon}</button>
        </div>
      </div>

      <div class="monitor__panels">
        <div class="monitor__prognosen">
          <h3 class="monitor__panel-title">
            ${data.prognosen.title}
            ${tooltip(data.prognosen.tooltip, 'Info Prognosen')}
          </h3>
          ${summaryHtml(data.prognosen, forecastMap[selectedDate] ?? null)}
          ${calendarHtml(data, days, selectedDate)}
        </div>

        <div class="monitor__divider" aria-hidden="true"></div>

        <div class="monitor__messdaten">
          <h3 class="monitor__panel-title">
            ${data.messdaten.title}
            ${tooltip(data.messdaten.tooltip, 'Info Mess-Daten')}
          </h3>
          <div class="monitor__pills">
            ${pillsHtml(data, activeColumns, fullMonthDays, state.selectedIndex)}
          </div>
          <div class="monitor__chart-wrapper">
            <canvas class="monitor__chart"></canvas>
            <div class="monitor__chart-date">${formatChartDate(selectedDate, data)}</div>
          </div>
        </div>
      </div>

      <div class="monitor__links">
        <p class="monitor__links-heading">${data.links.heading}</p>
        <div class="monitor__links-row">
          ${data.links.items.map(item => `<a class="btn-m-outlined" href="${item.url}">${item.title}${chevronRightIcon}</a>`).join('')}
        </div>
      </div>
    </section>
  `;

  // Calendar clicks
  container.querySelectorAll('.monitor__cal-day[data-date]').forEach(btn => {
    btn.addEventListener('click', () => setSelectedDate(btn.dataset.date, 'calendar', container, data, state));
  });

  // Month navigation
  container.querySelectorAll('.monitor__month-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = parseInt(btn.dataset.dir);
      let { year: y, month: m } = state;
      m += dir;
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      state.year = y;
      state.month = m;
      fetchPlotData(y, m).then(plotData => {
        const rows = filterRowsByMonth(plotData?.rows, y, m);
        state.monthRows = rows;
        state.fullMonthDays = buildFullMonthDays(rows, y, m);
        const goingToCurrentMonth = y === state.currentYear && m === state.currentMonth;
        state.selectedDate = goingToCurrentMonth
          ? state.todayISO
          : `${y}-${String(m).padStart(2, '0')}-01`;
        render(container, data, lang, forecastData, state);
      });
    });
  });

  // Pills
  container.querySelectorAll('.monitor__pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.col;
      if (state.activeColumns.has(key)) {
        state.activeColumns.delete(key);
        btn.classList.remove('monitor__pill--active');
      } else {
        state.activeColumns.add(key);
        btn.classList.add('monitor__pill--active');
      }
      rebuildChart(container, data, state);
    });
  });

  // Build chart
  currentInteractionAbort?.abort();
  if (currentChart) { currentChart.destroy(); currentChart = null; }
  const canvas = container.querySelector('.monitor__chart');
  currentChart = buildChart(canvas, data, fullMonthDays, state);
  currentInteractionAbort = wireChartInteraction(canvas, currentChart, container, data, state);
  requestAnimationFrame(() => positionChartDate(container, currentChart, state.selectedIndex));
}

function setSelectedDate(date, source, container, data, state) {
  state.selectedDate = date;
  state.selectedIndex = dayFromISO(date) - 1;

  if (source !== 'chart' && currentChart) {
    currentChart._selectedIndex = state.selectedIndex;
    currentChart.update('none');
  }

  container.querySelectorAll('.monitor__cal-day--selected').forEach(el => el.classList.remove('monitor__cal-day--selected'));
  const cell = container.querySelector(`.monitor__cal-day[data-date="${date}"]`);
  if (cell) cell.classList.add('monitor__cal-day--selected');

  updatePillValues(container, data.messdaten.columns, state.fullMonthDays, state.selectedIndex);

  const dateEl = container.querySelector('.monitor__chart-date');
  if (dateEl) dateEl.textContent = formatChartDate(date, data);
  positionChartDate(container, currentChart, state.selectedIndex);

  const summaryEl = container.querySelector('.monitor__summary');
  if (summaryEl) {
    const quality = state.forecastMap?.[date] ?? null;
    summaryEl.outerHTML = summaryHtml(data.prognosen, quality);
  }
}

function rebuildChart(container, data, state) {
  const canvas = container.querySelector('.monitor__chart');
  if (!canvas) return;
  currentInteractionAbort?.abort();
  if (currentChart) currentChart.destroy();
  currentChart = buildChart(canvas, data, state.fullMonthDays, state);
  currentInteractionAbort = wireChartInteraction(canvas, currentChart, container, data, state);
  requestAnimationFrame(() => positionChartDate(container, currentChart, state.selectedIndex));
}

function wireChartInteraction(canvas, chart, container, data, state) {
  const abort = new AbortController();
  const { signal } = abort;
  let isDragging = false;

  function pickDate(e) {
    const points = chart.getElementsAtEventForMode(e, 'index', { intersect: false }, true);
    if (!points.length) return;
    const idx = points[0].index;
    const dayObj = state.fullMonthDays[idx];
    if (!dayObj) return;
    chart._selectedIndex = idx;
    chart.update('none');
    setSelectedDate(dayObj.date, 'chart', container, data, state);
  }

  canvas.addEventListener('mousemove', e => { if (isDragging) pickDate(e); }, { signal });
  canvas.addEventListener('click', pickDate, { signal });
  canvas.addEventListener('pointerdown', e => { isDragging = true; canvas.setPointerCapture(e.pointerId); pickDate(e); }, { signal });
  canvas.addEventListener('pointerup', () => { isDragging = false; }, { signal });
  canvas.addEventListener('pointercancel', () => { isDragging = false; }, { signal });

  return abort;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function init(container, data, lang, apiData, forecastData) {
  const { plotData, allPredictions } = apiData || {};
  const today = parseDMY(forecastData.today.date);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const todayISO = toISO(today);
  const monthRows = filterRowsByMonth(plotData?.rows, currentYear, currentMonth);
  const fullMonthDays = buildFullMonthDays(monthRows, currentYear, currentMonth);
  const activeColumns = new Set(
    Object.entries(data.messdaten.columns)
      .filter(([, def]) => def.defaultActive)
      .map(([key]) => key)
  );

  render(container, data, lang, forecastData, {
    year: currentYear,
    month: currentMonth,
    selectedDate: todayISO,
    selectedIndex: today.getDate() - 1,
    activeColumns,
    monthRows,
    fullMonthDays,
    todayISO,
    currentYear,
    currentMonth,
    allPredictions,
  });
}

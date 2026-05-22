(function(){
  const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney', 'America/Los_Angeles', 'Asia/Dubai'];

  function switchTabByName(tabName) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const pane = document.getElementById(tabName);
    if (pane) pane.classList.add('active');
    const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (btn) btn.classList.add('active');

    if (tabName === 'clock') initWorldClock();
    if (tabName === 'relative') {
      const rel = document.getElementById('relativeInput');
      if (rel) rel.value = new Date().toISOString().slice(0,16);
      updateRelativeTime();
    }
  }

  // Timestamp Converter
  function convertTimestamp() {
    const el = document.getElementById('timestampInput');
    if (!el) return;
    const input = el.value.trim();
    if (!input) {
      const out = document.getElementById('timestampOutput'); if (out) out.innerHTML = '';
      return;
    }

    let timestamp = parseFloat(input);
    let date;

    if (/^\d{10}$/.test(input)) {
      date = new Date(timestamp * 1000);
    } else if (/^\d{13}$/.test(input)) {
      date = new Date(timestamp);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
      date = new Date(input);
    } else {
      const out = document.getElementById('timestampOutput'); if (out) out.innerHTML = '<div style="color: #ff4444;">❌ Invalid format</div>';
      return;
    }

    if (isNaN(date.getTime())) {
      const out = document.getElementById('timestampOutput'); if (out) out.innerHTML = '<div style="color: #ff4444;">❌ Invalid date</div>';
      return;
    }

    const ms = date.getTime();
    const sec = Math.floor(ms / 1000);
    const out = document.getElementById('timestampOutput');
    if (!out) return;
    out.innerHTML = `\n      <div class="info-box">\n        <div class="info-box-label">ISO 8601</div>\n        <div class="info-box-value">${date.toISOString()}</div>\n      </div>\n      <div class="info-box">\n        <div class="info-box-label">Unix (seconds)</div>\n        <div class="info-box-value">${sec}</div>\n      </div>\n      <div class="info-box">\n        <div class="info-box-label">Unix (milliseconds)</div>\n        <div class="info-box-value">${ms}</div>\n      </div>\n      <div class="info-box">\n        <div class="info-box-label">Human Readable</div>\n        <div class="info-box-value">${date.toLocaleString()}</div>\n      </div>\n    `;
  }

  // World Clock
  function initWorldClock() {
    const tzConfig = document.getElementById('tzConfig');
    if (!tzConfig) return;
    let html = '<div class="button-group">';
    timezones.forEach((tz, i) => {
      html += `<button class="tz-btn" data-tz-index="${i}">${tz.split('/')[1]}</button>`;
    });
    html += '</div>';
    tzConfig.innerHTML = html;
    updateWorldClock();
    // ensure only one interval
    if (!window.__timeDateWorldClockInterval) {
      window.__timeDateWorldClockInterval = setInterval(updateWorldClock, 1000);
    }
  }

  function updateWorldClock() {
    const clock = document.getElementById('worldClock');
    if (!clock) return;
    let html = '';
    const now = new Date();
    timezones.forEach(tz => {
      const time = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(now);
      const offset = getTimezoneOffset(tz);
      const city = tz.split('/')[1].replace(/_/g, ' ');
      html += `\n        <div class="clock-box">\n          <div class="clock-time">${time}</div>\n          <div class="clock-zone">${city}</div>\n          <div class="clock-offset">${offset}</div>\n        </div>\n      `;
    });
    clock.innerHTML = html;
  }

  function getTimezoneOffset(tz) {
    const now = new Date();
    const utc = new Intl.DateTimeFormat('en-US', {timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}).format(now);
    const local = new Intl.DateTimeFormat('en-US', {timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}).format(now);
    const [utcH, utcM] = utc.split(':');
    const [locH, locM] = local.split(':');
    const diffHours = (parseInt(locH) - parseInt(utcH) + 24) % 24;
    const diffMins = (parseInt(locM) - parseInt(utcM) + 60) % 60;
    return `UTC${diffHours >= 0 ? '+' : ''}${diffHours}:${String(diffMins).padStart(2, '0')}`;
  }

  // Cron Expression Builder
  function updateCronExpression() {
    const minEl = document.getElementById('cronMin');
    const hourEl = document.getElementById('cronHour');
    if (!minEl || !hourEl) return;
    const min = minEl.value;
    const hour = hourEl.value;
    const minLabel = document.getElementById('cronMinLabel'); if (minLabel) minLabel.textContent = min || '*';
    const hourLabel = document.getElementById('cronHourLabel'); if (hourLabel) hourLabel.textContent = hour || '*';
    const expr = `${min || '*'} ${hour || '*'} * * *`;
    const exprEl = document.getElementById('cronExpression'); if (exprEl) exprEl.textContent = expr;
  }

  function setCronAll() {
    const minEl = document.getElementById('cronMin');
    const hourEl = document.getElementById('cronHour');
    if (minEl) minEl.value = 0;
    if (hourEl) hourEl.value = 0;
    updateCronExpression();
  }

  function copyCron() {
    const exprEl = document.getElementById('cronExpression');
    if (!exprEl) return;
    const expr = exprEl.textContent;
    navigator.clipboard.writeText(expr).then(()=>{
      try { alert('✓ Copied: ' + expr); } catch(e){}
    });
  }

  function parseCronExpression() {
    const el = document.getElementById('cronPaste'); if (!el) return;
    const input = el.value.trim();
    const out = document.getElementById('cronExplanation'); if (!out) return;
    if (!input) { out.innerHTML = ''; return; }
    const parts = input.split(' ');
    if (parts.length < 5) { out.innerHTML = '<div style="color: #ff4444;">❌ Invalid cron format</div>'; return; }
    const [min, hour, day, month, dow] = parts;
    let explanation = `\n      <div class="info-box">\n        <div class="info-box-label">Cron Expression</div>\n        <div class="info-box-value">${input}</div>\n      </div>\n      <div class="info-box">\n        <div class="info-box-label">Meaning</div>\n        <div class="info-box-value" style="font-size: 0.95rem;">\n          At ${hour === '*' ? 'every hour' : 'hour ' + hour} and minute ${min === '*' ? 'every' : min}<br>\n          On day ${day === '*' ? 'every' : day} of month ${month === '*' ? 'every' : month}\n        </div>\n      </div>\n    `;
    out.innerHTML = explanation;
  }

  // Date Math
  function calculateDateDiff(unit) {
    const d1El = document.getElementById('dateMath1');
    const d2El = document.getElementById('dateMath2');
    if (!d1El || !d2El) return;
    const d1 = new Date(d1El.value);
    const d2 = new Date(d2El.value);
    const out = document.getElementById('mathOutput'); if (!out) return;
    if (!d1.getTime() || !d2.getTime()) { out.innerHTML = '<div style="color: #ff4444;">❌ Select both dates</div>'; return; }
    const diffMs = Math.abs(d2 - d1);
    let result;
    switch(unit){
      case 'days': result = Math.floor(diffMs / (1000*60*60*24)); break;
      case 'weeks': result = Math.floor(diffMs / (1000*60*60*24*7)); break;
      case 'months': result = Math.floor(diffMs / (1000*60*60*24*30.44)); break;
      case 'years': result = Math.floor(diffMs / (1000*60*60*24*365.25)); break;
    }
    out.innerHTML = `\n      <div class="output-box">\n        Difference: <strong style="color: #00ff88; font-size: 1.2rem;">${result}</strong> ${unit}\n      </div>\n    `;
  }

  function calculateDuration() {
    const baseEl = document.getElementById('baseDate'); if (!baseEl) return;
    const amountEl = document.getElementById('durationAmount'); if (!amountEl) return;
    const unitEl = document.getElementById('durationUnit'); if (!unitEl) return;
    const out = document.getElementById('durationOutput'); if (!out) return;
    const base = new Date(baseEl.value);
    const amount = parseInt(amountEl.value || '0');
    const unit = unitEl.value;
    if (!base.getTime()) { out.innerHTML = '<div style="color: #ff4444;">❌ Select a date</div>'; return; }
    const result = new Date(base);
    switch(unit){
      case 'days': result.setDate(result.getDate() + amount); break;
      case 'weeks': result.setDate(result.getDate() + amount*7); break;
      case 'months': result.setMonth(result.getMonth() + amount); break;
      case 'years': result.setFullYear(result.getFullYear() + amount); break;
    }
    const sign = amount >= 0 ? '+' : '';
    out.innerHTML = `\n      <div class="output-box">\n        <div style="margin-bottom: 0.5rem;">${base.toDateString()} ${sign}${amount} ${unit}</div>\n        <strong style="color: #00ff88;">${result.toDateString()}</strong>\n      </div>\n    `;
  }

  // Relative Time
  function updateRelativeTime() {
    const inEl = document.getElementById('relativeInput'); if (!inEl) return;
    const input = inEl.value; if (!input) return;
    const date = new Date(input); const now = new Date(); const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000); const diffMin = Math.floor(diffSec / 60); const diffHour = Math.floor(diffMin / 60); const diffDay = Math.floor(diffHour / 24);
    let relative;
    if (diffSec < 0) {
      const futureMs = -diffMs; const futureDay = Math.floor(futureMs / (1000*60*60*24));
      if (futureDay === 0) relative = 'Today'; else if (futureDay === 1) relative = 'Tomorrow'; else relative = `In ${futureDay} days`;
    } else {
      if (diffSec < 60) relative = diffSec + ' seconds ago'; else if (diffMin < 60) relative = diffMin + ' minutes ago'; else if (diffHour < 24) relative = diffHour + ' hours ago'; else if (diffDay === 1) relative = 'Yesterday'; else relative = diffDay + ' days ago';
    }
    const out = document.getElementById('relativeOutput'); if (!out) return;
    out.innerHTML = `\n      <div class="info-box">\n        <div class="info-box-label">Relative Time</div>\n        <div class="info-box-value">${relative}</div>\n      </div>\n      <div class="info-box">\n        <div class="info-box-label">Absolute Time</div>\n        <div class="info-box-value">${date.toLocaleString()}</div>\n      </div>\n    `;
  }

  // Attach listeners helper
  function __attach_time_date_listeners() {
    // Tabs
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.getAttribute('data-tab');
        if (tab) switchTabByName(tab);
      });
    });

    // Close
    const close = document.getElementById('closeTimeDateBtn');
    if (close) close.addEventListener('click', () => {
      try { parent.postMessage({action: 'closeTimeDate'}, '*'); } catch(e) { window.close(); }
    });

    // Timestamp input
    const tsIn = document.getElementById('timestampInput'); if (tsIn) tsIn.addEventListener('input', convertTimestamp);

    // Cron controls
    const cronMin = document.getElementById('cronMin'); if (cronMin) cronMin.addEventListener('input', updateCronExpression);
    const cronHour = document.getElementById('cronHour'); if (cronHour) cronHour.addEventListener('input', updateCronExpression);
    const setAll = document.getElementById('setCronAllBtn'); if (setAll) setAll.addEventListener('click', setCronAll);
    const cronExpr = document.getElementById('cronExpression'); if (cronExpr) cronExpr.addEventListener('click', copyCron);
    const cronPaste = document.getElementById('cronPaste'); if (cronPaste) cronPaste.addEventListener('input', parseCronExpression);

    // Date math calc buttons
    document.querySelectorAll('.calc-btn[data-unit]').forEach(b => b.addEventListener('click', () => {
      const unit = b.getAttribute('data-unit'); if (unit) calculateDateDiff(unit);
    }));

    const calcDur = document.getElementById('calculateDurationBtn'); if (calcDur) calcDur.addEventListener('click', calculateDuration);

    // Relative input
    const relIn = document.getElementById('relativeInput'); if (relIn) relIn.addEventListener('input', updateRelativeTime);

    // World clock tz buttons (dynamic)
    document.getElementById('tzConfig')?.addEventListener('click', (e) => {
      const b = e.target.closest('.tz-btn');
      if (!b) return;
      const idx = b.getAttribute('data-tz-index');
      if (typeof idx !== 'undefined') {
        const i = parseInt(idx, 10);
        // rotate selected timezone to front
        if (!isNaN(i)) {
          const tz = timezones.splice(i,1)[0];
          timezones.unshift(tz);
          initWorldClock();
        }
      }
    });

    // ensure initial cron labels
    updateCronExpression();

    // set initial dates safely
    try { document.getElementById('baseDate').valueAsDate = new Date(); } catch(e){}
    try { document.getElementById('dateMath1').valueAsDate = new Date(); } catch(e){}
    try { document.getElementById('dateMath2').valueAsDate = new Date(); } catch(e){}
  }

  // Expose and auto-init
  window.__attach_time_date_listeners = __attach_time_date_listeners;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __attach_time_date_listeners);
  } else {
    __attach_time_date_listeners();
  }
})();

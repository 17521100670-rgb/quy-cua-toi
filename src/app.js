// Sổ Lệnh Quỹ: logic sổ tay chứng chỉ quỹ.
// Dữ liệu chỉ lưu trong localStorage trên máy người dùng, không gửi đi đâu.
// Phần tính toán thuần nằm trong SLQ để test được bằng Node:
//   node -e "const S=require('./app.js'); ..."
(function (root) {
  'use strict';

  var KEY = 'slq.v1';

  var SAMPLE_ORDERS = [
    { type: 'buy', fund: 'Quỹ mẫu A', date: '2026-09-05', amount: 5000000, nav: 12450 },
    { type: 'buy', fund: 'Quỹ mẫu B', date: '2026-09-12', amount: 10000000, nav: 18200 },
    { type: 'buy', fund: 'Quỹ mẫu A', date: '2026-10-03', amount: 3000000, nav: 13100 },
    { type: 'sell', fund: 'Quỹ mẫu A', date: '2026-10-20', amount: 1000000, nav: 13600 }
  ];
  var SAMPLE_NAVS = { 'Quỹ mẫu A': 13850, 'Quỹ mẫu B': 18430 };

  function round3(n) { return Math.round(n * 1000) / 1000; }

  function unitsOf(order) {
    if (!order || !order.nav || order.nav <= 0) return 0;
    return order.amount / order.nav;
  }

  function byDate(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }

  function fundsOf(orders) {
    var seen = {};
    orders.forEach(function (o) { seen[o.fund] = true; });
    return Object.keys(seen).sort();
  }

  // NAV hiệu lực của một quỹ tới cuối một ngày: NAV của lệnh gần nhất tới ngày đó,
  // ưu tiên NAV hiện tại do người dùng nhập khi tính cho tháng hiện tại.
  function navAt(orders, navs, fund, dateStr, useCurrent) {
    if (useCurrent && navs && navs[fund] > 0) return navs[fund];
    var nav = 0;
    orders.slice().sort(byDate).forEach(function (o) {
      if (o.fund === fund && o.date <= dateStr) nav = o.nav;
    });
    return nav;
  }

  function computePortfolio(orders, navs) {
    var per = {};
    orders.forEach(function (o) {
      var f = per[o.fund] || (per[o.fund] = { fund: o.fund, units: 0, invested: 0, lastNav: 0 });
      var u = unitsOf(o);
      if (o.type === 'buy') { f.units += u; f.invested += o.amount; }
      else { f.units -= u; f.invested -= o.amount; }
      f.lastNav = o.nav;
    });
    var rows = [];
    var totInvested = 0, totValue = 0;
    Object.keys(per).sort().forEach(function (name) {
      var f = per[name];
      var effNav = (navs && navs[name] > 0) ? navs[name] : f.lastNav;
      var value = f.units * effNav;
      var pl = value - f.invested;
      totInvested += f.invested;
      totValue += value;
      rows.push({
        fund: name,
        units: round3(f.units),
        invested: f.invested,
        nav: effNav,
        navIsManual: !!(navs && navs[name] > 0),
        value: Math.round(value),
        pl: Math.round(pl),
        plPct: f.invested !== 0 ? (pl / Math.abs(f.invested)) * 100 : 0
      });
    });
    return {
      rows: rows,
      invested: totInvested,
      value: Math.round(totValue),
      pl: Math.round(totValue - totInvested),
      plPct: totInvested !== 0 ? ((totValue - totInvested) / Math.abs(totInvested)) * 100 : 0
    };
  }

  function unitsHeld(orders, fund) {
    var u = 0;
    orders.forEach(function (o) {
      if (o.fund !== fund) return;
      u += o.type === 'buy' ? unitsOf(o) : -unitsOf(o);
    });
    return u;
  }

  function validateOrder(order, orders) {
    if (!order.fund || !order.fund.trim()) return 'Ghi tên quỹ trước.';
    if (!order.date) return 'Chọn ngày giao dịch.';
    if (!(order.amount > 0)) return 'Số tiền phải lớn hơn 0.';
    if (!(order.nav > 0)) return 'NAV phải lớn hơn 0.';
    if (order.type === 'sell') {
      var held = unitsHeld(orders, order.fund.trim());
      if (unitsOf(order) > held + 0.0005) {
        return 'Số CCQ bán vượt số đang nắm giữ (' + fmtUnits(held) + ' CCQ).';
      }
    }
    return '';
  }

  function monthKey(dateStr) { return dateStr.slice(0, 7); }

  function monthEnd(month) {
    var y = parseInt(month.slice(0, 4), 10);
    var m = parseInt(month.slice(5, 7), 10);
    var last = new Date(y, m, 0);
    return month + '-' + String(last.getDate()).padStart(2, '0');
  }

  function monthsBetween(fromMonth, toMonth) {
    var out = [];
    var y = parseInt(fromMonth.slice(0, 4), 10);
    var m = parseInt(fromMonth.slice(5, 7), 10);
    var ey = parseInt(toMonth.slice(0, 4), 10);
    var em = parseInt(toMonth.slice(5, 7), 10);
    while (y < ey || (y === ey && m <= em)) {
      out.push(y + '-' + String(m).padStart(2, '0'));
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    return out;
  }

  // Chuỗi tháng: tổng đã đầu tư lũy kế và giá trị danh mục cuối mỗi tháng.
  function monthlySeries(orders, navs, nowMonth) {
    if (!orders.length) return [];
    var sorted = orders.slice().sort(byDate);
    var from = monthKey(sorted[0].date);
    var to = nowMonth || monthKey(new Date().toISOString().slice(0, 10));
    return monthsBetween(from, to).map(function (month) {
      var end = monthEnd(month);
      var upto = sorted.filter(function (o) { return o.date <= end; });
      var invested = 0;
      upto.forEach(function (o) { invested += o.type === 'buy' ? o.amount : -o.amount; });
      var value = 0;
      fundsOf(upto).forEach(function (fund) {
        var units = 0;
        upto.forEach(function (o) {
          if (o.fund !== fund) return;
          units += o.type === 'buy' ? unitsOf(o) : -unitsOf(o);
        });
        var nav = navAt(upto, navs, fund, end, month === to);
        value += units * nav;
      });
      return { month: month, invested: invested, value: Math.round(value) };
    });
  }

  function fmtVND(n) {
    return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' đ';
  }

  function fmtUnits(n) {
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(n);
  }

  function fmtPct(n) {
    return (n >= 0 ? '+' : '') + n.toFixed(2).replace('.', ',') + '%';
  }

  function fmtCompact(n) {
    var a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' tỉ';
    if (a >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' tr';
    if (a >= 1e3) return (n / 1e3).toFixed(0) + ' nghìn';
    return String(Math.round(n));
  }

  function csvEscape(v) {
    var s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // Báo cáo tháng: lệnh trong tháng + tóm tắt theo quỹ + tổng.
  function monthReportCSV(orders, navs, month) {
    var rows = orders.filter(function (o) { return monthKey(o.date) === month; }).sort(byDate);
    var lines = [];
    lines.push(['Ngày', 'Loại', 'Quỹ', 'Số tiền (VND)', 'NAV (VND)', 'CCQ'].map(csvEscape).join(','));
    var buy = 0, sell = 0;
    rows.forEach(function (o) {
      lines.push([o.date, o.type === 'buy' ? 'Mua' : 'Bán', o.fund, o.amount, o.nav, round3(unitsOf(o))].map(csvEscape).join(','));
      if (o.type === 'buy') buy += o.amount; else sell += o.amount;
    });
    lines.push('');
    lines.push(['Quỹ', 'Số CCQ nắm giữ', 'Đã đầu tư (VND)', 'NAV hiện tại (VND)', 'Giá trị (VND)', 'Lãi lỗ (VND)'].map(csvEscape).join(','));
    var pf = computePortfolio(orders, navs);
    pf.rows.forEach(function (r) {
      lines.push([r.fund, r.units, r.invested, r.nav, r.value, r.pl].map(csvEscape).join(','));
    });
    lines.push('');
    lines.push(['Tổng mua trong tháng (VND)', buy].map(csvEscape).join(','));
    lines.push(['Tổng bán trong tháng (VND)', sell].map(csvEscape).join(','));
    lines.push(['Tổng đã đầu tư (VND)', pf.invested].map(csvEscape).join(','));
    lines.push(['Tổng giá trị hiện tại (VND)', pf.value].map(csvEscape).join(','));
    return '\uFEFF' + lines.join('\n');
  }

  var SLQ = {
    KEY: KEY, SAMPLE_ORDERS: SAMPLE_ORDERS, SAMPLE_NAVS: SAMPLE_NAVS,
    unitsOf: unitsOf, fundsOf: fundsOf, computePortfolio: computePortfolio,
    unitsHeld: unitsHeld, validateOrder: validateOrder, monthlySeries: monthlySeries,
    monthReportCSV: monthReportCSV, fmtVND: fmtVND, fmtUnits: fmtUnits,
    fmtPct: fmtPct, fmtCompact: fmtCompact, monthKey: monthKey
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SLQ;

  // ---- Phần giao diện (chỉ chạy trong trình duyệt) ----
  if (typeof document === 'undefined') return;

  function loadState() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function saveState(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* bộ nhớ đầy hoặc bị chặn */ }
  }

  function newId() {
    return 'o' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  }

  function seedSample() {
    return {
      orders: SAMPLE_ORDERS.map(function (o, i) {
        return { id: newId() + i, type: o.type, fund: o.fund, date: o.date, amount: o.amount, nav: o.nav };
      }),
      navs: Object.assign({}, SAMPLE_NAVS),
      sample: true,
      dismissedSample: false
    };
  }

  var state = loadState();
  if (!state) {
    state = seedSample();
    saveState(state);
  }

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function renderAll() { renderOrders(); renderPortfolio(); renderChart(); renderReport(); renderChrome(); }

  function renderChrome() {
    var n = state.orders.length;
    $('#order-count').textContent = n === 0 ? 'Chưa có lệnh nào.' : n + ' lệnh đã ghi.';
    $('#sample-badge').hidden = !state.sample;
    $('#btn-sample').hidden = state.sample || n > 0;
    $('#btn-clear-sample').hidden = !state.sample;
    var dl = $('#fund-list');
    dl.innerHTML = '';
    fundsOf(state.orders).forEach(function (f) {
      var opt = document.createElement('option');
      opt.value = f;
      dl.appendChild(opt);
    });
  }

  function renderOrders() {
    var body = $('#orders-body');
    var table = $('#orders-table');
    var empty = $('#orders-empty');
    var sorted = state.orders.slice().sort(byDate);
    table.hidden = sorted.length === 0;
    empty.hidden = sorted.length !== 0;
    body.innerHTML = '';
    sorted.forEach(function (o) {
      var tr = document.createElement('tr');
      var cells = [
        o.date,
        o.type === 'buy' ? 'Mua' : 'Bán',
        o.fund,
        fmtVND(o.amount),
        fmtVND(o.nav),
        fmtUnits(unitsOf(o))
      ];
      cells.forEach(function (c, i) {
        var td = document.createElement('td');
        if (i >= 3) td.className = 'num';
        td.textContent = c;
        tr.appendChild(td);
      });
      var tdDel = document.createElement('td');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--small btn--ghost';
      btn.textContent = 'Xóa';
      btn.setAttribute('aria-label', 'Xóa lệnh ' + o.fund + ' ngày ' + o.date);
      btn.addEventListener('click', function () {
        state.orders = state.orders.filter(function (x) { return x.id !== o.id; });
        if (state.orders.length === 0) state.sample = false;
        saveState(state);
        renderAll();
      });
      tdDel.appendChild(btn);
      tr.appendChild(tdDel);
      body.appendChild(tr);
    });
  }

  function renderPortfolio() {
    var pf = computePortfolio(state.orders, state.navs);
    $('#total-invested').textContent = fmtVND(pf.invested);
    $('#total-value').textContent = fmtVND(pf.value);
    var plEl = $('#total-pl');
    plEl.textContent = fmtVND(pf.pl) + ' (' + fmtPct(pf.plPct) + ')';
    plEl.classList.toggle('is-negative', pf.pl < 0);
    var table = $('#portfolio-table');
    var empty = $('#portfolio-empty');
    var alloc = $('#allocation');
    table.hidden = pf.rows.length === 0;
    empty.hidden = pf.rows.length !== 0;
    alloc.hidden = pf.rows.length === 0 || pf.value <= 0;
    var body = $('#portfolio-body');
    body.innerHTML = '';
    pf.rows.forEach(function (r) {
      var tr = document.createElement('tr');
      var tdFund = document.createElement('td');
      tdFund.textContent = r.fund;
      tr.appendChild(tdFund);
      [[fmtUnits(r.units)], [fmtVND(r.invested)], [], [fmtVND(r.value)], [fmtVND(r.pl) + ' (' + fmtPct(r.plPct) + ')']].forEach(function (pair, i) {
        var td = document.createElement('td');
        td.className = 'num';
        if (i === 2) {
          var input = document.createElement('input');
          input.type = 'number';
          input.min = '0.01';
          input.step = '0.01';
          input.inputMode = 'decimal';
          input.value = r.nav;
          input.setAttribute('aria-label', 'NAV hiện tại của ' + r.fund);
          if (!r.navIsManual) input.classList.add('nav--auto');
          input.title = r.navIsManual ? 'NAV do bạn nhập' : 'Đang dùng NAV của lệnh gần nhất, nhập số mới để cập nhật';
          input.addEventListener('change', function () {
            var v = parseFloat(input.value);
            if (v > 0) { state.navs[r.fund] = v; saveState(state); renderAll(); }
            else { input.value = r.nav; }
          });
          td.appendChild(input);
        } else {
          td.textContent = pair[0];
        }
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    if (pf.value > 0) {
      alloc.innerHTML = '';
      pf.rows.forEach(function (r) {
        var share = (r.value / pf.value) * 100;
        var row = document.createElement('div');
        row.className = 'alloc-row';
        var label = document.createElement('span');
        label.className = 'alloc-label';
        label.textContent = r.fund;
        var bar = document.createElement('span');
        bar.className = 'alloc-bar';
        var fill = document.createElement('span');
        fill.className = 'alloc-fill';
        fill.style.width = Math.max(share, 1.5) + '%';
        bar.appendChild(fill);
        var pct = document.createElement('span');
        pct.className = 'alloc-pct num';
        pct.textContent = share.toFixed(1).replace('.', ',') + '%';
        row.appendChild(label);
        row.appendChild(bar);
        row.appendChild(pct);
        alloc.appendChild(row);
      });
    }
  }

  function renderChart() {
    var canvas = $('#chart');
    var empty = $('#chart-empty');
    var legend = $('#chart-legend');
    var nowMonth = new Date().toISOString().slice(0, 10).slice(0, 7);
    var series = monthlySeries(state.orders, state.navs, nowMonth);
    var hasData = series.length > 0;
    canvas.hidden = !hasData;
    legend.hidden = !hasData;
    empty.hidden = hasData;
    if (!hasData) return;
    var dpr = window.devicePixelRatio || 1;
    var W = 640, H = 320;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    var padL = 64, padR = 16, padT = 16, padB = 32;
    var max = 0;
    series.forEach(function (p) { max = Math.max(max, p.invested, p.value); });
    if (max === 0) max = 1;
    max = max * 1.1;
    var xAt = function (i) {
      return series.length === 1 ? padL + (W - padL - padR) / 2 : padL + (i * (W - padL - padR)) / (series.length - 1);
    };
    var yAt = function (v) { return padT + (1 - v / max) * (H - padT - padB); };
    var ink = cssVar('--color-ink', '#222');
    var muted = cssVar('--color-muted', '#666');
    var rule = cssVar('--color-rule', '#ccc');
    var accent = cssVar('--color-accent', '#2e7d5b');
    ctx.font = '12px "DM Mono", monospace';
    ctx.fillStyle = muted;
    ctx.strokeStyle = rule;
    ctx.lineWidth = 1;
    var steps = 4;
    for (var g = 0; g <= steps; g++) {
      var v = (max / 1.1) * (g / steps);
      var y = yAt(v);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(fmtCompact(v), padL - 8, y + 4);
    }
    ctx.textAlign = 'center';
    series.forEach(function (p, i) {
      ctx.fillText(p.month.slice(5) + '/' + p.month.slice(2, 4), xAt(i), H - 10);
    });
    function line(key, color, dash) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dash || []);
      series.forEach(function (p, i) {
        var x = xAt(i), y = yAt(p[key]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      series.forEach(function (p, i) {
        ctx.beginPath();
        ctx.arc(xAt(i), yAt(p[key]), 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    line('invested', muted, [5, 4]);
    line('value', accent, []);
    void ink;
  }

  function currentMonthInput() {
    var el = $('#f-month');
    if (!el.value) el.value = new Date().toISOString().slice(0, 10).slice(0, 7);
    return el.value;
  }

  function renderReport() {
    var month = currentMonthInput();
    var rows = state.orders.filter(function (o) { return monthKey(o.date) === month; }).sort(byDate);
    var table = $('#report-table');
    var empty = $('#report-empty');
    table.hidden = rows.length === 0;
    empty.hidden = rows.length !== 0;
    var body = $('#report-body');
    body.innerHTML = '';
    var buy = 0, sell = 0;
    rows.forEach(function (o) {
      var tr = document.createElement('tr');
      [o.date, o.type === 'buy' ? 'Mua' : 'Bán', o.fund, fmtVND(o.amount), fmtVND(o.nav), fmtUnits(unitsOf(o))].forEach(function (c, i) {
        var td = document.createElement('td');
        if (i >= 3) td.className = 'num';
        td.textContent = c;
        tr.appendChild(td);
      });
      body.appendChild(tr);
      if (o.type === 'buy') buy += o.amount; else sell += o.amount;
    });
    $('#report-buy').textContent = fmtVND(buy);
    $('#report-sell').textContent = fmtVND(sell);
  }

  // Tabs
  $$('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      $$('.tab').forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      $$('.panel').forEach(function (p) { p.classList.remove('is-active'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById(tab.dataset.tab).classList.add('is-active');
      if (tab.dataset.tab === 'panel-chart') renderChart();
    });
  });

  // Form ghi lệnh
  var form = $('#order-form');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var errEl = $('#form-error');
    var order = {
      id: newId(),
      type: form.querySelector('input[name="type"]:checked').value,
      fund: $('#f-fund').value.trim(),
      date: $('#f-date').value,
      amount: parseFloat($('#f-amount').value),
      nav: parseFloat($('#f-nav').value)
    };
    var err = validateOrder(order, state.orders);
    if (err) {
      errEl.textContent = err;
      errEl.hidden = false;
      return;
    }
    errEl.hidden = true;
    state.orders.push(order);
    if (state.sample) state.sample = false;
    saveState(state);
    form.reset();
    var today = new Date().toISOString().slice(0, 10);
    $('#f-date').value = today;
    renderAll();
  });

  $('#f-date').value = new Date().toISOString().slice(0, 10);

  $('#btn-sample').addEventListener('click', function () {
    state = seedSample();
    saveState(state);
    renderAll();
  });
  $('#btn-clear-sample').addEventListener('click', function () {
    state = { orders: [], navs: {}, sample: false, dismissedSample: true };
    saveState(state);
    renderAll();
  });
  $('#btn-wipe').addEventListener('click', function () {
    if (!window.confirm('Xóa hết lệnh trong sổ? Hành động này không hoàn lại. Hãy xuất file CSV trước nếu cần giữ bản sao.')) return;
    state = { orders: [], navs: {}, sample: false, dismissedSample: true };
    saveState(state);
    renderAll();
  });
  $('#f-month').addEventListener('change', renderReport);
  $('#btn-csv').addEventListener('click', function () {
    var month = currentMonthInput();
    var csv = monthReportCSV(state.orders, state.navs, month);
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bao-cao-' + month + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  renderAll();
})(typeof window !== 'undefined' ? window : this);

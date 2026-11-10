// Quỹ Của Tôi: logic sổ tay chứng chỉ quỹ.
// Dữ liệu chỉ lưu trong localStorage trên máy người dùng, không gửi đi đâu.
// Phần tính toán thuần nằm trong QCT để test được bằng Node:
//   node -e "const Q=require('./app.js'); ..."
(function (root) {
  'use strict';

  // Key localStorage giữ nguyên từ v1 để dữ liệu người dùng cũ không mất
  // (cùng origin, key cũ vẫn đọc được sau khi đổi tên).
  var KEY = 'slq.v1';

  var SAMPLE_ORDERS = [
    { type: 'buy', fund: 'Quỹ mẫu A', date: '2026-09-05', amount: 5000000, nav: 12450 },
    { type: 'buy', fund: 'Quỹ mẫu B', date: '2026-09-12', amount: 10000000, nav: 18200 },
    { type: 'buy', fund: 'Quỹ mẫu A', date: '2026-10-03', amount: 3000000, nav: 13100 },
    { type: 'sell', fund: 'Quỹ mẫu A', date: '2026-10-20', amount: 1000000, nav: 13600 }
  ];
  var SAMPLE_NAVS = { 'Quỹ mẫu A': 13850, 'Quỹ mẫu B': 18430 };

  // ---- Danh sách quỹ mở (22 quỹ, chỉ giúp gõ nhanh, không phải gợi ý mua) ----
  // Nguồn: bảng danh sách quỹ mở của Mirae Asset (báo cáo 06-08/2026) và
  // Fmarket. Tên VinaCapital theo tên mới sau đợt đổi tên 06/2026, kèm tên cũ
  // làm alias để người dùng vẫn tìm được theo tên cũ.
  var FUNDS = [
    { code: 'VESAF', manager: 'VinaCapital', name: 'Quỹ Đầu tư Cổ phiếu Tăng trưởng Chiến lược VinaCapital', type: 'Cổ phiếu', aliases: ['Tiếp cận Thị trường'] },
    { code: 'VEOF', manager: 'VinaCapital', name: 'Quỹ Đầu tư Cổ phiếu Doanh nghiệp Hàng đầu VinaCapital', type: 'Cổ phiếu', aliases: ['Hưng Thịnh'] },
    { code: 'DCDS', manager: 'Dragon Capital', name: 'Quỹ Đầu tư Chứng khoán Năng động DC', type: 'Cổ phiếu', aliases: [] },
    { code: 'SSISCA', manager: 'SSIAM', name: 'Quỹ Đầu tư Lợi thế Cạnh tranh Bền vững SSI', type: 'Cổ phiếu', aliases: [] },
    { code: 'VCBF-BCF', manager: 'VCBF', name: 'Quỹ Đầu tư Cổ phiếu Hàng đầu VCBF', type: 'Cổ phiếu', aliases: [] },
    { code: 'VCBF-MGF', manager: 'VCBF', name: 'Quỹ Đầu tư Cổ phiếu Tăng trưởng VCBF', type: 'Cổ phiếu', aliases: [] },
    { code: 'BVFED', manager: 'Bảo Việt Fund', name: 'Quỹ Đầu tư Cổ phiếu Năng động Bảo Việt', type: 'Cổ phiếu', aliases: [] },
    { code: 'MAGEF', manager: 'Mirae Asset', name: 'Quỹ Đầu tư Cổ phiếu Tăng trưởng Mirae Asset Việt Nam', type: 'Cổ phiếu', aliases: [] },
    { code: 'MAFEQI', manager: 'Manulife Investment', name: 'Quỹ Đầu tư Cổ phiếu Manulife', type: 'Cổ phiếu', aliases: [] },
    { code: 'MBVF', manager: 'MB Capital', name: 'Quỹ Đầu tư Giá trị MB Capital', type: 'Cổ phiếu', aliases: [] },
    { code: 'BMFF', manager: 'MB Capital', name: 'Quỹ Đầu tư Tăng trưởng Bordier - MB Flagship', type: 'Cổ phiếu', aliases: [] },
    { code: 'VMEEF', manager: 'VinaCapital', name: 'Quỹ Đầu tư Cổ phiếu Kinh tế Hiện đại VinaCapital', type: 'Cổ phiếu', aliases: [] },
    { code: 'VIBF', manager: 'VinaCapital', name: 'Quỹ Đầu tư Cân bằng Gắn kết VinaCapital', type: 'Cân bằng', aliases: ['Cân bằng Tuệ Sáng'] },
    { code: 'VCBF-TBF', manager: 'VCBF', name: 'Quỹ Đầu tư Cân bằng Chiến thuật VCBF', type: 'Cân bằng', aliases: [] },
    { code: 'DCBC', manager: 'Dragon Capital', name: 'Quỹ Đầu tư Cân bằng Chiến lược DC', type: 'Cân bằng', aliases: [] },
    { code: 'VFF', manager: 'VinaCapital', name: 'Quỹ Đầu tư Trái phiếu Nâng cao VinaCapital', type: 'Trái phiếu', aliases: ['Trái phiếu Bảo Thịnh'] },
    { code: 'DCBF', manager: 'Dragon Capital', name: 'Quỹ Đầu tư Trái phiếu DC', type: 'Trái phiếu', aliases: [] },
    { code: 'SSIBF', manager: 'SSIAM', name: 'Quỹ Đầu tư Trái phiếu SSI', type: 'Trái phiếu', aliases: [] },
    { code: 'VCBF-FIF', manager: 'VCBF', name: 'Quỹ Đầu tư Trái phiếu VCBF', type: 'Trái phiếu', aliases: [] },
    { code: 'BVBF', manager: 'Bảo Việt Fund', name: 'Quỹ Đầu tư Trái phiếu Bảo Việt', type: 'Trái phiếu', aliases: [] },
    { code: 'VNDBF', manager: 'VNDIRECT', name: 'Quỹ Đầu tư Trái phiếu VND', type: 'Trái phiếu', aliases: [] },
    { code: 'MBBOND', manager: 'MB Capital', name: 'Quỹ Đầu tư Trái phiếu MB', type: 'Trái phiếu', aliases: [] }
  ];

  function normalizeCode(s) {
    return String(s || '').toUpperCase().replace(/[\s\-]+/g, '');
  }

  function fundDisplay(f) { return f.code + ' - ' + f.name; }

  // Chuẩn hoá tên quỹ về dạng chuẩn "MÃ - Tên đầy đủ" khi khớp mã, tên đầy đủ
  // hoặc tên cũ (alias). Không khớp thì giữ nguyên như người dùng gõ.
  function canonicalFund(input) {
    var raw = String(input || '').trim();
    if (!raw) return raw;
    var norm = normalizeCode(raw);
    for (var i = 0; i < FUNDS.length; i++) {
      var f = FUNDS[i];
      if (norm === normalizeCode(f.code)) return fundDisplay(f);
      if (norm === normalizeCode(f.name)) return fundDisplay(f);
      for (var j = 0; j < f.aliases.length; j++) {
        if (norm === normalizeCode(f.aliases[j])) return fundDisplay(f);
      }
    }
    return raw;
  }

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

  function todayStr() { return new Date().toISOString().slice(0, 10); }

  function daysBetween(d0, d1) {
    return Math.round((Date.parse(d1) - Date.parse(d0)) / 86400000);
  }

  function fmtDateDM(s) { return s.slice(8, 10) + '/' + s.slice(5, 7); }
  function fmtDateDMY(s) { return s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4); }

  function fmtPeriod(start, end) {
    if (!start || !end) return '';
    if (start.slice(0, 4) === end.slice(0, 4)) return fmtDateDM(start) + ' đến ' + fmtDateDMY(end);
    return fmtDateDMY(start) + ' đến ' + fmtDateDMY(end);
  }

  function fmtXirr(rate) {
    if (rate == null || !isFinite(rate)) return '—';
    var pct = rate * 100;
    return (pct >= 0 ? '+' : '') + pct.toFixed(2).replace('.', ',') + '%/năm';
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

  // ---- Ngày NAV và XIRR ----
  function latestOrderDate(orders, fund) {
    var d = null;
    orders.forEach(function (o) {
      if (fund && o.fund !== fund) return;
      if (!d || o.date > d) d = o.date;
    });
    return d;
  }

  // Ngày của NAV đang dùng cho một quỹ: ngày người dùng nhập NAV gần nhất,
  // nếu chưa nhập tay thì ngày của lệnh gần nhất của quỹ đó.
  function navDateOf(orders, navDates, fund) {
    if (navDates && navDates[fund]) return navDates[fund];
    return latestOrderDate(orders, fund);
  }

  function unitsAsOf(orders, fund, dateStr) {
    var u = 0;
    orders.forEach(function (o) {
      if (o.fund !== fund || o.date > dateStr) return;
      u += o.type === 'buy' ? unitsOf(o) : -unitsOf(o);
    });
    return u;
  }

  function effNavAsOf(orders, navs, fund, dateStr) {
    if (navs && navs[fund] > 0) return navs[fund];
    var last = 0;
    orders.slice().sort(byDate).forEach(function (o) {
      if (o.fund === fund && o.date <= dateStr) last = o.nav;
    });
    return last;
  }

  function xirrNpv(cfs, r, d0) {
    var s = 0;
    for (var i = 0; i < cfs.length; i++) {
      var t = daysBetween(d0, cfs[i].date) / 365;
      s += cfs[i].amount / Math.pow(1 + r, t);
    }
    return s;
  }

  function xirrNpvPrime(cfs, r, d0) {
    var s = 0;
    for (var i = 0; i < cfs.length; i++) {
      var t = daysBetween(d0, cfs[i].date) / 365;
      s += cfs[i].amount * (-t) / Math.pow(1 + r, t + 1);
    }
    return s;
  }

  // Giải XIRR (money-weighted return) bằng Newton-Raphson, dự phòng bisection.
  // cfs: [{date, amount}] với mua âm, bán dương, giá trị hiện tại dương cuối kỳ.
  // Trả {rate, start, end} hoặc null khi vô nghiệm (dòng tiền cùng dấu).
  function solveXirr(cfs) {
    if (!cfs || cfs.length === 0) return null;
    var sorted = cfs.slice().sort(byDate);
    var d0 = sorted[0].date;
    var hasNeg = false, hasPos = false;
    sorted.forEach(function (cf) { if (cf.amount < 0) hasNeg = true; if (cf.amount > 0) hasPos = true; });
    if (!hasNeg || !hasPos) return null;
    var r = 0.10, converged = false;
    for (var i = 0; i < 100; i++) {
      var f = xirrNpv(sorted, r, d0);
      var d = xirrNpvPrime(sorted, r, d0);
      if (!isFinite(f) || !isFinite(d) || Math.abs(d) < 1e-12) break;
      var step = f / d;
      r -= step;
      if (r <= -0.999999) { r = -0.999999; break; }
      if (Math.abs(step) < 1e-12) { converged = true; break; }
    }
    if (converged && isFinite(r)) return { rate: r, start: d0, end: sorted[sorted.length - 1].date };
    var lo = -0.99, hi = 10;
    var flo = xirrNpv(sorted, lo, d0), fhi = xirrNpv(sorted, hi, d0);
    if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return null;
    for (var j = 0; j < 200; j++) {
      var mid = (lo + hi) / 2;
      var fm = xirrNpv(sorted, mid, d0);
      if (!isFinite(fm)) return null;
      if (Math.abs(fm) < 1e-9) return { rate: mid, start: d0, end: sorted[sorted.length - 1].date };
      if (flo * fm < 0) { hi = mid; } else { lo = mid; flo = fm; }
    }
    return { rate: (lo + hi) / 2, start: d0, end: sorted[sorted.length - 1].date };
  }

  // XIRR một quỹ: dòng tiền mua/bán tới ngày NAV mới nhất + giá trị hiện tại.
  function xirrForFund(orders, navs, navDates, fund) {
    var vDate = navDateOf(orders, navDates, fund);
    if (!vDate) return null;
    var cfs = [];
    orders.forEach(function (o) {
      if (o.fund !== fund || o.date > vDate) return;
      cfs.push({ date: o.date, amount: o.type === 'buy' ? -o.amount : o.amount });
    });
    if (!cfs.length) return null;
    var value = unitsAsOf(orders, fund, vDate) * effNavAsOf(orders, navs, fund, vDate);
    if (value > 0) cfs.push({ date: vDate, amount: value });
    return solveXirr(cfs);
  }

  // XIRR toàn danh mục: gộp mọi dòng tiền, ngày định giá là ngày NAV mới nhất.
  function xirrPortfolio(orders, navs, navDates) {
    if (!orders.length) return null;
    var funds = fundsOf(orders);
    var vDate = null;
    funds.forEach(function (f) {
      var d = navDateOf(orders, navDates, f);
      if (d && (!vDate || d > vDate)) vDate = d;
    });
    if (!vDate) return null;
    var cfs = [];
    var value = 0;
    orders.forEach(function (o) {
      if (o.date > vDate) return;
      cfs.push({ date: o.date, amount: o.type === 'buy' ? -o.amount : o.amount });
    });
    funds.forEach(function (f) {
      value += unitsAsOf(orders, f, vDate) * effNavAsOf(orders, navs, f, vDate);
    });
    if (!cfs.length) return null;
    if (value > 0) cfs.push({ date: vDate, amount: value });
    return solveXirr(cfs);
  }

  // Số ngày từ ngày NAV tới hôm nay (null khi chưa có ngày NAV).
  function navAgeDays(orders, navDates, fund, today) {
    var d = navDateOf(orders, navDates, fund);
    if (!d) return null;
    return daysBetween(d, today || todayStr());
  }

  function goalProgress(value, goal) {
    if (!goal || goal <= 0) return null;
    return { pct: (value / goal) * 100, reached: value >= goal };
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

  // ---- Nhập CSV hàng loạt ----
  function splitCSVLine(line, delim) {
    var out = [], cur = '', inQ = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (inQ) {
        if (c === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; }
        } else { cur += c; }
      } else if (c === '"') { inQ = true; }
      else if (c === delim) { out.push(cur); cur = ''; }
      else { cur += c; }
    }
    out.push(cur);
    return out.map(function (s) { return s.trim(); });
  }

  function detectDelimiter(firstLine) {
    var commas = (firstLine.match(/,/g) || []).length;
    var semis = (firstLine.match(/;/g) || []).length;
    return semis > commas ? ';' : ',';
  }

  var CSV_HEADERS = {
    date: ['ngày', 'ngay', 'date', 'ngày giao dịch', 'thời gian'],
    fund: ['quỹ', 'quy', 'fund', 'mã', 'mã quỹ', 'tên quỹ'],
    type: ['loại', 'loai', 'type', 'mua/bán', 'giao dịch'],
    amount: ['số tiền', 'so tien', 'tiền', 'tien', 'amount', 'giá trị', 'số tiền (vnd)'],
    nav: ['nav', 'nav lúc giao dịch', 'giá', 'gia', 'đơn giá', 'nav/ccq']
  };

  function headerRole(h) {
    var n = String(h || '').trim().toLowerCase();
    var roles = ['date', 'fund', 'type', 'amount', 'nav'];
    for (var i = 0; i < roles.length; i++) {
      var keys = CSV_HEADERS[roles[i]];
      for (var j = 0; j < keys.length; j++) {
        if (n === keys[j] || n.indexOf(keys[j]) !== -1) return roles[i];
      }
    }
    return '';
  }

  function parseCSVText(text) {
    var lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
      .map(function (l) { return l.trim(); }).filter(function (l) { return l.length > 0; });
    if (!lines.length) return { headers: null, rows: [], delim: ',' };
    var delim = detectDelimiter(lines[0]);
    var grid = lines.map(function (l) { return splitCSVLine(l, delim); });
    var first = grid[0];
    var hasHeader = first.some(function (c) { return headerRole(c) !== ''; });
    return { headers: hasHeader ? first : null, rows: hasHeader ? grid.slice(1) : grid, delim: delim };
  }

  // Số kiểu Việt Nam: 5.000.000 (chấm phân cách nghìn), 12,5 (phẩy thập phân),
  // 5,000,000 (phẩy phân cách nghìn kiểu Mỹ), 12450.5.
  function parseVNNumber(s) {
    if (s == null) return null;
    var t = String(s).trim().replace(/\u00A0/g, '').replace(/\s+/g, '');
    if (!t) return null;
    var neg = false;
    if (t.charAt(0) === '-') { neg = true; t = t.slice(1); }
    if (t.charAt(0) === '(' && t.charAt(t.length - 1) === ')') { neg = true; t = t.slice(1, -1); }
    var v = null;
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) v = parseFloat(t.replace(/\./g, '').replace(',', '.'));
    else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) v = parseFloat(t.replace(/,/g, ''));
    else if (/^\d+,\d+$/.test(t)) v = parseFloat(t.replace(',', '.'));
    else if (/^\d+(\.\d+)?$/.test(t)) v = parseFloat(t);
    if (v == null || !isFinite(v)) return null;
    return neg ? -v : v;
  }

  function validDate(y, mo, d) {
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  // Chấp nhận YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY.
  function parseDateFlex(s) {
    var t = String(s || '').trim();
    if (!t) return null;
    var m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return validDate(+m[1], +m[2], +m[3]);
    m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return validDate(+m[3], +m[2], +m[1]);
    m = t.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) return validDate(+m[3], +m[2], +m[1]);
    m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) return validDate(+m[3], +m[2], +m[1]);
    return null;
  }

  function parseTypeFlex(s) {
    var n = String(s || '').trim().toLowerCase();
    if (['mua', 'buy', 'm', 'b', 'mua vào', 'mua vao'].indexOf(n) !== -1) return 'buy';
    if (['bán', 'ban', 'sell', 's', 'bán ra', 'ban ra'].indexOf(n) !== -1) return 'sell';
    return null;
  }

  function looksDate(s) { return parseDateFlex(s) !== null; }
  function looksType(s) {
    var n = String(s || '').trim().toLowerCase();
    return ['mua', 'bán', 'ban', 'buy', 'sell', 'm', 'b', 's'].indexOf(n) !== -1;
  }

  // Đoán vai trò từng cột từ tiêu đề, nếu không có tiêu đề thì từ nội dung.
  // Số tiền và NAV không tự đoán được khi thiếu tiêu đề, để người dùng gán tay.
  function guessMapping(parsed) {
    var ncols = 0;
    parsed.rows.forEach(function (r) { ncols = Math.max(ncols, r.length); });
    var mapping = [];
    for (var c = 0; c < ncols; c++) {
      var role = '';
      if (parsed.headers && parsed.headers[c]) role = headerRole(parsed.headers[c]);
      if (!role) {
        var vals = parsed.rows.map(function (r) { return r[c] || ''; }).filter(function (v) { return v !== ''; });
        if (vals.length && vals.every(looksDate)) role = 'date';
        else if (vals.length && vals.every(looksType)) role = 'type';
        else if (vals.length && vals.every(function (v) { return parseVNNumber(v) == null; })) role = 'fund';
      }
      mapping.push(role);
    }
    var seen = {};
    mapping = mapping.map(function (r) {
      if (!r) return '';
      if (seen[r]) return '';
      seen[r] = true;
      return r;
    });
    return mapping;
  }

  // Kiểm tra từng dòng sau khi gán cột. Lệnh bán được kiểm tra theo thứ tự
  // ngày, tính cả số CCQ đang giữ trong sổ và các dòng nhập trước trong đợt.
  function validateImportRows(mapping, rows, existingOrders) {
    var idx = { date: mapping.indexOf('date'), fund: mapping.indexOf('fund'), type: mapping.indexOf('type'), amount: mapping.indexOf('amount'), nav: mapping.indexOf('nav') };
    var valid = [], errors = [];
    if (idx.date < 0 || idx.fund < 0 || idx.amount < 0 || idx.nav < 0) {
      return { valid: valid, errors: [{ row: 0, reason: 'Chưa gán đủ 4 cột bắt buộc: Ngày, Quỹ, Số tiền, NAV.' }], missing: true };
    }
    var holdings = {};
    (existingOrders || []).forEach(function (o) {
      holdings[o.fund] = (holdings[o.fund] || 0) + (o.type === 'buy' ? unitsOf(o) : -unitsOf(o));
    });
    var cands = [];
    rows.forEach(function (r, i) {
      var lineNo = i + 1;
      var date = parseDateFlex(r[idx.date] || '');
      var fund = canonicalFund(r[idx.fund] || '');
      var amount = parseVNNumber(r[idx.amount]);
      var nav = parseVNNumber(r[idx.nav]);
      var type = idx.type >= 0 ? parseTypeFlex(r[idx.type]) : 'buy';
      if (!date) { errors.push({ row: lineNo, reason: 'Ngày không đúng định dạng (dùng DD/MM/YYYY hoặc YYYY-MM-DD).' }); return; }
      if (!fund) { errors.push({ row: lineNo, reason: 'Thiếu tên quỹ.' }); return; }
      if (amount == null || amount <= 0) { errors.push({ row: lineNo, reason: 'Số tiền không phải số lớn hơn 0.' }); return; }
      if (nav == null || nav <= 0) { errors.push({ row: lineNo, reason: 'NAV không phải số lớn hơn 0.' }); return; }
      if (!type) { errors.push({ row: lineNo, reason: 'Loại lệnh không rõ (dùng Mua hoặc Bán).' }); return; }
      cands.push({ type: type, fund: fund, date: date, amount: amount, nav: nav, lineNo: lineNo });
    });
    cands.sort(byDate);
    cands.forEach(function (o) {
      if (o.type === 'sell') {
        var held = holdings[o.fund] || 0;
        if (unitsOf(o) > held + 0.0005) {
          errors.push({ row: o.lineNo, reason: 'Lệnh bán vượt số CCQ đang giữ (' + fmtUnits(held) + ' CCQ).' });
          return;
        }
      }
      holdings[o.fund] = (holdings[o.fund] || 0) + (o.type === 'buy' ? unitsOf(o) : -unitsOf(o));
      valid.push(o);
    });
    return { valid: valid, errors: errors };
  }

  // ---- Sao lưu JSON ----
  function buildBackup(state) {
    return {
      app: 'Quy Cua Toi', version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        orders: state.orders,
        navs: state.navs,
        navDates: state.navDates || {},
        goal: (typeof state.goal === 'number' && state.goal > 0) ? state.goal : null
      }
    };
  }

  function parseBackup(text) {
    var obj;
    try { obj = JSON.parse(text); } catch (e) { return { error: 'File không phải JSON hợp lệ.' }; }
    var d = (obj && obj.data) ? obj.data : obj;
    if (!d || !Array.isArray(d.orders)) return { error: 'File backup thiếu danh sách lệnh.' };
    var orders = [];
    for (var i = 0; i < d.orders.length; i++) {
      var o = d.orders[i];
      if (!o || (o.type !== 'buy' && o.type !== 'sell') || !o.fund || !parseDateFlex(o.date)) {
        return { error: 'Lệnh số ' + (i + 1) + ' trong file backup không hợp lệ.' };
      }
      var amount = typeof o.amount === 'number' ? o.amount : parseVNNumber(o.amount);
      var nav = typeof o.nav === 'number' ? o.nav : parseVNNumber(o.nav);
      if (!(amount > 0) || !(nav > 0)) return { error: 'Lệnh số ' + (i + 1) + ' có số tiền hoặc NAV không hợp lệ.' };
      orders.push({ id: o.id || ('o' + Date.now().toString(36) + i), type: o.type, fund: canonicalFund(o.fund), date: o.date, amount: amount, nav: nav });
    }
    var navs = {};
    if (d.navs && typeof d.navs === 'object') {
      Object.keys(d.navs).forEach(function (k) {
        var v = typeof d.navs[k] === 'number' ? d.navs[k] : parseVNNumber(d.navs[k]);
        if (v > 0) navs[canonicalFund(k)] = v;
      });
    }
    var navDates = {};
    if (d.navDates && typeof d.navDates === 'object') {
      Object.keys(d.navDates).forEach(function (k) {
        if (parseDateFlex(d.navDates[k])) navDates[canonicalFund(k)] = d.navDates[k];
      });
    }
    var goal = (typeof d.goal === 'number' && d.goal > 0) ? d.goal : null;
    return { state: { orders: orders, navs: navs, navDates: navDates, goal: goal, sample: false, dismissedSample: true } };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var QCT = {
    KEY: KEY, SAMPLE_ORDERS: SAMPLE_ORDERS, SAMPLE_NAVS: SAMPLE_NAVS, FUNDS: FUNDS,
    unitsOf: unitsOf, fundsOf: fundsOf, computePortfolio: computePortfolio,
    unitsHeld: unitsHeld, validateOrder: validateOrder, monthlySeries: monthlySeries,
    monthReportCSV: monthReportCSV, fmtVND: fmtVND, fmtUnits: fmtUnits,
    fmtPct: fmtPct, fmtCompact: fmtCompact, monthKey: monthKey,
    canonicalFund: canonicalFund, fundDisplay: fundDisplay,
    todayStr: todayStr, daysBetween: daysBetween, fmtPeriod: fmtPeriod, fmtXirr: fmtXirr,
    solveXirr: solveXirr, xirrForFund: xirrForFund, xirrPortfolio: xirrPortfolio,
    navDateOf: navDateOf, navAgeDays: navAgeDays, goalProgress: goalProgress,
    parseCSVText: parseCSVText, guessMapping: guessMapping, validateImportRows: validateImportRows,
    parseVNNumber: parseVNNumber, parseDateFlex: parseDateFlex, parseTypeFlex: parseTypeFlex,
    buildBackup: buildBackup, parseBackup: parseBackup
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = QCT;

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
    var today = todayStr();
    return {
      orders: SAMPLE_ORDERS.map(function (o, i) {
        return { id: newId() + i, type: o.type, fund: o.fund, date: o.date, amount: o.amount, nav: o.nav };
      }),
      navs: Object.assign({}, SAMPLE_NAVS),
      navDates: { 'Quỹ mẫu A': today, 'Quỹ mẫu B': today },
      goal: null,
      sample: true,
      dismissedSample: false
    };
  }

  function emptyState() {
    return { orders: [], navs: {}, navDates: {}, goal: null, sample: false, dismissedSample: true };
  }

  var state = loadState();
  if (!state) {
    state = seedSample();
    saveState(state);
  }
  if (!state.navDates) state.navDates = {};
  if (typeof state.goal !== 'number') state.goal = null;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function renderAll() { renderOrders(); renderPortfolio(); renderChart(); renderReport(); renderBackup(); renderChrome(); }

  function renderChrome() {
    var n = state.orders.length;
    $('#order-count').textContent = n === 0 ? 'Chưa có lệnh nào.' : n + ' lệnh đã ghi.';
    $('#sample-badge').hidden = !state.sample;
    $('#btn-sample').hidden = state.sample || n > 0;
    $('#btn-clear-sample').hidden = !state.sample;
    var dl = $('#fund-list');
    dl.innerHTML = '';
    var seen = {};
    FUNDS.forEach(function (f) {
      var opt = document.createElement('option');
      opt.value = fundDisplay(f);
      opt.label = f.manager + ', ' + f.type + (f.aliases.length ? ', tên cũ: ' + f.aliases.join(', ') : '');
      dl.appendChild(opt);
      seen[fundDisplay(f)] = true;
    });
    fundsOf(state.orders).forEach(function (f) {
      if (seen[f]) return;
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

    var xr = xirrPortfolio(state.orders, state.navs, state.navDates);
    var xirrBlock = $('#xirr-block');
    xirrBlock.hidden = pf.rows.length === 0;
    if (xr) {
      $('#xirr-total').textContent = fmtXirr(xr.rate);
      $('#xirr-period').textContent = ', kỳ ' + fmtPeriod(xr.start, xr.end);
      $('#xirr-note').hidden = daysBetween(xr.start, xr.end) >= 30;
    } else {
      $('#xirr-total').textContent = '—';
      $('#xirr-period').textContent = '';
      $('#xirr-note').hidden = true;
    }

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
      var tdUnits = document.createElement('td');
      tdUnits.className = 'num';
      tdUnits.textContent = fmtUnits(r.units);
      tr.appendChild(tdUnits);
      var tdInv = document.createElement('td');
      tdInv.className = 'num';
      tdInv.textContent = fmtVND(r.invested);
      tr.appendChild(tdInv);
      var tdNav = document.createElement('td');
      tdNav.className = 'num';
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
        if (v > 0) {
          state.navs[r.fund] = v;
          state.navDates[r.fund] = todayStr();
          saveState(state);
          renderAll();
        } else { input.value = r.nav; }
      });
      tdNav.appendChild(input);
      var age = navAgeDays(state.orders, state.navDates, r.fund);
      var ageEl = document.createElement('div');
      ageEl.className = 'nav-age';
      if (age == null) { ageEl.textContent = 'Chưa có ngày NAV.'; }
      else if (age === 0) { ageEl.textContent = 'NAV hôm nay.'; }
      else if (age === 1) { ageEl.textContent = 'NAV 1 ngày trước.'; }
      else if (age > 30) { ageEl.textContent = 'NAV đã cũ (' + age + ' ngày), nên cập nhật.'; ageEl.classList.add('nav-age--stale'); }
      else { ageEl.textContent = 'NAV ' + age + ' ngày trước.'; }
      tdNav.appendChild(ageEl);
      tr.appendChild(tdNav);
      var tdVal = document.createElement('td');
      tdVal.className = 'num';
      tdVal.textContent = fmtVND(r.value);
      tr.appendChild(tdVal);
      var tdPl = document.createElement('td');
      tdPl.className = 'num';
      tdPl.textContent = fmtVND(r.pl) + ' (' + fmtPct(r.plPct) + ')';
      tr.appendChild(tdPl);
      var tdX = document.createElement('td');
      tdX.className = 'num';
      var fx = xirrForFund(state.orders, state.navs, state.navDates, r.fund);
      tdX.textContent = fx ? fmtXirr(fx.rate) : '—';
      tr.appendChild(tdX);
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

    var goalInput = $('#f-goal');
    if (document.activeElement !== goalInput) goalInput.value = state.goal ? String(state.goal) : '';
    var gp = $('#goal-progress');
    if (state.goal && pf.value > 0) {
      var prog = goalProgress(pf.value, state.goal);
      gp.hidden = false;
      $('#goal-fill').style.width = Math.min(prog.pct, 100) + '%';
      $('#goal-text').textContent = 'Đã đạt ' + prog.pct.toFixed(1).replace('.', ',') + '% mục tiêu ' + fmtVND(state.goal) + '.';
    } else if (state.goal) {
      gp.hidden = false;
      $('#goal-fill').style.width = '0%';
      $('#goal-text').textContent = 'Chưa có giá trị danh mục. Mục tiêu ' + fmtVND(state.goal) + '.';
    } else {
      gp.hidden = true;
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

  function renderBackup() {
    var funds = fundsOf(state.orders);
    $('#backup-counts').textContent = state.orders.length + ' lệnh, ' + funds.length + ' quỹ, ' + Object.keys(state.navs).length + ' NAV đã nhập' + (state.goal ? ', mục tiêu ' + fmtVND(state.goal) : '') + '.';
  }

  // ---- Nhập CSV: trạng thái của đợt nhập đang làm ----
  var importParsed = null;

  function renderImportPreview() {
    var prevEl = $('#csv-preview');
    var errEl = $('#csv-errors');
    var impBtn = $('#btn-csv-import');
    var resEl = $('#csv-result');
    resEl.textContent = '';
    if (!importParsed) {
      prevEl.innerHTML = '';
      errEl.innerHTML = '';
      impBtn.disabled = true;
      impBtn.textContent = 'Nhập lệnh';
      return;
    }
    var result = validateImportRows(importParsed.mapping, importParsed.parsed.rows, state.orders);
    importParsed.result = result;
    var html = '';
    if (result.valid.length) {
      html += '<table><thead><tr><th>Ngày</th><th>Loại</th><th>Quỹ</th><th class="num">Số tiền</th><th class="num">NAV</th><th class="num">CCQ</th></tr></thead><tbody>';
      result.valid.slice(0, 8).forEach(function (o) {
        html += '<tr><td>' + escapeHtml(o.date) + '</td><td>' + (o.type === 'buy' ? 'Mua' : 'Bán') + '</td><td>' + escapeHtml(o.fund) + '</td><td class="num">' + escapeHtml(fmtVND(o.amount)) + '</td><td class="num">' + escapeHtml(fmtVND(o.nav)) + '</td><td class="num">' + escapeHtml(fmtUnits(unitsOf(o))) + '</td></tr>';
      });
      html += '</tbody></table>';
      if (result.valid.length > 8) html += '<p class="fine">Hiện 8 trong ' + result.valid.length + ' lệnh hợp lệ.</p>';
    } else {
      html = '<p class="empty">Không có lệnh hợp lệ để nhập.</p>';
    }
    prevEl.innerHTML = html;
    var errHtml = '';
    result.errors.forEach(function (e) {
      errHtml += '<p>Dòng ' + e.row + ': ' + escapeHtml(e.reason) + '</p>';
    });
    errEl.innerHTML = errHtml;
    impBtn.disabled = result.valid.length === 0;
    impBtn.textContent = result.valid.length ? 'Nhập ' + result.valid.length + ' lệnh' : 'Nhập lệnh';
  }

  function renderImport() {
    var mapEl = $('#csv-mapping');
    if (!importParsed) {
      mapEl.innerHTML = '';
      renderImportPreview();
      return;
    }
    var parsed = importParsed.parsed;
    var mapping = importParsed.mapping;
    var ncols = 0;
    parsed.rows.forEach(function (r) { ncols = Math.max(ncols, r.length); });
    var roles = [['', 'Bỏ qua cột này'], ['date', 'Ngày'], ['fund', 'Quỹ'], ['type', 'Loại (mua/bán)'], ['amount', 'Số tiền'], ['nav', 'NAV']];
    var html = '<table><thead><tr><th>Cột</th><th>Ví dụ</th><th>Gán làm</th></tr></thead><tbody>';
    for (var c = 0; c < ncols; c++) {
      var samples = parsed.rows.slice(0, 3).map(function (r) { return r[c] || ''; }).join(' | ');
      var headerName = parsed.headers ? parsed.headers[c] : ('Cột ' + (c + 1));
      html += '<tr><td>' + escapeHtml(headerName) + '</td><td>' + escapeHtml(samples) + '</td><td><select data-col="' + c + '" aria-label="Gán cột ' + escapeHtml(headerName) + '">';
      roles.forEach(function (role) {
        html += '<option value="' + role[0] + '"' + (mapping[c] === role[0] ? ' selected' : '') + '>' + role[1] + '</option>';
      });
      html += '</select></td></tr>';
    }
    html += '</tbody></table>';
    mapEl.innerHTML = html;
    Array.prototype.slice.call(mapEl.querySelectorAll('select')).forEach(function (sel) {
      sel.addEventListener('change', function () {
        var col = parseInt(sel.getAttribute('data-col'), 10);
        var val = sel.value;
        if (val) {
          for (var i = 0; i < mapping.length; i++) { if (i !== col && mapping[i] === val) mapping[i] = ''; }
        }
        mapping[col] = val;
        renderImportPreview();
      });
    });
    renderImportPreview();
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
      fund: canonicalFund($('#f-fund').value.trim()),
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
    state = emptyState();
    saveState(state);
    renderAll();
  });
  $('#btn-wipe').addEventListener('click', function () {
    if (!window.confirm('Xóa hết lệnh trong sổ? Hành động này không hoàn lại. Hãy xuất backup JSON trong tab Sao lưu trước nếu cần giữ bản sao.')) return;
    state = emptyState();
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

  // Mục tiêu danh mục
  $('#f-goal').addEventListener('change', function () {
    var v = parseFloat(this.value);
    state.goal = (v > 0) ? Math.round(v) : null;
    saveState(state);
    renderAll();
  });

  // Nhập CSV
  $('#btn-csv-parse').addEventListener('click', function () {
    var text = $('#csv-input').value;
    var parsed = parseCSVText(text);
    if (!parsed.rows.length) {
      $('#csv-result').textContent = 'Chưa có dòng CSV nào để đọc. Dán nội dung file CSV vào ô trên trước.';
      return;
    }
    importParsed = { parsed: parsed, mapping: guessMapping(parsed), result: null };
    renderImport();
  });
  $('#btn-csv-import').addEventListener('click', function () {
    if (!importParsed || !importParsed.result || !importParsed.result.valid.length) return;
    importParsed.result.valid.forEach(function (o) {
      state.orders.push({ id: newId(), type: o.type, fund: o.fund, date: o.date, amount: o.amount, nav: o.nav });
    });
    var n = importParsed.result.valid.length;
    var e = importParsed.result.errors.length;
    if (state.sample) state.sample = false;
    saveState(state);
    importParsed = null;
    $('#csv-input').value = '';
    renderImport();
    renderAll();
    $('#csv-result').textContent = 'Đã nhập ' + n + ' lệnh.' + (e ? ' ' + e + ' dòng lỗi đã bỏ qua.' : '');
  });

  // Sao lưu JSON
  $('#btn-backup-export').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(buildBackup(state), null, 2)], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'quy-cua-toi-backup-' + todayStr() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    $('#backup-result').textContent = 'Đã xuất backup JSON. Giữ file này ở nơi an toàn.';
  });
  $('#backup-file').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var res = parseBackup(String(reader.result || ''));
      if (res.error) {
        $('#backup-result').textContent = 'Không nhập được: ' + res.error;
        return;
      }
      if (!window.confirm('Nhập backup sẽ thay toàn bộ sổ hiện tại (' + state.orders.length + ' lệnh). Tiếp tục?')) return;
      state = res.state;
      saveState(state);
      renderAll();
      $('#backup-result').textContent = 'Đã nhập backup: ' + state.orders.length + ' lệnh, ' + fundsOf(state.orders).length + ' quỹ.';
    };
    reader.readAsText(file);
    this.value = '';
  });

  renderAll();
})(typeof window !== 'undefined' ? window : this);

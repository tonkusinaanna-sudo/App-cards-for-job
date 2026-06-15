import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Workflow, Table, LayoutGrid, Wallet, ListTodo, Users, BookOpen,
  Search, Plus, X, Trash2, Filter, ArrowRight, Sparkles,
  MessageCircle, Clock, TrendingUp, StickyNote, Square, Download, Link2,
  RefreshCw, ArrowDownLeft, ArrowUpRight, Copy, Check, LayoutDashboard, Menu,
} from "lucide-react";

const STATUS = {
  gas:   { label: "Газ",    color: "#3fb950" },
  wait:  { label: "Ждём",   color: "#d29922" },
  nogas: { label: "Не газ", color: "#f85149" },
};
const STATUS_ORDER = ["gas", "wait", "nogas"];

const SEED = [
  { id: 1,  geo: "Россия",    flag: "🇷🇺", pay: "SBP-Provider A", casino: "LuckyJet",  trader: "",           method: "СБП",         com: 8,   link: "t.me/sbpprov",  turn: 41200000, status: "gas",   owner: "@artem"  },
  { id: 2,  geo: "Россия",    flag: "🇷🇺", pay: "CardGate RU",    casino: "FairSpin",  trader: "Трейдер #7", method: "Карты",       com: 11,  link: "fairspin.io",   turn: 22800000, status: "gas",   owner: "@artem"  },
  { id: 3,  geo: "Россия",    flag: "🇷🇺", pay: "CryptoPay",      casino: "",          trader: "Трейдер #3", method: "Крипто USDT", com: 5.1, link: "t.me/cryptopay", turn: 8400000,  status: "wait",  owner: "@lena"   },
  { id: 4,  geo: "Казахстан", flag: "🇰🇿", pay: "KZ-P2P",         casino: "Pin-Up",    trader: "",           method: "P2P",         com: 9,   link: "pin-up.kz",     turn: 5600000,  status: "gas",   owner: "@damir"  },
  { id: 5,  geo: "Казахстан", flag: "🇰🇿", pay: "",               casino: "Vavada",    trader: "Трейдер #12", method: "Карты",      com: 10,  link: "vavada.com",    turn: 0,        status: "wait",  owner: "@damir"  },
  { id: 6,  geo: "Турция",    flag: "🇹🇷", pay: "TR-Papara",      casino: "Mostbet",   trader: "",           method: "Papara",      com: 12,  link: "mostbet.com",   turn: 3100000,  status: "gas",   owner: "@lena"   },
  { id: 7,  geo: "Турция",    flag: "🇹🇷", pay: "TR-CryptoX",     casino: "BetWinner", trader: "",           method: "Крипто USDT", com: 6,   link: "t.me/trcryptox", turn: 0,       status: "nogas", owner: "@lena"   },
  { id: 8,  geo: "Бразилия",  flag: "🇧🇷", pay: "PIX-Flow",       casino: "Blaze",     trader: "",           method: "PIX",         com: 7.5, link: "blaze.com",     turn: 18900000, status: "gas",   owner: "@carlos" },
  { id: 9,  geo: "Бразилия",  flag: "🇧🇷", pay: "BR-Boleto",      casino: "",          trader: "Трейдер #5", method: "Boleto",      com: 9,   link: "t.me/brboleto", turn: 0,        status: "wait",  owner: "@carlos" },
  { id: 10, geo: "Индия",     flag: "🇮🇳", pay: "UPI-Gate",       casino: "Rajabets",  trader: "",           method: "UPI",         com: 0.5, link: "rajabets.com",  turn: 4200000,  status: "gas",   owner: "@priya"  },
];

// ===== Пароль для входа в приложение (поменяй на свой) =====
const APP_PASSWORD = "228";

const NAV = [
  { key: "dash", label: "Дашборд", icon: LayoutDashboard },
  { key: "canvas",   label: "Канвас",        icon: Workflow },
  { key: "registry", label: "Реестр связок", icon: Table },
  { key: "finance",  label: "Финансы",       icon: Wallet },
  { key: "tasks",    label: "Задачи",        icon: ListTodo },
  { key: "crm",      label: "CRM-контакты",  icon: Users },
  { key: "kb",       label: "База знаний",   icon: BookOpen },
];

const PLACEHOLDERS = {
  canvas:  { icon: Workflow, title: "Канвас",       text: "Узловая карта в духе Anytype: гео в центре, связи к платёжкам, казино и командам. Те же объекты, что в реестре — но видно их связи целиком." },
  finance: { icon: Wallet,   title: "Финансы",      text: "Обороты и комиссии по каждой связке за период, кто сколько должен и выплачено. Данные уже копятся в реестре — обороты подтянутся сюда автоматически." },
  tasks:   { icon: ListTodo, title: "Задачи",       text: "Follow-up'ы: «продлить договорённость», «проверить лимит к пятнице». Привязка задачи к конкретной связке или контакту." },
  crm:     { icon: Users,    title: "CRM-контакты", text: "Люди и компании: Telegram, ответственные, к каким связкам привязаны. Мини-CRM поверх той же базы объектов." },
  kb:      { icon: BookOpen, title: "База знаний",  text: "Мануалы, реквизиты, инструкции по каждому гео в одном месте. Заметки, которые можно привязать к любому объекту." },
};

const fmt = (n) => new Intl.NumberFormat("ru-RU").format(n);
const fmtShort = (n) => n >= 1000000 ? (n / 1000000).toFixed(1).replace(".0", "") + "M" : fmt(n);

// ===== Общая база (Supabase). Все устройства видят одни данные =====
const SUPABASE_URL = "https://uqnvxyasloxdkoopcpcf.supabase.co";
const SUPABASE_KEY = "sb_publishable_BBNnb9yJbzUYQJ20vMbIhQ_-uH21i1h";
const SB_ON = /^https:\/\/.+\.supabase\.co$/.test(SUPABASE_URL) && SUPABASE_KEY.startsWith("sb_");
const SB_HEADERS = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" };

const store = {
  has: () => true,
  cloud: () => SB_ON,
  async get(key, def) {
    if (SB_ON) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/app_state?key=eq.${encodeURIComponent(key)}&select=value`, { headers: SB_HEADERS });
        if (r.ok) { const rows = await r.json(); return rows.length ? rows[0].value : def; }
      } catch {}
      return def;
    }
    try {
      if (typeof window !== "undefined" && window.storage) { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : def; }
      if (typeof window !== "undefined" && window.localStorage) { const v = window.localStorage.getItem(key); return v != null ? JSON.parse(v) : def; }
    } catch {}
    return def;
  },
  async set(key, val) {
    if (SB_ON) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/app_state`, {
          method: "POST",
          headers: { ...SB_HEADERS, Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ key, value: val, updated_at: new Date().toISOString() }),
        });
      } catch {}
      return;
    }
    try {
      if (typeof window !== "undefined" && window.storage) { await window.storage.set(key, JSON.stringify(val)); return; }
      if (typeof window !== "undefined" && window.localStorage) { window.localStorage.setItem(key, JSON.stringify(val)); }
    } catch {}
  },
};

export default function App() {
  const [nav, setNav] = useState("dash");
  const [unlocked, setUnlocked] = useState(() => { try { return localStorage.getItem("svyazka:auth") === "1"; } catch { return false; } });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("table");
  const [q, setQ] = useState("");
  const [geo, setGeo] = useState("all");
  const [stat, setStat] = useState("all");
  const [rows, setRows] = useState(SEED);
  const [showAdd, setShowAdd] = useState(false);
  const [sel, setSel] = useState(null);
  const [ready, setReady] = useState(false);
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    (async () => {
      const saved = await store.get("registry:rows", null);
      if (Array.isArray(saved) && saved.length) setRows(saved);
      setReady(true);
    })();
  }, [syncTick]);
  useEffect(() => { if (ready) store.set("registry:rows", rows); }, [rows, ready]);

  useEffect(() => {
    if (!store.cloud()) return;
    const bump = () => { if (document.visibilityState === "visible") setSyncTick((t) => t + 1); };
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", bump);
    return () => { window.removeEventListener("focus", bump); document.removeEventListener("visibilitychange", bump); };
  }, []);

  const geos = useMemo(() => [...new Set(rows.map((r) => r.geo))], [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (geo !== "all" && r.geo !== geo) return false;
      if (stat !== "all" && r.status !== stat) return false;
      if (term && ![r.pay, r.casino, r.trader, r.geo, r.owner, r.method].join(" ").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [rows, q, geo, stat]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "gas").length;
    const turn = rows.reduce((s, r) => s + r.turn, 0);
    return { total: rows.length, active, turn, geos: geos.length };
  }, [rows, geos]);

  const updateRow = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const setStatus = (id, status) =>
    setRows((rs) => rs.map((r) =>
      r.id === id
        ? { ...r, status, log: [{ t: Date.now(), text: "Статус → " + STATUS[status].label }, ...(r.log || [])] }
        : r
    ));
  const del = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const add = (rec) => { setRows((rs) => [{ ...rec, id: Date.now(), turn: 0, log: [{ t: Date.now(), text: "Связка создана" }] }, ...rs]); setShowAdd(false); };
  const createRow = (rec) => {
    const id = Date.now();
    setRows((rs) => [{ id, pay: "", casino: "", trader: "", method: "", com: 0, link: "", owner: "", note: "", turn: 0, flag: "", status: "wait", ...rec, log: [{ t: Date.now(), text: "Связка создана" }] }, ...rs]);
    setSel(id);
  };

  const selRow = sel != null ? rows.find((r) => r.id === sel) : null;

  return (
    <div className="app">
      <style>{CSS}</style>

      {!unlocked ? <LockScreen onUnlock={() => { setUnlocked(true); try { localStorage.setItem("svyazka:auth", "1"); } catch {} }} /> : (<>

      <div className="mtopbar">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Меню"><Menu size={20} /></button>
        <div className="mtopbar-brand"><div className="brand-mark sm"><Sparkles size={13} /></div> Связка</div>
      </div>
      {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={"sidebar" + (sidebarOpen ? " open" : "")}>
        <div className="brand">
          <div className="brand-mark"><Sparkles size={16} /></div>
          <div>
            <div className="brand-name">Связка</div>
            <div className="brand-sub">processing ops</div>
          </div>
          <button className="side-close" onClick={() => setSidebarOpen(false)} aria-label="Закрыть"><X size={18} /></button>
        </div>
        <nav className="nav">
          {NAV.map((n) => {
            const I = n.icon;
            return (
              <button key={n.key} className={"nav-item" + (nav === n.key ? " on" : "")} onClick={() => { setNav(n.key); setSidebarOpen(false); }}>
                <I size={17} /> <span>{n.label}</span>
                {n.key === "registry" && <em className="nav-count">{rows.length}</em>}
              </button>
            );
          })}
        </nav>
        <div className="side-foot">
          <div className="who"><div className="who-dot" /> <span>{store.cloud() ? "Общая база — синхронизировано" : store.has() ? "Автосохранение включено" : "Хранилище недоступно"}</span></div>
          <button className="logout-btn" onClick={() => { try { localStorage.removeItem("svyazka:auth"); } catch {} setUnlocked(false); }}>Выйти</button>
        </div>
      </aside>

      <main className="main">
        {nav === "registry" ? (
          <>
            <header className="top">
              <div>
                <h1>Реестр связок</h1>
                <p className="sub">Платёжка, казино и трейдер — в любой комбинации</p>
              </div>
              <button className="btn accent" onClick={() => setShowAdd(true)}><Plus size={16} /> Связка</button>
            </header>

            <div className="stats">
              <Stat label="Всего связок" value={stats.total} />
              <Stat label="Газ" value={stats.active} dot="#3fb950" />
              <Stat label="Оборот" value={fmtShort(stats.turn)} />
              <Stat label="Гео" value={stats.geos} />
            </div>

            <div className="toolbar">
              <div className="searchbox">
                <Search size={15} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: платёжка, казино, гео, ответственный…" />
              </div>
              <div className="seg">
                <button className={view === "table" ? "on" : ""} onClick={() => setView("table")}><Table size={15} /> Таблица</button>
                <button className={view === "kanban" ? "on" : ""} onClick={() => setView("kanban")}><LayoutGrid size={15} /> Канбан</button>
              </div>
            </div>

            <div className="chips">
              <span className="chips-label"><Filter size={13} /> Гео</span>
              <Chip on={geo === "all"} onClick={() => setGeo("all")}>Все</Chip>
              {geos.map((g) => <Chip key={g} on={geo === g} onClick={() => setGeo(g)}>{g}</Chip>)}
              <span className="chips-sep" />
              <span className="chips-label">Статус</span>
              <Chip on={stat === "all"} onClick={() => setStat("all")}>Все</Chip>
              {STATUS_ORDER.map((s) => (
                <Chip key={s} on={stat === s} onClick={() => setStat(s)} dot={STATUS[s].color}>{STATUS[s].label}</Chip>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="empty">Ничего не найдено. Сбрось фильтры или измени запрос.</div>
            ) : view === "table" ? (
              <TableView rows={filtered} onStatus={setStatus} onDel={del} onOpen={setSel} />
            ) : (
              <KanbanView rows={filtered} onStatus={setStatus} onDel={del} onOpen={setSel} />
            )}
          </>
        ) : (
          nav === "dash" ? <DashboardView key={"dash" + syncTick} rows={rows} onOpenRow={setSel} onGo={setNav} />
            : nav === "canvas" ? <CanvasView rows={rows} onOpenRow={setSel} onAddRow={() => setShowAdd(true)} onCreate={createRow} />
            : nav === "finance" ? <FinanceView key={"fin" + syncTick} rows={rows} />
              : nav === "tasks" ? <TasksView key={"tasks" + syncTick} />
                : nav === "crm" ? <CRMView key={"crm" + syncTick} rows={rows} />
                  : nav === "kb" ? <KBView key={"kb" + syncTick} />
                    : <Placeholder {...PLACEHOLDERS[nav]} />
        )}
      </main>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={add} />}
      {selRow && (
        <DetailDrawer
          row={selRow}
          onClose={() => setSel(null)}
          onUpdate={updateRow}
          onStatus={setStatus}
          onDel={(id) => { del(id); setSel(null); }}
        />
      )}

      </>)}
    </div>
  );
}

function LockScreen({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => { if (pw === APP_PASSWORD) onUnlock(); else setErr(true); };
  return (
    <div className="lock">
      <div className="lock-card">
        <div className="lock-brand">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <div>
            <div className="brand-name">Связка</div>
            <div className="brand-sub">processing ops</div>
          </div>
        </div>
        <p className="lock-text">Введите пароль для входа</p>
        <input className={"lock-input" + (err ? " err" : "")} type="password" value={pw} autoFocus
          onChange={(e) => { setPw(e.target.value); setErr(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="Пароль" />
        {err && <div className="lock-err">Неверный пароль</div>}
        <button className="btn accent lock-btn" onClick={submit}>Войти</button>
      </div>
    </div>
  );
}

function Stat({ label, value, dot }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{dot && <i className="sdot" style={{ background: dot }} />}{value}</div>
    </div>
  );
}

function Chip({ children, on, onClick, dot }) {
  return (
    <button className={"chip" + (on ? " on" : "")} onClick={onClick}>
      {dot && <i className="cdot" style={{ background: dot }} />}{children}
    </button>
  );
}

function StatusPill({ status, onChange }) {
  const s = STATUS[status];
  return (
    <div className="pill" style={{ borderColor: s.color + "55" }}>
      <i className="cdot" style={{ background: s.color }} />
      <select value={status} onChange={(e) => onChange(e.target.value)}>
        {STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
      </select>
    </div>
  );
}

function Pair({ r }) {
  const parts = [r.pay, r.casino, r.trader].filter(Boolean);
  if (parts.length === 0) return <span className="muted">— без позиций —</span>;
  return (
    <span className="link-pair">
      {parts.map((p, i) => (
        <span className="pp" key={i}>{i > 0 && <ArrowRight size={12} className="pair-arr" />}{p}</span>
      ))}
    </span>
  );
}

function extUrl(s) { return s && !/^https?:\/\//i.test(s) ? "https://" + s : s; }

function TableView({ rows, onStatus, onDel, onOpen }) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Гео</th><th>Связка</th><th>Метод</th><th>Ссылка</th>
            <th className="num">Ком.</th><th className="num">Оборот</th>
            <th>Статус</th><th>Контакт</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="row" onClick={() => onOpen(r.id)}>
              <td><span className="flag">{r.flag}</span> {r.geo}</td>
              <td><Pair r={r} /></td>
              <td><span className="tag">{r.method}</span></td>
              <td onClick={(e) => e.stopPropagation()}>
                {r.link ? <a className="ext" href={extUrl(r.link)} target="_blank" rel="noreferrer">{r.link}</a> : <span className="muted">—</span>}
              </td>
              <td className="num mono">{r.com}%</td>
              <td className="num mono">{r.turn ? fmt(r.turn) : "—"}</td>
              <td onClick={(e) => e.stopPropagation()}><StatusPill status={r.status} onChange={(s) => onStatus(r.id, s)} /></td>
              <td className="mono">{r.owner}</td>
              <td onClick={(e) => e.stopPropagation()}><button className="icon-btn" onClick={() => onDel(r.id)}><Trash2 size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KanbanView({ rows, onStatus, onDel, onOpen }) {
  return (
    <div className="kanban">
      {STATUS_ORDER.map((s) => {
        const col = rows.filter((r) => r.status === s);
        return (
          <div className="kcol" key={s}>
            <div className="kcol-head">
              <span><i className="cdot" style={{ background: STATUS[s].color }} /> {STATUS[s].label}</span>
              <em>{col.length}</em>
            </div>
            <div className="kcol-body">
              {col.map((r) => (
                <div className="kcard" key={r.id} style={{ borderLeftColor: STATUS[s].color }} onClick={() => onOpen(r.id)}>
                  <div className="kcard-top">
                    <span className="flag">{r.flag}</span>
                    <span className="kgeo">{r.geo}</span>
                    <button className="icon-btn sm" onClick={(e) => { e.stopPropagation(); onDel(r.id); }}><X size={13} /></button>
                  </div>
                  <div className="kpair"><Pair r={r} /></div>
                  <div className="kmeta">
                    <span className="tag">{r.method}</span>
                    <span className="mono">{r.com}%</span>
                  </div>
                  <div className="kfoot">
                    <span className="owner">{r.owner}</span>
                    <select className="kstatus" value={r.status} onClick={(e) => e.stopPropagation()} onChange={(e) => onStatus(r.id, e.target.value)}>
                      {STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {col.length === 0 && <div className="kempty">пусто</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Placeholder({ icon: Icon, title, text }) {
  return (
    <div className="ph">
      <div className="ph-card">
        <div className="ph-icon"><Icon size={26} /></div>
        <h2>{title}</h2>
        <p>{text}</p>
        <span className="ph-tag">в разработке</span>
      </div>
    </div>
  );
}

const NTYPE = {
  geo:    { color: "#818cf8", label: "Гео" },
  pay:    { color: "#2dd4bf", label: "Платёжка" },
  casino: { color: "#a78bfa", label: "Казино" },
  trader: { color: "#38bdf8", label: "Трейдер" },
};

function buildGraph(rows) {
  const nodes = [], edges = [], deals = [];
  const dealSeen = new Set();
  const byGeo = {};
  rows.forEach((r) => { (byGeo[r.geo] = byGeo[r.geo] || { flag: r.flag, rows: [] }).rows.push(r); });
  const geoKeys = Object.keys(byGeo);
  const cols = geoKeys.length > 4 ? 3 : 2;
  const spX = 470, spY = 430, x0 = 230, y0 = 200;

  geoKeys.forEach((geo, gi) => {
    const cx = x0 + (gi % cols) * spX;
    const cy = y0 + Math.floor(gi / cols) * spY;
    const geoId = "geo:" + geo;
    nodes.push({ id: geoId, type: "geo", label: geo, flag: byGeo[geo].flag, x: cx, y: cy });

    const ents = [];
    byGeo[geo].rows.forEach((r) => {
      [["pay", r.pay], ["casino", r.casino], ["trader", r.trader]].forEach(([t, v]) => {
        if (v && !ents.some((e) => e.type === t && e.label === v)) ents.push({ type: t, label: v });
      });
    });

    const R = Math.max(135, ents.length * 24);
    ents.forEach((e, i) => {
      const ang = (-Math.PI / 2) + (2 * Math.PI * i) / Math.max(ents.length, 1);
      const id = geoId + "|" + e.type + ":" + e.label;
      nodes.push({ id, type: e.type, label: e.label, geoId, x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) });
      edges.push({ from: geoId, to: id });
    });

    byGeo[geo].rows.forEach((r) => {
      const ids = [["pay", r.pay], ["casino", r.casino], ["trader", r.trader]]
        .filter(([, v]) => v).map(([t, v]) => geoId + "|" + t + ":" + v);
      for (let i = 0; i < ids.length - 1; i++) {
        const key = [ids[i], ids[i + 1]].sort().join("::");
        if (!dealSeen.has(key)) { dealSeen.add(key); deals.push({ from: ids[i], to: ids[i + 1] }); }
      }
    });
  });
  return { nodes, edges, deals };
}

const nodeW = (n) => {
  const base = n.type === "geo" ? 54 : 34;
  return Math.min(230, Math.max(94, n.label.length * 7.4 + base));
};

// точка на границе пилюли узла в направлении (tx,ty) — чтобы линия/стрелка упиралась в край, а не в центр
const edgePoint = (n, tx, ty, pad = 4) => {
  const rx = nodeW(n) / 2 + pad, ry = (n.type === "geo" ? 44 : 34) / 2 + pad;
  const ang = Math.atan2(ty - n.y, tx - n.x);
  const r = (rx * ry) / Math.sqrt((ry * Math.cos(ang)) ** 2 + (rx * Math.sin(ang)) ** 2);
  return { x: n.x + Math.cos(ang) * r, y: n.y + Math.sin(ang) * r };
};

const NOTE_COLORS = ["#caa14a", "#4a9e8f", "#a86bd1", "#5b7fd1", "#cf6b6b"];
const FRAME_COLORS = ["#818cf8", "#2dd4bf", "#a78bfa", "#f0883e", "#8b949e"];

function wrapText(text, maxChars) {
  const words = (text || "").split(/\s+/);
  const lines = []; let cur = "";
  words.forEach((w) => {
    if ((cur + " " + w).trim().length > maxChars) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  });
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function CanvasView({ rows, onOpenRow, onAddRow, onCreate }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [deals, setDeals] = useState([]);
  const [extras, setExtras] = useState([]);
  const [view, setView] = useState({ x: 30, y: 20, k: 1 });
  const [sel, setSel] = useState(null);
  const [selExtra, setSelExtra] = useState(null);
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [showDeals, setShowDeals] = useState(true);
  const [panelNode, setPanelNode] = useState(null);
  const [addMenu, setAddMenu] = useState(false);
  const [linkSrc, setLinkSrc] = useState(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [stageSize, setStageSize] = useState({ w: 800, h: 520 });
  const svgRef = useRef(null);
  const stageRef = useRef(null);
  const drag = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const savedRef = useRef(null);
  const readyRef = useRef(false);
  const debRef = useRef(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  const matchRows = (n) => {
    if (!n) return [];
    if (n.type === "geo") return rows.filter((r) => r.geo === n.label);
    const geo = n.geoId.slice(4);
    return rows.filter((r) => r.geo === geo && r[n.type] === n.label);
  };

  const applyLayout = useCallback((fresh) => {
    const g = buildGraph(rows);
    const pos = !fresh && savedRef.current ? savedRef.current.pos : null;
    const ns = pos ? g.nodes.map((n) => (pos[n.id] ? { ...n, x: pos[n.id].x, y: pos[n.id].y } : n)) : g.nodes;
    setNodes(ns); setEdges(g.edges); setDeals(g.deals);
    setView({ x: 30, y: 20, k: 1 }); setSel(null); setQ(""); setPanelNode(null); setLinkSrc(null);
  }, [rows]);

  useEffect(() => {
    (async () => {
      const saved = await store.get("canvas:layout", null);
      if (saved && saved.pos) {
        savedRef.current = saved;
        if (Array.isArray(saved.collapsed)) setCollapsed(new Set(saved.collapsed));
      }
      const ex = await store.get("canvas:extras", null);
      if (Array.isArray(ex)) setExtras(ex);
      applyLayout(false);
      readyRef.current = true;
    })();
  }, []);
  useEffect(() => { if (readyRef.current) applyLayout(false); }, [rows]);

  useEffect(() => {
    if (!readyRef.current) return;
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      if (nodes.length) {
        const pos = {};
        nodes.forEach((n) => { pos[n.id] = { x: Math.round(n.x), y: Math.round(n.y) }; });
        const layout = { pos, collapsed: [...collapsed], showDeals };
        savedRef.current = layout;
        store.set("canvas:layout", layout);
      }
      store.set("canvas:extras", extras);
    }, 450);
    return () => clearTimeout(debRef.current);
  }, [nodes, collapsed, showDeals, extras]);

  useEffect(() => {
    const measure = () => { if (stageRef.current) { const r = stageRef.current.getBoundingClientRect(); setStageSize({ w: r.width, h: r.height }); } };
    measure();
    window.addEventListener("resize", measure);
    const onKey = (e) => { if (e.key === "Escape") { setLinkSrc(null); setSelExtra(null); setAddMenu(false); } };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("keydown", onKey); };
  }, []);

  const resetLayout = () => { savedRef.current = null; setCollapsed(new Set()); applyLayout(true); };

  const updateExtra = (id, patch) => setExtras((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeExtra = (id) => { setExtras((xs) => xs.filter((x) => x.id !== id)); setSelExtra(null); };
  const centerCanvas = () => {
    const k = viewRef.current.k;
    return { x: (stageSize.w / 2 - viewRef.current.x) / k - 90, y: (stageSize.h / 2 - viewRef.current.y) / k - 50 };
  };
  const addNote = () => { const c = centerCanvas(); const id = "x" + Date.now(); setExtras((xs) => [...xs, { id, kind: "note", x: c.x, y: c.y, w: 190, h: 120, text: "", color: NOTE_COLORS[0] }]); setSelExtra(id); setAddMenu(false); };
  const addFrame = () => { const c = centerCanvas(); const id = "x" + Date.now(); setExtras((xs) => [...xs, { id, kind: "frame", x: c.x - 60, y: c.y - 60, w: 320, h: 220, text: "Группа", color: FRAME_COLORS[0] }]); setSelExtra(id); setAddMenu(false); };

  const tryLink = (aId, bId) => {
    const a = byId[aId], b = byId[bId];
    if (!a || !b || a.type === "geo" || b.type === "geo" || a.geoId !== b.geoId || a.type === b.type) return;
    const geo = a.geoId.slice(4);
    const flag = (nodes.find((x) => x.id === a.geoId) || {}).flag || "";
    onCreate({ geo, flag, [a.type]: a.label, [b.type]: b.label });
  };

  const exportPNG = () => {
    const svg = svgRef.current; if (!svg) return;
    const r = svg.getBoundingClientRect();
    const clone = svg.cloneNode(true);
    clone.setAttribute("width", String(r.width)); clone.setAttribute("height", String(r.height));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", String(r.width)); bg.setAttribute("height", String(r.height)); bg.setAttribute("fill", "#0a0c11");
    clone.insertBefore(bg, clone.firstChild);
    const data = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();
    img.onload = () => {
      const s = 2, c = document.createElement("canvas"); c.width = r.width * s; c.height = r.height * s;
      const ctx = c.getContext("2d"); ctx.scale(s, s); ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      c.toBlob((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "svyazka-canvas.png"; a.click(); }, "image/png");
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  const childCount = useMemo(() => {
    const m = {};
    nodes.forEach((n) => { if (n.type !== "geo") m[n.geoId] = (m[n.geoId] || 0) + 1; });
    return m;
  }, [nodes]);
  const hidden = (n) => n.type !== "geo" && collapsed.has(n.geoId);
  const toggleCollapse = (geoId) => setCollapsed((s) => {
    const n = new Set(s); n.has(geoId) ? n.delete(geoId) : n.add(geoId); return n;
  });

  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return null;
    return new Set(nodes.filter((n) => n.label.toLowerCase().includes(term)).map((n) => n.id));
  }, [q, nodes]);

  const highlight = useMemo(() => {
    if (matches) return matches;
    if (!sel) return null;
    const s = new Set([sel]);
    edges.forEach((e) => { if (e.from === sel) s.add(e.to); if (e.to === sel) s.add(e.from); });
    return s;
  }, [matches, sel, edges]);

  const toCanvas = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k };
  };

  const onNodeDown = (e, id) => {
    e.stopPropagation();
    const n = nodes.find((x) => x.id === id);
    const pt = toCanvas(e);
    drag.current = { id, dx: pt.x - n.x, dy: pt.y - n.y, sx: e.clientX, sy: e.clientY, moved: false };
    setSel(id);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onExtraDown = (e, id) => {
    e.stopPropagation();
    const x = extras.find((o) => o.id === id);
    const pt = toCanvas(e);
    drag.current = { extra: id, dx: pt.x - x.x, dy: pt.y - x.y, sx: e.clientX, sy: e.clientY, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onResizeDown = (e, id) => {
    e.stopPropagation();
    const x = extras.find((o) => o.id === id);
    drag.current = { resize: id, x0: x.x, y0: x.y, moved: true };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onBgDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const r = svgRef.current.getBoundingClientRect();
      const mid = { x: (pts[0].x + pts[1].x) / 2 - r.left, y: (pts[0].y + pts[1].y) / 2 - r.top };
      pinch.current = { dist, view: { ...view } };
      drag.current = null;
    } else {
      drag.current = { pan: true, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
    }
  };
  const onMove = (e) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const r = svgRef.current.getBoundingClientRect();
      const mid = { x: (pts[0].x + pts[1].x) / 2 - r.left, y: (pts[0].y + pts[1].y) / 2 - r.top };
      const p = pinch.current;
      const k = Math.min(2.4, Math.max(0.15, p.view.k * (dist / p.dist)));
      setView({ k, x: mid.x - ((mid.x - p.view.x) / p.view.k) * k, y: mid.y - ((mid.y - p.view.y) / p.view.k) * k });
      return;
    }
    const d = drag.current; if (!d) return;
    const far = Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 4;
    if (d.pan) {
      if (far) d.moved = true;
      setView((v) => ({ ...v, x: d.vx + (e.clientX - d.sx), y: d.vy + (e.clientY - d.sy) }));
    } else if (d.extra != null) {
      if (far || d.moved) { d.moved = true; const pt = toCanvas(e); updateExtra(d.extra, { x: pt.x - d.dx, y: pt.y - d.dy }); }
    } else if (d.resize != null) {
      const pt = toCanvas(e); updateExtra(d.resize, { w: Math.max(90, pt.x - d.x0), h: Math.max(56, pt.y - d.y0) });
    } else if (d.id != null && (far || d.moved)) {
      d.moved = true;
      const pt = toCanvas(e);
      setNodes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x: pt.x - d.dx, y: pt.y - d.dy } : n)));
    }
  };
  const onUp = (e) => {
    if (e && e.pointerId != null && pointers.current.has(e.pointerId)) pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size > 0) { drag.current = null; return; }
    const d = drag.current;
    if (d && !d.moved) {
      if (d.pan) { setSel(null); setSelExtra(null); setLinkSrc(null); }
      else if (d.extra != null) setSelExtra(d.extra);
      else if (d.id != null) {
        const n = byId[d.id];
        setSelExtra(null);
        if (linkSrc) {
          if (n && n.type !== "geo") {
            if (linkSrc === "await") setLinkSrc(n.id);
            else { tryLink(linkSrc, n.id); setLinkSrc(null); }
          }
        } else if (n && n.type === "geo") toggleCollapse(n.id);
        else if (n) {
          const mr = matchRows(n);
          if (mr.length === 1) onOpenRow(mr[0].id);
          else setPanelNode(n);
        }
      }
    }
    drag.current = null;
  };

  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      setView((v) => {
        const k = Math.min(2.4, Math.max(0.15, v.k * (e.deltaY < 0 ? 1.1 : 0.9)));
        return { k, x: mx - (mx - v.x) * (k / v.k), y: my - (my - v.y) * (k / v.k) };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoom = (f) => setView((v) => {
    const r = svgRef.current.getBoundingClientRect();
    const mx = r.width / 2, my = r.height / 2;
    const k = Math.min(2.4, Math.max(0.15, v.k * f));
    return { k, x: mx - (mx - v.x) * (k / v.k), y: my - (my - v.y) * (k / v.k) };
  });

  const fit = (ids) => {
    const ns = ids ? nodes.filter((n) => ids.has(n.id)) : nodes;
    if (!ns.length || !svgRef.current) return;
    const xs = ns.map((n) => n.x), ys = ns.map((n) => n.y);
    const minX = Math.min(...xs) - 130, maxX = Math.max(...xs) + 130;
    const minY = Math.min(...ys) - 90, maxY = Math.max(...ys) + 90;
    const r = svgRef.current.getBoundingClientRect();
    const k = Math.min(2.4, Math.max(0.15, Math.min(r.width / (maxX - minX), r.height / (maxY - minY))));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    setView({ k, x: r.width / 2 - cx * k, y: r.height / 2 - cy * k });
  };

  return (
    <div className="cv">
      <div className="cv-top">
        <div>
          <h1>Канвас</h1>
          <p className="sub">Карта строится из реестра: гео в центре, связи к платёжкам, казино и трейдерам</p>
        </div>
        <button className="cv-toolstoggle" onClick={() => setToolsOpen((v) => !v)}>{toolsOpen ? <X size={16} /> : <Menu size={16} />} Инструменты</button>
        <div className={"cv-tools" + (toolsOpen ? " open" : "")}>
          <div className="cv-search">
            <Search size={15} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && matches && matches.size) fit(matches); }}
              placeholder="Поиск по узлам…"
            />
            {q && <span className="cv-found mono">{matches ? matches.size : 0}</span>}
            {q && <button className="cv-clear" onClick={() => setQ("")}><X size={14} /></button>}
          </div>
          <div className="cv-zoom">
            <button onClick={() => zoom(0.83)}>−</button>
            <span className="mono">{Math.round(view.k * 100)}%</span>
            <button onClick={() => zoom(1.2)}>+</button>
          </div>
          <div className="cv-addwrap">
            <button className="btn accent" onClick={() => setAddMenu((v) => !v)}><Plus size={16} /> Добавить</button>
            {addMenu && (
              <div className="cv-menu" onMouseLeave={() => setAddMenu(false)}>
                <button onClick={() => { onAddRow(); setAddMenu(false); }}><ArrowRight size={15} /> Связку (форма)</button>
                <button onClick={() => { setLinkSrc("await"); setAddMenu(false); }}><Link2 size={15} /> Связать два объекта</button>
                <button onClick={addNote}><StickyNote size={15} /> Заметку</button>
                <button onClick={addFrame}><Square size={15} /> Рамку</button>
              </div>
            )}
          </div>
          <button className={"btn" + (showDeals ? " btn-on" : "")} onClick={() => setShowDeals((v) => !v)}>Связки</button>
          <button className="btn" onClick={() => fit(null)}>Вписать</button>
          <button className="btn" onClick={exportPNG} title="Снимок в PNG"><Download size={15} /></button>
          <button className="btn" onClick={resetLayout}>Сбросить</button>
        </div>
      </div>

      {linkSrc && (
        <div className="cv-banner">
          <Link2 size={15} /> {linkSrc === "await" ? "Кликни первый объект (платёжку, казино или трейдера)" : "Теперь кликни второй объект того же гео — создам связку"}
          <button onClick={() => setLinkSrc(null)}>Отмена</button>
        </div>
      )}

      <div className="stage" ref={stageRef}>
        <svg ref={svgRef} onPointerDown={onBgDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
          <defs>
            <marker id="arrowDeal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#f0b232" />
            </marker>
            <marker id="arrowDealOn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#ffd166" />
            </marker>
          </defs>
          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            {extras.filter((x) => x.kind === "frame").map((f) => (
              <g key={f.id}>
                <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={10} fill={f.color + "14"} stroke={f.color}
                  strokeWidth={selExtra === f.id ? 2 : 1.3} strokeDasharray="6 5" style={{ cursor: "move" }}
                  onPointerDown={(e) => onExtraDown(e, f.id)} />
                <text x={f.x + 12} y={f.y + 18} fontSize={13} fontWeight={700} fill={f.color} style={{ pointerEvents: "none" }}>{f.text}</text>
                {selExtra === f.id && <rect x={f.x + f.w - 15} y={f.y + f.h - 15} width={13} height={13} rx={2} fill={f.color} style={{ cursor: "nwse-resize" }} onPointerDown={(e) => onResizeDown(e, f.id)} />}
              </g>
            ))}
            {edges.map((e, i) => {
              const a = byId[e.from], b = byId[e.to]; if (!a || !b || hidden(b)) return null;
              const active = highlight && (highlight.has(e.from) || highlight.has(e.to));
              const dim = highlight && !active;
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={active ? NTYPE[b.type].color : "rgba(255,255,255,.10)"}
                strokeWidth={active ? 2 : 1} strokeDasharray={active ? "none" : "2 5"}
                style={{ opacity: dim ? 0.18 : 1 }} />;
            })}
            {showDeals && deals.map((d, i) => {
              const a = byId[d.from], b = byId[d.to]; if (!a || !b || hidden(a) || hidden(b)) return null;
              const active = highlight && (highlight.has(d.from) || highlight.has(d.to));
              const dim = highlight && !active;
              const p1 = edgePoint(a, b.x, b.y), p2 = edgePoint(b, a.x, a.y);
              const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
              const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy) || 1;
              const off = Math.min(46, len * 0.14);
              const cx = mx + (-dy / len) * off, cy = my + (dx / len) * off;
              const path = `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
              return (
                <g key={"d" + i} style={{ opacity: dim ? 0.12 : 1 }}>
                  <path d={path} fill="none" stroke={active ? "#ffd166" : "#f0b232"} strokeWidth={active ? 2.6 : 2}
                    strokeLinecap="round" markerEnd={active ? "url(#arrowDealOn)" : "url(#arrowDeal)"} />
                </g>
              );
            })}
            {nodes.filter((n) => !hidden(n)).map((n) => {
              const w = nodeW(n), h = n.type === "geo" ? 44 : 34;
              const c = NTYPE[n.type].color;
              const isGeo = n.type === "geo";
              const ring = sel === n.id || linkSrc === n.id || (matches && matches.has(n.id));
              const dim = highlight && !highlight.has(n.id);
              const isCol = collapsed.has(n.id);
              const cnt = childCount[n.id];
              return (
                <g key={n.id} className="cn" transform={`translate(${n.x},${n.y})`}
                  style={{ opacity: dim ? 0.22 : 1, cursor: "grab" }}
                  onPointerDown={(e) => onNodeDown(e, n.id)}>
                  <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2}
                    fill={isGeo ? c : "#171b24"}
                    stroke={ring ? "#fff" : isGeo ? "transparent" : c + "88"}
                    strokeWidth={ring ? 2 : 1.5} />
                  {!isGeo && <circle cx={-w / 2 + 14} cy={0} r={4} fill={c} />}
                  <text x={isGeo ? 0 : -w / 2 + 26} y={1} dominantBaseline="middle"
                    textAnchor={isGeo ? "middle" : "start"}
                    fill={isGeo ? "#0b0d12" : "#e7eaf0"}
                    fontSize={isGeo ? 14 : 12.5} fontWeight={isGeo ? 700 : 500}>
                    {isGeo ? n.flag + "  " + n.label : n.label}
                  </text>
                  {isGeo && cnt ? (
                    <g transform={`translate(${w / 2 - 3},${-h / 2 + 3})`}>
                      <circle r={9.5} fill={isCol ? c : "#0b0d12"} stroke={isCol ? "#0b0d12" : c} strokeWidth={1.5} />
                      <text textAnchor="middle" dominantBaseline="central" y={0.5}
                        fontSize={isCol ? 9 : 10} fontWeight={700} fill={isCol ? "#0b0d12" : c}>
                        {isCol ? "+" + cnt : cnt}
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}
            {extras.filter((x) => x.kind === "note").map((n) => {
              const lines = n.text ? wrapText(n.text, Math.max(6, Math.floor((n.w - 20) / 6.6))) : null;
              return (
                <g key={n.id} style={{ cursor: "move" }} onPointerDown={(e) => onExtraDown(e, n.id)}>
                  <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={9} fill={n.color}
                    stroke={selExtra === n.id ? "#fff" : "rgba(0,0,0,.25)"} strokeWidth={selExtra === n.id ? 2 : 1} />
                  {lines ? (
                    <text x={n.x + 12} y={n.y + 22} fontSize={12.5} fill="#14171d" style={{ pointerEvents: "none" }}>
                      {lines.map((ln, i) => <tspan key={i} x={n.x + 12} dy={i === 0 ? 0 : 16}>{ln}</tspan>)}
                    </text>
                  ) : (
                    <text x={n.x + 12} y={n.y + 22} fontSize={12.5} fill="rgba(20,23,29,.45)" style={{ pointerEvents: "none" }}>заметка…</text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {selExtra && (() => {
          const it = extras.find((x) => x.id === selExtra); if (!it) return null;
          const colors = it.kind === "note" ? NOTE_COLORS : FRAME_COLORS;
          let left = Math.max(8, Math.min(view.x + it.x * view.k, stageSize.w - 238));
          let top = Math.max(8, Math.min(view.y + it.y * view.k + it.h * view.k + 8, stageSize.h - 130));
          return (
            <div className="cv-editor" style={{ left, top }}>
              {it.kind === "note"
                ? <textarea value={it.text} placeholder="Текст заметки…" autoFocus onChange={(e) => updateExtra(it.id, { text: e.target.value })} />
                : <input value={it.text} placeholder="Название рамки" autoFocus onChange={(e) => updateExtra(it.id, { text: e.target.value })} />}
              <div className="cv-ed-row">
                <div className="cv-swatches">{colors.map((c) => <button key={c} style={{ background: c }} className={it.color === c ? "on" : ""} onClick={() => updateExtra(it.id, { color: c })} />)}</div>
                <button className="cv-ed-del" onClick={() => removeExtra(it.id)}><Trash2 size={14} /></button>
                <button className="cv-ed-ok" onClick={() => setSelExtra(null)}>Готово</button>
              </div>
            </div>
          );
        })()}

        {nodes.length > 0 && (() => {
          const pts = [];
          nodes.forEach((n) => { if (!hidden(n)) pts.push([n.x, n.y]); });
          extras.forEach((e) => { pts.push([e.x, e.y]); pts.push([e.x + (e.w || 0), e.y + (e.h || 0)]); });
          if (!pts.length) return null;
          const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
          const minX = Math.min(...xs) - 60, minY = Math.min(...ys) - 60;
          const gw = Math.max(Math.max(...xs) + 60 - minX, 1), gh = Math.max(Math.max(...ys) + 60 - minY, 1);
          const MW = 158, MH = 112, s = Math.min(MW / gw, MH / gh);
          const ox = (MW - gw * s) / 2, oy = (MH - gh * s) / 2;
          const tx = (x) => ox + (x - minX) * s, ty = (y) => oy + (y - minY) * s;
          const vx0 = -view.x / view.k, vy0 = -view.y / view.k;
          const vw = stageSize.w / view.k, vh = stageSize.h / view.k;
          const onMini = (e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const cx = minX + (e.clientX - r.left - ox) / s, cy = minY + (e.clientY - r.top - oy) / s;
            setView((v) => ({ ...v, x: stageSize.w / 2 - cx * v.k, y: stageSize.h / 2 - cy * v.k }));
          };
          return (
            <div className="cv-mini">
              <svg width={MW} height={MH} onPointerDown={onMini}>
                {extras.filter((x) => x.kind === "frame").map((f) => <rect key={f.id} x={tx(f.x)} y={ty(f.y)} width={f.w * s} height={f.h * s} fill="none" stroke={f.color} strokeWidth={1} />)}
                {nodes.filter((n) => !hidden(n)).map((n) => <circle key={n.id} cx={tx(n.x)} cy={ty(n.y)} r={n.type === "geo" ? 3 : 2} fill={NTYPE[n.type].color} />)}
                <rect x={tx(vx0)} y={ty(vy0)} width={vw * s} height={vh * s} fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.6)" strokeWidth={1} />
              </svg>
            </div>
          );
        })()}
      </div>

      <div className="cv-foot">
        <div className="legend">
          {Object.entries(NTYPE).map(([k, t]) => (
            <span key={k}><i style={{ background: t.color }} />{t.label}</span>
          ))}
          <span className="legend-deal"><b style={{ background: "#f0b232" }} />Связка → поток</span>
        </div>
        <span className="cv-hint">Клик по объекту — его связки · «Добавить» — связка/заметка/рамка/связать · перетаскивай всё · PNG — снимок · мини-карта справа внизу</span>
      </div>

      {panelNode && (
        <CanvasNodePanel node={panelNode} list={matchRows(panelNode)} onOpenRow={onOpenRow} onClose={() => setPanelNode(null)} />
      )}
    </div>
  );
}

function CanvasNodePanel({ node, list, onOpenRow, onClose }) {
  const t = NTYPE[node.type];
  const isGeo = node.type === "geo";
  const geo = isGeo ? node.label : node.geoId.slice(4);
  return (
    <div className="np-bg" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="dr-head">
          <div className="dr-geo"><i className="cdot" style={{ background: t.color }} /> {t.label}{!isGeo && " · " + geo}</div>
          <button className="icon-btn neutral" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dr-title">{isGeo ? node.flag + "  " + node.label : node.label}</div>
        <div className="np-sub">Связок: {list.length}</div>
        <div className="dr-body">
          {list.length === 0 && <div className="np-empty">Нет связок для этого объекта.</div>}
          {list.map((r) => (
            <button className="np-card" key={r.id} onClick={() => onOpenRow(r.id)}>
              <div className="np-card-top">
                <span className="np-pair">{[r.pay, r.casino, r.trader].filter(Boolean).join(" → ")}</span>
                <i className="cdot" style={{ background: STATUS[r.status].color }} />
              </div>
              <div className="np-card-meta">
                <span className="tag">{r.method}</span>
                <span className="mono">{r.com}%</span>
                <span className="np-status" style={{ color: STATUS[r.status].color }}>{STATUS[r.status].label}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="dr-foot"><span className="cv-hint">Нажми на связку, чтобы открыть и редактировать</span></div>
      </div>
    </div>
  );
}

function DetailDrawer({ row, onClose, onUpdate, onStatus, onDel }) {
  const up = (k, v) => onUpdate(row.id, { [k]: v });
  const income = Math.round((row.turn * row.com) / 100);
  const log = row.log || [];
  return (
    <div className="drawer-bg" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="dr-head">
          <button className="dr-back" onClick={onClose}>← Назад</button>
          <div className="dr-geo"><span className="flag">{row.flag}</span> {row.geo}</div>
          <button className="icon-btn neutral" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dr-title"><Pair r={row} /></div>
        <div className="dr-status"><StatusPill status={row.status} onChange={(s) => onStatus(row.id, s)} /></div>

        <div className="dr-body">
          <DSection title="Состав связки">
            <div className="dr-grid">
              <DField label="Платёжная система" value={row.pay || ""} placeholder="—" onChange={(v) => up("pay", v)} />
              <DField label="Казино" value={row.casino || ""} placeholder="—" onChange={(v) => up("casino", v)} />
              <DField label="Трейдер" value={row.trader || ""} placeholder="—" onChange={(v) => up("trader", v)} />
              <DField label="Гео" value={row.geo} onChange={(v) => up("geo", v)} />
            </div>
          </DSection>

          <DSection title="Параметры">
            <div className="dr-grid">
              <DField label="Метод" value={row.method} onChange={(v) => up("method", v)} />
              <DField label="Комиссия %" type="number" step="any" value={row.com} onChange={(v) => up("com", parseFloat(v) || 0)} />
              <DField label="Ссылка" value={row.link || ""} placeholder="t.me/… или site.com" onChange={(v) => up("link", v)} />
            </div>
          </DSection>

          <DSection title="Финансы">
            <div className="dr-grid">
              <DField label="Оборот" type="number" value={row.turn} onChange={(v) => up("turn", +v)} />
              <div className="readout">
                <span className="dr-lbl"><TrendingUp size={13} /> Комиссионный доход</span>
                <span className="dr-val mono">{fmt(income)}</span>
              </div>
            </div>
          </DSection>

          <DSection title="Контакт">
            <div className="dr-grid">
              <DField label="Контакт" icon={MessageCircle} value={row.owner || ""} placeholder="@telegram" onChange={(v) => up("owner", v)} />
            </div>
          </DSection>

          <DSection title="Заметка">
            <textarea className="dr-note" value={row.note || ""} placeholder="Реквизиты, договорённости, нюансы по гео…" onChange={(e) => up("note", e.target.value)} />
          </DSection>

          <DSection title="Активность">
            <div className="dr-log">
              {log.length === 0 && <div className="dr-log-empty"><Clock size={13} /> Изменения статуса появятся здесь</div>}
              {log.map((l, i) => (
                <div className="dr-log-item" key={i}>
                  <i className="cdot" style={{ background: "var(--acc)" }} />
                  <span>{l.text}</span>
                  <em>{new Date(l.t).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</em>
                </div>
              ))}
            </div>
          </DSection>
        </div>

        <div className="dr-foot">
          <button className="btn ghost danger" onClick={() => onDel(row.id)}><Trash2 size={15} /> Удалить связку</button>
        </div>
      </div>
    </div>
  );
}

function DSection({ title, children }) {
  return <div className="dr-sec"><div className="dr-sec-t">{title}</div>{children}</div>;
}

function DField({ label, value, onChange, type = "text", placeholder, icon: Icon, step }) {
  return (
    <label className="dr-field">
      <span className="dr-lbl">{Icon && <Icon size={13} />}{label}</span>
      <input type={type} step={step} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

const FIN_SEED = [
  { id: 1, date: "2026-06-02", party: "Blaze", dir: "in", amount: 12500, status: "done", note: "оплата за май" },
  { id: 2, date: "2026-06-01", party: "Mostbet", dir: "in", amount: 8400, status: "done", note: "" },
  { id: 3, date: "2026-05-28", party: "Pin-Up", dir: "in", amount: 6300, status: "done", note: "" },
  { id: 4, date: "2026-06-05", party: "FairSpin", dir: "in", amount: 4300, status: "pending", note: "ждём подтверждение" },
  { id: 5, date: "2026-05-30", party: "Команда RU", dir: "out", amount: 3200, status: "done", note: "выплата трейдерам" },
  { id: 6, date: "2026-06-04", party: "Stake", dir: "in", amount: 9800, status: "done", note: "" },
];

const fmtU = (a) => "₮ " + Number(a || 0).toLocaleString("ru-RU", { maximumFractionDigits: 2 });

function FinanceView({ rows }) {
  const [records, setRecords] = useState(FIN_SEED);
  const [modal, setModal] = useState(null); // null | 'new' | record
  const [q, setQ] = useState("");
  const [dirF, setDirF] = useState("all");
  const [statF, setStatF] = useState("all");
  const [period, setPeriod] = useState("all");
  const readyRef = useRef(false);
  const debRef = useRef(null);

  useEffect(() => {
    (async () => {
      const d = await store.get("finance:data", null);
      if (d && Array.isArray(d.records)) setRecords(d.records);
      readyRef.current = true;
    })();
  }, []);
  useEffect(() => {
    if (!readyRef.current) return;
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => store.set("finance:data", { records }), 400);
    return () => clearTimeout(debRef.current);
  }, [records]);

  const filtered = useMemo(() => {
    const now = new Date();
    const inPeriod = (d) => {
      if (period === "all") return true;
      const rd = new Date(d + "T00:00:00");
      if (period === "month") return rd.getFullYear() === now.getFullYear() && rd.getMonth() === now.getMonth();
      const from = new Date(now); from.setDate(from.getDate() - (period === "30" ? 30 : 90));
      return rd >= from;
    };
    const term = q.trim().toLowerCase();
    return records.filter((r) => {
      if (dirF !== "all" && r.dir !== dirF) return false;
      if (statF !== "all" && r.status !== statF) return false;
      if (!inPeriod(r.date)) return false;
      if (term && !((r.party + " " + (r.note || "")).toLowerCase().includes(term))) return false;
      return true;
    });
  }, [records, q, dirF, statF, period]);

  const sumIf = (pred) => filtered.filter(pred).reduce((s, r) => s + r.amount, 0);
  const received = sumIf((r) => r.dir === "in" && r.status === "done");
  const pending = sumIf((r) => r.dir === "in" && r.status === "pending");
  const paidOut = sumIf((r) => r.dir === "out" && r.status === "done");
  const balance = received - paidOut;

  const chartData = useMemo(() => {
    const m = {};
    filtered.filter((r) => r.dir === "in" && r.status === "done").forEach((r) => { m[r.party] = (m[r.party] || 0) + r.amount; });
    return Object.entries(m).map(([name, v]) => ({ name, v: Math.round(v) })).sort((a, b) => b.v - a.v).slice(0, 6);
  }, [filtered]);

  const debtors = useMemo(() => {
    const now = new Date();
    const inP = (d) => {
      if (period === "all") return true;
      const rd = new Date(d + "T00:00:00");
      if (period === "month") return rd.getFullYear() === now.getFullYear() && rd.getMonth() === now.getMonth();
      const from = new Date(now); from.setDate(from.getDate() - (period === "30" ? 30 : 90));
      return rd >= from;
    };
    const term = q.trim().toLowerCase();
    const m = {};
    records.forEach((r) => {
      if (r.dir === "in" && r.status === "pending" && inP(r.date) && (!term || (r.party + " " + (r.note || "")).toLowerCase().includes(term))) {
        if (!m[r.party]) m[r.party] = { party: r.party, total: 0, count: 0 };
        m[r.party].total += r.amount; m[r.party].count++;
      }
    });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [records, q, period]);
  const debtTotal = debtors.reduce((s, d) => s + d.total, 0);
  const markPaid = (party) => setRecords((rs) => rs.map((r) => (r.party === party && r.dir === "in" && r.status === "pending" ? { ...r, status: "done" } : r)));

  const parties = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => { if (r.casino) s.add(r.casino); });
    records.forEach((r) => { if (r.party) s.add(r.party); });
    return [...s];
  }, [rows, records]);

  const save = (rec) => {
    setRecords((rs) => rec.id && rs.some((x) => x.id === rec.id)
      ? rs.map((x) => (x.id === rec.id ? rec : x))
      : [{ ...rec, id: Date.now() }, ...rs]);
    setModal(null);
  };
  const del = (id) => setRecords((rs) => rs.filter((x) => x.id !== id));

  return (
    <div className="fin">
      <header className="top">
        <div>
          <h1>Финансы</h1>
          <p className="sub">Сколько платят казино и площадки — в USDT</p>
        </div>
        <button className="btn accent" onClick={() => setModal("new")}><Plus size={16} /> Платёж</button>
      </header>

      <div className="toolbar fin-tb">
        <div className="searchbox">
          <Search size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: плательщик или заметка…" />
        </div>
      </div>
      <div className="chips">
        <span className="chips-label"><Filter size={13} /> Период</span>
        <Chip on={period === "all"} onClick={() => setPeriod("all")}>Всё время</Chip>
        <Chip on={period === "month"} onClick={() => setPeriod("month")}>Этот месяц</Chip>
        <Chip on={period === "30"} onClick={() => setPeriod("30")}>30 дней</Chip>
        <Chip on={period === "90"} onClick={() => setPeriod("90")}>90 дней</Chip>
        <span className="chips-sep" />
        <span className="chips-label">Тип</span>
        <Chip on={dirF === "all"} onClick={() => setDirF("all")}>Все</Chip>
        <Chip on={dirF === "in"} onClick={() => setDirF("in")} dot="#3fb950">Приход</Chip>
        <Chip on={dirF === "out"} onClick={() => setDirF("out")} dot="#f85149">Расход</Chip>
        <span className="chips-sep" />
        <span className="chips-label">Статус</span>
        <Chip on={statF === "all"} onClick={() => setStatF("all")}>Все</Chip>
        <Chip on={statF === "done"} onClick={() => setStatF("done")}>Проведён</Chip>
        <Chip on={statF === "pending"} onClick={() => setStatF("pending")}>Ожидается</Chip>
      </div>

      <div className="stats fin-stats">
        <div className="stat"><div className="stat-label">Получено</div><div className="stat-value" style={{ color: "#3fb950" }}>{fmtU(received)}</div></div>
        <div className="stat"><div className="stat-label">Ожидается</div><div className="stat-value" style={{ color: "#d29922" }}>{fmtU(pending)}</div></div>
        <div className="stat"><div className="stat-label">Выплачено</div><div className="stat-value" style={{ color: "#f85149" }}>{fmtU(paidOut)}</div></div>
        <div className="stat"><div className="stat-label">Баланс</div><div className="stat-value">{fmtU(balance)}</div></div>
      </div>

      <div className="fin-grid">
        <div className="tablewrap fin-table">
          <table>
            <thead><tr><th>Дата</th><th>От кого / кому</th><th className="num">Сумма</th><th>Статус</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: "center", padding: "24px" }}>{records.length ? "Ничего не найдено" : "Пока нет платежей"}</td></tr>}
              {[...filtered].sort((a, b) => (a.date < b.date ? 1 : -1)).map((r) => (
                <tr key={r.id} className="row" onClick={() => setModal(r)}>
                  <td className="mono">{r.date}</td>
                  <td>{r.party || "—"}</td>
                  <td className="num">
                    <span className={"fin-amt " + (r.dir === "in" ? "in" : "out")}>
                      {r.dir === "in" ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                      {fmtU(r.amount)}
                    </span>
                  </td>
                  <td>{r.status === "done" ? <span className="fin-st done">проведён</span> : <span className="fin-st pend">ожидается</span>}</td>
                  <td onClick={(e) => e.stopPropagation()}><button className="icon-btn" onClick={() => del(r.id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="fin-side">
          <div className="fin-chart">
            <div className="fin-chart-t">Кто сколько заплатил</div>
            {chartData.length === 0 ? <div className="muted" style={{ padding: "20px", fontSize: "13px" }}>Нет данных</div> : (
              <div style={{ width: "100%", height: Math.max(140, chartData.length * 40) }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={108} tick={{ fontSize: 12, fill: "#8a91a0" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,.05)" }} contentStyle={{ background: "#12151c", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, fontSize: 12 }} formatter={(v) => fmtU(v)} />
                    <Bar dataKey="v" radius={[0, 5, 5, 0]} fill="#2dd4bf" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="fin-debt">
            <div className="fin-debt-head">
              <div className="fin-chart-t">Должники <span className="muted">· ждём оплату</span></div>
              <button className="debt-add" onClick={() => setModal({ dir: "in", status: "pending" })}><Plus size={14} /> Должник</button>
            </div>
            {debtors.length === 0 ? (
              <div className="muted" style={{ padding: "14px 2px", fontSize: "13px" }}>Должников нет — все рассчитались.</div>
            ) : (
              <>
                {debtors.map((d) => (
                  <div className="debt-row" key={d.party}>
                    <div className="debt-info">
                      <span className="debt-name">{d.party}</span>
                      <span className="debt-cnt">{d.count} плат.</span>
                    </div>
                    <span className="debt-amt">{fmtU(d.total)}</span>
                    <button className="debt-ok" title="Отметить полученным" onClick={() => markPaid(d.party)}>Получено</button>
                  </div>
                ))}
                <div className="debt-total"><span>Всего ждём</span><b>{fmtU(debtTotal)}</b></div>
              </>
            )}
          </div>
        </div>
      </div>

      {modal && <FinModal initial={modal === "new" ? null : modal} parties={parties} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

function FinModal({ initial, parties, onClose, onSave }) {
  const isEdit = !!(initial && initial.id);
  const base = { date: new Date().toISOString().slice(0, 10), party: "", dir: "in", amount: "", status: "done", note: "" };
  const [f, setF] = useState({ ...base, ...(initial || {}), amount: initial && initial.amount != null ? String(initial.amount) : "" });
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const ok = f.party.trim() && Number(f.amount) > 0;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{isEdit ? "Платёж" : "Новый платёж"}</h3>
          <button className="icon-btn neutral" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form">
          <div className="form-row">
            <Field label="Дата"><input type="date" value={f.date} onChange={(e) => up("date", e.target.value)} /></Field>
            <Field label="Направление">
              <select value={f.dir} onChange={(e) => up("dir", e.target.value)}>
                <option value="in">Приход (нам платят)</option>
                <option value="out">Расход (выплата)</option>
              </select>
            </Field>
          </div>
          <Field label="От кого / кому">
            <input list="fin-parties" value={f.party} onChange={(e) => up("party", e.target.value)} placeholder="напр. Mostbet" />
            <datalist id="fin-parties">{parties.map((p) => <option key={p} value={p} />)}</datalist>
          </Field>
          <div className="form-row">
            <Field label="Сумма, ₮">
              <input type="text" inputMode="decimal" value={f.amount} placeholder="0"
                onChange={(e) => up("amount", e.target.value.replace(/[^\d.,]/g, "").replace(",", "."))} />
            </Field>
            <Field label="Статус">
              <select value={f.status} onChange={(e) => up("status", e.target.value)}>
                <option value="done">Проведён</option>
                <option value="pending">Ожидается</option>
              </select>
            </Field>
          </div>
          <Field label="Заметка"><input value={f.note} onChange={(e) => up("note", e.target.value)} placeholder="необязательно" /></Field>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Отмена</button>
          <button className="btn accent" disabled={!ok} onClick={() => onSave({ ...f, amount: Number(f.amount) })}><Plus size={16} /> {isEdit ? "Сохранить" : "Добавить"}</button>
        </div>
      </div>
    </div>
  );
}

const PRIO = {
  high:   { label: "Высокий", color: "#f85149" },
  normal: { label: "Обычный", color: "#f0883e" },
  low:    { label: "Низкий",  color: "#6e7681" },
};
const PRIO_ORDER = ["high", "normal", "low"];
const TASK_COLS = [{ key: "todo", label: "Надо" }, { key: "doing", label: "В работе" }, { key: "done", label: "Готово" }];
const TASK_SEED = [
  { id: 1, text: "Выбить долг с FairSpin", status: "todo", prio: "high" },
  { id: 2, text: "Проверить лимит у SBP-Provider A", status: "todo", prio: "normal" },
  { id: 3, text: "Списаться с провайдером по Индии", status: "todo", prio: "low" },
  { id: 4, text: "Переподключить TR-CryptoX (не газ)", status: "doing", prio: "high" },
  { id: 5, text: "Завести связку Vavada ↔ KZ-P2P", status: "doing", prio: "normal" },
  { id: 6, text: "Подтвердить оплату Blaze", status: "done", prio: "normal" },
];

function TasksView() {
  const [tasks, setTasks] = useState(TASK_SEED);
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const readyRef = useRef(false);
  const debRef = useRef(null);
  const dragId = useRef(null);

  useEffect(() => {
    (async () => {
      const d = await store.get("tasks:data", null);
      if (Array.isArray(d)) setTasks(d);
      readyRef.current = true;
    })();
  }, []);
  useEffect(() => {
    if (!readyRef.current) return;
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => store.set("tasks:data", tasks), 400);
    return () => clearTimeout(debRef.current);
  }, [tasks]);

  const add = () => { const t = text.trim(); if (!t) return; setTasks((ts) => [{ id: Date.now(), text: t, status: "todo", prio: "normal" }, ...ts]); setText(""); };
  const update = (id, patch) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const del = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));
  const cycle = (id, p) => update(id, { prio: PRIO_ORDER[(PRIO_ORDER.indexOf(p) + 1) % 3] });
  const colTasks = (k) => tasks.filter((t) => t.status === k).sort((a, b) => PRIO_ORDER.indexOf(a.prio) - PRIO_ORDER.indexOf(b.prio));

  return (
    <div className="tk">
      <header className="top">
        <div>
          <h1>Задачи</h1>
          <p className="sub">Доска: что надо, что в работе, что готово</p>
        </div>
      </header>

      <div className="tk-add">
        <Plus size={16} />
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="Что нужно сделать? Enter — добавить" />
      </div>

      <div className="tk-board">
        {TASK_COLS.map((c) => {
          const list = colTasks(c.key);
          return (
            <div key={c.key} className={"tk-col" + (overCol === c.key ? " over" : "")}
              onDragOver={(e) => { e.preventDefault(); if (overCol !== c.key) setOverCol(c.key); }}
              onDragLeave={(e) => { if (e.currentTarget === e.target) setOverCol(null); }}
              onDrop={(e) => { e.preventDefault(); if (dragId.current != null) update(dragId.current, { status: c.key }); dragId.current = null; setOverCol(null); }}>
              <div className="tk-col-head"><span>{c.label}</span><em>{list.length}</em></div>
              <div className="tk-col-body">
                {list.map((t) => {
                  const p = PRIO[t.prio];
                  return (
                    <div key={t.id} className="tk-card" draggable onDragStart={() => { dragId.current = t.id; }} style={{ borderLeftColor: p.color }}>
                      <button className="tk-prio" style={{ background: p.color }} title={"Приоритет: " + p.label} onClick={() => cycle(t.id, t.prio)} />
                      {editId === t.id ? (
                        <input className="tk-edit" autoFocus value={t.text}
                          onChange={(e) => update(t.id, { text: e.target.value })}
                          onBlur={() => setEditId(null)}
                          onKeyDown={(e) => { if (e.key === "Enter") setEditId(null); }} />
                      ) : (
                        <span className={"tk-text" + (c.key === "done" ? " done" : "")} onClick={() => setEditId(t.id)}>{t.text}</span>
                      )}
                      <button className="tk-del" onClick={() => del(t.id)}><X size={13} /></button>
                    </div>
                  );
                })}
                {list.length === 0 && <div className="tk-empty">пусто</div>}
              </div>
            </div>
          );
        })}
      </div>

      <p className="tk-hint">Перетаскивай карточки между колонками · клик по точке меняет приоритет · клик по тексту — редактировать</p>
    </div>
  );
}

const CRM_TYPE = {
  provider: { label: "Провайдер", color: "#2dd4bf" },
  casino:   { label: "Казино",    color: "#a78bfa" },
  trader:   { label: "Трейдер",   color: "#38bdf8" },
  partner:  { label: "Партнёр",   color: "#3fb950" },
  other:    { label: "Другое",    color: "#8b949e" },
};
const CRM_TYPE_ORDER = ["provider", "casino", "trader", "partner", "other"];
const CRM_SEED = [
  { id: 1, name: "Лена", type: "partner", org: "Команда RU", tg: "@lena", phone: "", note: "Крипто-направление, РФ + Турция" },
  { id: 2, name: "SBP Provider A", type: "provider", org: "SBP-Provider A", tg: "@sbp_support", phone: "", note: "СБП, RUB, комиссия 8%" },
  { id: 3, name: "Mostbet aff", type: "casino", org: "Mostbet", tg: "@mostbet_aff", phone: "", note: "Турция, Papara" },
  { id: 4, name: "Дамир", type: "trader", org: "KZ-P2P", tg: "@damir", phone: "", note: "Казахстан, P2P" },
  { id: 5, name: "Carlos", type: "casino", org: "Blaze", tg: "@carlos_blz", phone: "", note: "Бразилия, PIX" },
  { id: 6, name: "CryptoPay", type: "provider", org: "CryptoPay", tg: "@cryptopay", phone: "", note: "USDT, низкая комиссия" },
];

const initialsOf = (n) => (n || "").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
const tgUrl = (s) => (/^https?:/i.test(s) ? s : "https://t.me/" + s.replace(/^@/, ""));

const KB_TAGS = ["Реквизиты", "Мануалы", "Чек-листы", "Гео", "Контакты"];
const KB_SEED = [
  { id: 1, title: "Реквизиты SBP-Provider A", tag: "Реквизиты", body: "Метод: СБП\nВалюта: RUB\nКомиссия: 8%\nЛимит/день: 5 000 000\nКонтакт: @sbp_support\n\nНюансы: подтверждение оплат в течение 5–15 минут.", updated: Date.now() - 86400000 },
  { id: 2, title: "Подключение P2P в Казахстане", tag: "Мануалы", body: "1. Согласовать ставку с трейдером\n2. Прогнать тестовый депозит\n3. Проверить лимиты по картам\n4. Зафиксировать связку в реестре\n5. Поставить на мониторинг статуса", updated: Date.now() - 3600000 * 5 },
  { id: 3, title: "Чек-лист нового казино", tag: "Чек-листы", body: "— Гео и разрешённые методы\n— Комиссия и лимиты\n— Ответственный контакт (телеграм)\n— Тестовый трафик\n— Условия выплат и периодичность", updated: Date.now() - 3600000 * 30 },
  { id: 4, title: "Турция: Papara, нюансы", tag: "Гео", body: "Основной метод — Papara, валюта TRY.\nКрипто (USDT) как резерв.\nСледить за лимитами в выходные.", updated: Date.now() - 3600000 * 2 },
];

function KBView() {
  const [notes, setNotes] = useState(KB_SEED);
  const [selId, setSelId] = useState(KB_SEED[0] ? KB_SEED[0].id : null);
  const [q, setQ] = useState("");
  const [tagF, setTagF] = useState("all");
  const [tab, setTab] = useState("notes");
  const readyRef = useRef(false);
  const debRef = useRef(null);

  useEffect(() => {
    (async () => {
      const d = await store.get("kb:data", null);
      if (Array.isArray(d)) { setNotes(d); setSelId(d[0] ? d[0].id : null); }
      readyRef.current = true;
    })();
  }, []);
  useEffect(() => {
    if (!readyRef.current) return;
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => store.set("kb:data", notes), 400);
    return () => clearTimeout(debRef.current);
  }, [notes]);

  const tags = useMemo(() => [...new Set(notes.map((n) => n.tag).filter(Boolean))], [notes]);
  const tagSuggest = useMemo(() => [...new Set([...tags, ...KB_TAGS])], [tags]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return notes.filter((n) => {
      if (tagF !== "all" && n.tag !== tagF) return false;
      if (term && ![n.title, n.body, n.tag].join(" ").toLowerCase().includes(term)) return false;
      return true;
    }).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  }, [notes, q, tagF]);

  const sel = notes.find((n) => n.id === selId) || null;

  const update = (id, patch) => setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch, updated: Date.now() } : n)));
  const add = () => { const id = Date.now(); setNotes((ns) => [{ id, title: "", tag: "", body: "", updated: id }, ...ns]); setSelId(id); };
  const del = (id) => { setNotes((ns) => ns.filter((n) => n.id !== id)); setSelId((cur) => (cur === id ? null : cur)); };

  return (
    <div className="kb">
      <header className="top">
        <div>
          <h1>База знаний</h1>
          <p className="sub">Мануалы, реквизиты, инструкции и офферы — в одном месте</p>
        </div>
        <div className="kb-headright">
          <div className="seg">
            <button className={tab === "notes" ? "on" : ""} onClick={() => setTab("notes")}>Заметки</button>
            <button className={tab === "offers" ? "on" : ""} onClick={() => setTab("offers")}>Офферы</button>
          </div>
          {tab === "notes" && <button className="btn accent" onClick={add}><Plus size={16} /> Заметка</button>}
        </div>
      </header>

      {tab === "notes" ? (
      <div className="kb-body">
        <div className="kb-list">
          <div className="kb-search">
            <Search size={15} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по базе…" />
          </div>
          <div className="kb-tags">
            <button className={"kb-tag" + (tagF === "all" ? " on" : "")} onClick={() => setTagF("all")}>Все</button>
            {tags.map((t) => <button key={t} className={"kb-tag" + (tagF === t ? " on" : "")} onClick={() => setTagF(t)}>{t}</button>)}
          </div>
          <div className="kb-items">
            {filtered.length === 0 && <div className="kb-empty">{notes.length ? "Ничего не найдено" : "Создай первую заметку"}</div>}
            {filtered.map((n) => (
              <button key={n.id} className={"kb-item" + (n.id === selId ? " on" : "")} onClick={() => setSelId(n.id)}>
                <div className="kb-item-t">{n.title || "Без названия"}</div>
                <div className="kb-item-s">{(n.body || "").replace(/\n/g, " ").slice(0, 64) || "пусто"}</div>
                {n.tag && <span className="kb-item-tag">{n.tag}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="kb-editor">
          {sel ? (
            <>
              <input className="kb-title" value={sel.title} placeholder="Заголовок заметки" onChange={(e) => update(sel.id, { title: e.target.value })} />
              <div className="kb-edit-meta">
                <input className="kb-tag-input" list="kb-tags-list" value={sel.tag} placeholder="категория" onChange={(e) => update(sel.id, { tag: e.target.value })} />
                <datalist id="kb-tags-list">{tagSuggest.map((t) => <option key={t} value={t} />)}</datalist>
                <span className="kb-upd">изменено {new Date(sel.updated).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })}</span>
                <button className="icon-btn" onClick={() => del(sel.id)}><Trash2 size={15} /></button>
              </div>
              <textarea className="kb-area" value={sel.body} placeholder="Текст заметки: реквизиты, шаги, нюансы…" onChange={(e) => update(sel.id, { body: e.target.value })} />
            </>
          ) : (
            <div className="kb-none"><BookOpen size={26} /><p>Выбери заметку слева или создай новую</p></div>
          )}
        </div>
      </div>
      ) : <KBOffers />}
    </div>
  );
}

const OFFER_TYPES = ["CPA", "RevShare", "Hybrid", "Fix"];
const OFFER_ST = {
  active:  { label: "Активен", color: "#3fb950" },
  paused:  { label: "Пауза",   color: "#d29922" },
  archive: { label: "Архив",   color: "#8b949e" },
};
const OFFER_ST_ORDER = ["active", "paused", "archive"];
const OFFER_SEED = [
  { id: 1, name: "Mostbet", geo: "Турция", type: "CPA", terms: "$45 CPA, baseline $25", status: "active", note: "" },
  { id: 2, name: "Blaze", geo: "Бразилия", type: "RevShare", terms: "35% RevShare", status: "active", note: "PIX" },
  { id: 3, name: "Pin-Up", geo: "Казахстан", type: "Hybrid", terms: "$30 + 20%", status: "active", note: "" },
  { id: 4, name: "1xStake", geo: "Россия", type: "CPA", terms: "$50 CPA", status: "paused", note: "тест" },
];

function KBOffers() {
  const [offers, setOffers] = useState(OFFER_SEED);
  const [q, setQ] = useState("");
  const [statF, setStatF] = useState("all");
  const [modal, setModal] = useState(null);
  const [copied, setCopied] = useState(null);
  const [sel, setSel] = useState(() => new Set());
  const readyRef = useRef(false);
  const debRef = useRef(null);

  useEffect(() => {
    (async () => {
      const d = await store.get("kb:offers", null);
      if (Array.isArray(d)) setOffers(d);
      readyRef.current = true;
    })();
  }, []);
  useEffect(() => {
    if (!readyRef.current) return;
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => store.set("kb:offers", offers), 400);
    return () => clearTimeout(debRef.current);
  }, [offers]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return offers.filter((o) => {
      if (statF !== "all" && o.status !== statF) return false;
      if (term && ![o.name, o.geo, o.type, o.terms, o.note].join(" ").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [offers, q, statF]);

  const offerText = (o) => `${o.name}${o.geo ? " — " + o.geo : ""}\nТип: ${o.type}\nУсловия: ${o.terms || "—"}${o.note ? "\nЗаметка: " + o.note : ""}`;
  const copyText = async (text, id) => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      } catch {}
    }
    setCopied(id); setTimeout(() => setCopied((c) => (c === id ? null : c)), 1400);
  };

  const save = (rec) => {
    setOffers((os) => rec.id && os.some((x) => x.id === rec.id) ? os.map((x) => (x.id === rec.id ? rec : x)) : [{ ...rec, id: Date.now() }, ...os]);
    setModal(null);
  };
  const del = (id) => setOffers((os) => os.filter((x) => x.id !== id));

  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = filtered.length > 0 && filtered.every((o) => sel.has(o.id));
  const toggleAll = () => setSel(allOn ? new Set() : new Set(filtered.map((o) => o.id)));
  const selList = filtered.filter((o) => sel.has(o.id));

  return (
    <div className="off">
      <div className="toolbar">
        <div className="searchbox">
          <Search size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: бренд, гео, условия…" />
        </div>
        <button className="btn" disabled={!selList.length} onClick={() => copyText(selList.map(offerText).join("\n\n"), "sel")}>
          {copied === "sel" ? <><Check size={15} /> Скопировано</> : <><Copy size={15} /> Копировать выбранные{selList.length ? ` (${selList.length})` : ""}</>}
        </button>
        <button className="btn accent" onClick={() => setModal("new")}><Plus size={16} /> Оффер</button>
      </div>
      <div className="chips">
        <span className="chips-label"><Filter size={13} /> Статус</span>
        <Chip on={statF === "all"} onClick={() => setStatF("all")}>Все</Chip>
        {OFFER_ST_ORDER.map((s) => <Chip key={s} on={statF === s} onClick={() => setStatF(s)} dot={OFFER_ST[s].color}>{OFFER_ST[s].label}</Chip>)}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">{offers.length ? "Ничего не найдено." : "Пока нет офферов."}</div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead><tr><th className="off-check"><input type="checkbox" checked={allOn} onChange={toggleAll} /></th><th>Оффер</th><th>Гео</th><th>Тип</th><th>Условия</th><th>Статус</th><th></th></tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="row" onClick={() => setModal(o)}>
                  <td className="off-check" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.has(o.id)} onChange={() => toggle(o.id)} /></td>
                  <td><b>{o.name}</b></td>
                  <td>{o.geo || "—"}</td>
                  <td><span className="tag">{o.type}</span></td>
                  <td className="mono">{o.terms || "—"}</td>
                  <td><span className="off-st" style={{ color: OFFER_ST[o.status].color }}>{OFFER_ST[o.status].label}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="off-actions">
                      <button className={"icon-btn copy" + (copied === o.id ? " ok" : "")} title="Скопировать для трейдера" onClick={() => copyText(offerText(o), o.id)}>
                        {copied === o.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button className="icon-btn" onClick={() => del(o.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <OfferModal initial={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

function OfferModal({ initial, onClose, onSave }) {
  const isEdit = !!(initial && initial.id);
  const base = { name: "", geo: "", type: "CPA", terms: "", status: "active", note: "" };
  const [f, setF] = useState({ ...base, ...(initial || {}) });
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const ok = f.name.trim();
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{isEdit ? "Оффер" : "Новый оффер"}</h3>
          <button className="icon-btn neutral" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form">
          <div className="form-row">
            <Field label="Бренд / оффер"><input value={f.name} onChange={(e) => up("name", e.target.value)} placeholder="напр. Mostbet" /></Field>
            <Field label="Гео"><input value={f.geo} onChange={(e) => up("geo", e.target.value)} placeholder="напр. Турция" /></Field>
          </div>
          <div className="form-row">
            <Field label="Тип выплаты">
              <select value={f.type} onChange={(e) => up("type", e.target.value)}>
                {OFFER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Статус">
              <select value={f.status} onChange={(e) => up("status", e.target.value)}>
                {OFFER_ST_ORDER.map((s) => <option key={s} value={s}>{OFFER_ST[s].label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Условия"><input value={f.terms} onChange={(e) => up("terms", e.target.value)} placeholder="напр. $45 CPA, baseline $25" /></Field>
          <Field label="Заметка"><input value={f.note} onChange={(e) => up("note", e.target.value)} placeholder="необязательно" /></Field>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Отмена</button>
          <button className="btn accent" disabled={!ok} onClick={() => onSave(f)}><Plus size={16} /> {isEdit ? "Сохранить" : "Добавить"}</button>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ rows, onOpenRow, onGo }) {
  const [fin, setFin] = useState(FIN_SEED);
  const [tasks, setTasks] = useState(TASK_SEED);
  useEffect(() => {
    (async () => {
      const f = await store.get("finance:data", null);
      if (f && Array.isArray(f.records)) setFin(f.records);
      const t = await store.get("tasks:data", null);
      if (Array.isArray(t)) setTasks(t);
    })();
  }, []);

  const gas = rows.filter((r) => r.status === "gas");
  const nogas = rows.filter((r) => r.status === "nogas");
  const pendingRecs = fin.filter((r) => r.dir === "in" && r.status === "pending");
  const pendingSum = pendingRecs.reduce((s, r) => s + r.amount, 0);
  const doing = tasks.filter((t) => t.status === "doing");
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const recent = fin.filter((r) => r.dir === "in" && r.status === "done").slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
  const pairText = (r) => [r.pay, r.casino, r.trader].filter(Boolean).join(" → ");

  return (
    <div className="dash">
      <header className="top">
        <div><h1>Дашборд</h1><p className="sub">Всё важное на одном экране</p></div>
      </header>

      <div className="stats dash-stats">
        <div className="stat"><div className="stat-label">Активные связки</div><div className="stat-value" style={{ color: "#3fb950" }}>{gas.length}</div><div className="stat-sub">из {rows.length}</div></div>
        <div className="stat"><div className="stat-label">Не газ</div><div className="stat-value" style={{ color: nogas.length ? "#f85149" : undefined }}>{nogas.length}</div><div className="stat-sub">нужно чинить</div></div>
        <div className="stat"><div className="stat-label">Ждём оплату</div><div className="stat-value" style={{ color: "#d29922" }}>{fmtU(pendingSum)}</div><div className="stat-sub">{pendingRecs.length} ожидается</div></div>
        <div className="stat"><div className="stat-label">Задачи в работе</div><div className="stat-value">{doing.length}</div><div className="stat-sub">{todoCount} в очереди</div></div>
      </div>

      <div className="dash-grid">
        <DashPanel title="Задачи в работе" color="#818cf8" goLabel="Задачи" onGo={() => onGo("tasks")}>
          {doing.length === 0 ? <div className="dash-empty">Нет задач в работе.</div> : doing.map((t) => (
            <div key={t.id} className="dash-row">
              <i className="cdot" style={{ background: PRIO[t.prio].color }} />
              <span className="dash-row-t">{t.text}</span>
            </div>
          ))}
        </DashPanel>

        <DashPanel title="Проблемные связки" color="#f85149" goLabel="Реестр" onGo={() => onGo("registry")}>
          {nogas.length === 0 ? <div className="dash-empty">Все связки в порядке.</div> : nogas.map((r) => (
            <button key={r.id} className="dash-row btn-row" onClick={() => onOpenRow(r.id)}>
              <span className="flag">{r.flag}</span>
              <span className="dash-row-t">{pairText(r) || "—"}</span>
              <span className="dash-badge" style={{ color: "#f85149" }}>не газ</span>
            </button>
          ))}
        </DashPanel>

        <DashPanel title="Последние поступления" color="#3fb950" goLabel="Финансы" onGo={() => onGo("finance")}>
          {recent.length === 0 ? <div className="dash-empty">Пока нет поступлений.</div> : recent.map((r) => (
            <div key={r.id} className="dash-row">
              <ArrowDownLeft size={13} style={{ color: "#3fb950", flexShrink: 0 }} />
              <span className="dash-row-t">{r.party}</span>
              <span className="dash-date mono">{r.date.slice(5)}</span>
              <span className="dash-amt" style={{ color: "#3fb950" }}>{fmtU(r.amount)}</span>
            </div>
          ))}
        </DashPanel>
      </div>
    </div>
  );
}

function DashPanel({ title, color, goLabel, onGo, children }) {
  return (
    <div className="dash-panel">
      <div className="dash-panel-h">
        <span className="dash-panel-t"><i className="cdot" style={{ background: color }} /> {title}</span>
        <button className="dash-go" onClick={onGo}>{goLabel} <ArrowRight size={13} /></button>
      </div>
      <div className="dash-panel-b">{children}</div>
    </div>
  );
}

function CRMView({ rows }) {
  const [contacts, setContacts] = useState(CRM_SEED);
  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [modal, setModal] = useState(null);
  const readyRef = useRef(false);
  const debRef = useRef(null);

  useEffect(() => {
    (async () => {
      const d = await store.get("crm:data", null);
      if (Array.isArray(d)) setContacts(d);
      readyRef.current = true;
    })();
  }, []);
  useEffect(() => {
    if (!readyRef.current) return;
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => store.set("crm:data", contacts), 400);
    return () => clearTimeout(debRef.current);
  }, [contacts]);

  const orgs = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => { [r.pay, r.casino, r.trader].forEach((v) => { if (v) s.add(v); }); });
    contacts.forEach((c) => { if (c.org) s.add(c.org); });
    return [...s];
  }, [rows, contacts]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return contacts.filter((c) => {
      if (typeF !== "all" && c.type !== typeF) return false;
      if (term && ![c.name, c.org, c.tg, c.note].join(" ").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [contacts, q, typeF]);

  const save = (rec) => {
    setContacts((cs) => rec.id && cs.some((x) => x.id === rec.id) ? cs.map((x) => (x.id === rec.id ? rec : x)) : [{ ...rec, id: Date.now() }, ...cs]);
    setModal(null);
  };
  const del = (id) => setContacts((cs) => cs.filter((x) => x.id !== id));

  return (
    <div className="crm">
      <header className="top">
        <div>
          <h1>CRM-контакты</h1>
          <p className="sub">Провайдеры, казино, трейдеры и партнёры в одном месте</p>
        </div>
        <button className="btn accent" onClick={() => setModal("new")}><Plus size={16} /> Контакт</button>
      </header>

      <div className="toolbar fin-tb">
        <div className="searchbox">
          <Search size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: имя, компания, телеграм…" />
        </div>
      </div>
      <div className="chips">
        <span className="chips-label"><Filter size={13} /> Тип</span>
        <Chip on={typeF === "all"} onClick={() => setTypeF("all")}>Все</Chip>
        {CRM_TYPE_ORDER.map((t) => <Chip key={t} on={typeF === t} onClick={() => setTypeF(t)} dot={CRM_TYPE[t].color}>{CRM_TYPE[t].label}</Chip>)}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">{contacts.length ? "Ничего не найдено." : "Пока нет контактов."}</div>
      ) : (
        <div className="crm-grid">
          {filtered.map((c) => {
            const t = CRM_TYPE[c.type] || CRM_TYPE.other;
            return (
              <div className="crm-card" key={c.id} onClick={() => setModal(c)}>
                <div className="crm-av" style={{ background: t.color + "22", color: t.color }}>{initialsOf(c.name)}</div>
                <div className="crm-main">
                  <div className="crm-name">{c.name}</div>
                  <div className="crm-meta"><span style={{ color: t.color }}>{t.label}</span>{c.org && <span className="crm-org"> · {c.org}</span>}</div>
                  {c.tg && <a className="crm-tg" href={tgUrl(c.tg)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><MessageCircle size={12} /> {c.tg}</a>}
                </div>
                <button className="crm-del" onClick={(e) => { e.stopPropagation(); del(c.id); }}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}

      {modal && <CrmModal initial={modal === "new" ? null : modal} orgs={orgs} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

function CrmModal({ initial, orgs, onClose, onSave }) {
  const isEdit = !!(initial && initial.id);
  const base = { name: "", type: "provider", org: "", tg: "", phone: "", note: "" };
  const [f, setF] = useState({ ...base, ...(initial || {}) });
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const ok = f.name.trim();
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{isEdit ? "Контакт" : "Новый контакт"}</h3>
          <button className="icon-btn neutral" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form">
          <div className="form-row">
            <Field label="Имя"><input value={f.name} onChange={(e) => up("name", e.target.value)} placeholder="напр. Лена" /></Field>
            <Field label="Тип">
              <select value={f.type} onChange={(e) => up("type", e.target.value)}>
                {CRM_TYPE_ORDER.map((t) => <option key={t} value={t}>{CRM_TYPE[t].label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Компания / проект">
            <input list="crm-orgs" value={f.org} onChange={(e) => up("org", e.target.value)} placeholder="напр. Mostbet" />
            <datalist id="crm-orgs">{orgs.map((o) => <option key={o} value={o} />)}</datalist>
          </Field>
          <div className="form-row">
            <Field label="Telegram"><input value={f.tg} onChange={(e) => up("tg", e.target.value)} placeholder="@username" /></Field>
            <Field label="Телефон / др."><input value={f.phone} onChange={(e) => up("phone", e.target.value)} placeholder="необязательно" /></Field>
          </div>
          <Field label="Заметка"><input value={f.note} onChange={(e) => up("note", e.target.value)} placeholder="гео, направление, нюансы" /></Field>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Отмена</button>
          <button className="btn accent" disabled={!ok} onClick={() => onSave(f)}><Plus size={16} /> {isEdit ? "Сохранить" : "Добавить"}</button>
        </div>
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdd }) {
  const [f, setF] = useState({ geo: "Россия", flag: "🇷🇺", pay: "", casino: "", trader: "", method: "СБП", com: 8, link: "", owner: "", status: "wait" });
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const ok = [f.pay, f.casino, f.trader].some((x) => x.trim());
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Новая связка</h3>
          <button className="icon-btn neutral" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form">
          <p className="form-hint">Заполни хотя бы одну из трёх позиций — платёжку, казино или трейдера.</p>
          <Field label="Платёжная система"><input value={f.pay} onChange={(e) => up("pay", e.target.value)} placeholder="напр. SBP-Provider B" /></Field>
          <Field label="Казино / площадка"><input value={f.casino} onChange={(e) => up("casino", e.target.value)} placeholder="напр. Pin-Up" /></Field>
          <Field label="Трейдер"><input value={f.trader} onChange={(e) => up("trader", e.target.value)} placeholder="напр. Трейдер #7" /></Field>
          <div className="form-row">
            <Field label="Гео"><input value={f.geo} onChange={(e) => up("geo", e.target.value)} /></Field>
            <Field label="Метод"><input value={f.method} onChange={(e) => up("method", e.target.value)} /></Field>
          </div>
          <div className="form-row">
            <Field label="Комиссия %"><input type="number" step="any" value={f.com} onChange={(e) => up("com", parseFloat(e.target.value) || 0)} /></Field>
            <Field label="Контакт"><input value={f.owner} onChange={(e) => up("owner", e.target.value)} placeholder="@telegram" /></Field>
          </div>
          <Field label="Ссылка"><input value={f.link} onChange={(e) => up("link", e.target.value)} placeholder="t.me/… или site.com" /></Field>
          <Field label="Статус">
            <select value={f.status} onChange={(e) => up("status", e.target.value)}>
              {STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
            </select>
          </Field>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Отмена</button>
          <button className="btn accent" disabled={!ok} onClick={() => onAdd(f)}><Plus size={16} /> Добавить</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
* { box-sizing: border-box; }
.app {
  --bg:#0b0d12; --panel:#12151c; --panel2:#171b24; --line:rgba(255,255,255,.07);
  --line2:rgba(255,255,255,.12); --tx:#e7eaf0; --mut:#8a91a0; --mut2:#5f6675; --acc:#2dd4bf;
  display:flex; height:760px; max-height:90vh; width:100%; background:var(--bg); color:var(--tx);
  font-family:'Hanken Grotesk',ui-sans-serif,system-ui,sans-serif; font-size:14px;
  border:1px solid var(--line); border-radius:14px; overflow:hidden; position:relative;
}
.mono { font-family:'IBM Plex Mono',ui-monospace,monospace; }

.sidebar { width:228px; flex-shrink:0; background:var(--panel); border-right:1px solid var(--line); display:flex; flex-direction:column; padding:18px 14px; }
.brand { display:flex; align-items:center; gap:11px; padding:4px 6px 20px; }
.brand-mark { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,#2dd4bf,#0e8c7e); display:grid; place-items:center; color:#04201c; }
.brand-name { font-weight:700; letter-spacing:-.2px; }
.brand-sub { font-size:11px; color:var(--mut2); letter-spacing:.5px; text-transform:uppercase; }
.nav { display:flex; flex-direction:column; gap:3px; }
.nav-item { display:flex; align-items:center; gap:11px; padding:9px 11px; border:none; background:none; color:var(--mut); font:inherit; font-size:14px; border-radius:8px; cursor:pointer; text-align:left; transition:.12s; }
.nav-item:hover { background:var(--panel2); color:var(--tx); }
.nav-item.on { background:var(--panel2); color:var(--tx); }
.nav-item.on svg { color:var(--acc); }
.nav-count { margin-left:auto; font-style:normal; font-size:11px; color:var(--mut2); background:var(--bg); padding:1px 7px; border-radius:20px; }
.side-foot { margin-top:auto; display:flex; flex-direction:column; gap:9px; }
.who { display:flex; align-items:center; gap:8px; font-size:11.5px; color:var(--mut2); padding:2px 6px; }
.reset-btn { background:none; border:1px solid var(--line); color:var(--mut); font:inherit; font-size:12px; padding:8px 10px; border-radius:8px; cursor:pointer; text-align:left; transition:.12s; }
.reset-btn:hover { border-color:#f85149; color:#f85149; }
.reset-confirm { display:flex; flex-direction:column; gap:7px; border:1px solid var(--line2); border-radius:8px; padding:9px 10px; font-size:12px; color:var(--tx); }
.reset-confirm > div { display:flex; gap:7px; }
.reset-confirm button { flex:1; font:inherit; font-size:12px; padding:5px; border-radius:6px; cursor:pointer; border:1px solid var(--line2); }
.rc-yes { background:#f85149; color:#fff; border-color:transparent; }
.rc-no { background:none; color:var(--mut); }
.who-dot { width:7px; height:7px; border-radius:50%; background:#3fb950; }
.logout-btn { background:none; border:none; color:var(--mut2); font:inherit; font-size:11.5px; cursor:pointer; text-align:left; padding:3px 6px; }
.logout-btn:hover { color:var(--tx); }

.lock { position:absolute; inset:0; display:grid; place-items:center; background:var(--bg); padding:24px; z-index:80; }
.lock-card { width:320px; max-width:100%; background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:26px 24px; display:flex; flex-direction:column; gap:13px; }
.lock-brand { display:flex; align-items:center; gap:12px; }
.lock-text { margin:6px 0 0; color:var(--mut); font-size:13.5px; }
.lock-input { background:var(--bg); border:1px solid var(--line2); border-radius:9px; padding:11px 13px; color:var(--tx); font:inherit; font-size:15px; outline:none; }
.lock-input:focus { border-color:var(--acc); }
.lock-input.err { border-color:#f85149; }
.lock-err { color:#f85149; font-size:12.5px; margin-top:-6px; }
.lock-btn { justify-content:center; padding:11px; }

.main { flex:1; min-width:0; overflow-y:auto; padding:24px 28px; }
.top { display:flex; justify-content:space-between; align-items:flex-start; }
.top h1 { margin:0; font-size:21px; font-weight:700; letter-spacing:-.4px; }
.sub { margin:3px 0 0; color:var(--mut); font-size:13px; }

.btn { display:inline-flex; align-items:center; gap:7px; padding:8px 14px; border-radius:9px; border:1px solid var(--line2); background:var(--panel2); color:var(--tx); font:inherit; font-weight:500; font-size:13.5px; cursor:pointer; transition:.12s; }
.btn:hover { border-color:var(--mut2); }
.btn.accent { background:var(--acc); color:#042c27; border-color:transparent; font-weight:600; }
.btn.accent:hover { background:#34e6d2; }
.btn.accent:disabled { opacity:.4; cursor:not-allowed; }
.btn.ghost { background:none; }

.stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:20px 0; }
.stat { background:var(--panel); border:1px solid var(--line); border-radius:11px; padding:13px 15px; }
.stat-label { font-size:11.5px; color:var(--mut); text-transform:uppercase; letter-spacing:.5px; }
.stat-value { font-size:23px; font-weight:700; margin-top:5px; letter-spacing:-.5px; display:flex; align-items:center; gap:9px; }
.sdot { width:9px; height:9px; border-radius:50%; display:inline-block; }

.toolbar { display:flex; gap:12px; align-items:center; margin-bottom:13px; }
.searchbox { flex:1; display:flex; align-items:center; gap:9px; background:var(--panel); border:1px solid var(--line); border-radius:9px; padding:0 13px; color:var(--mut); }
.searchbox input { flex:1; background:none; border:none; outline:none; color:var(--tx); font:inherit; font-size:13.5px; padding:10px 0; }
.searchbox input::placeholder { color:var(--mut2); }
.seg { display:flex; background:var(--panel); border:1px solid var(--line); border-radius:9px; padding:3px; }
.seg button { display:flex; align-items:center; gap:6px; padding:7px 13px; border:none; background:none; color:var(--mut); font:inherit; font-size:13px; border-radius:7px; cursor:pointer; }
.seg button.on { background:var(--panel2); color:var(--tx); }

.chips { display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin-bottom:18px; }
.chips-label { display:inline-flex; align-items:center; gap:5px; font-size:11.5px; color:var(--mut2); text-transform:uppercase; letter-spacing:.5px; margin-right:2px; }
.chips-sep { width:1px; height:18px; background:var(--line2); margin:0 6px; }
.chip { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:20px; border:1px solid var(--line); background:var(--panel); color:var(--mut); font:inherit; font-size:12.5px; cursor:pointer; transition:.12s; }
.chip:hover { border-color:var(--mut2); color:var(--tx); }
.chip.on { background:var(--tx); color:var(--bg); border-color:transparent; font-weight:600; }
.cdot { width:7px; height:7px; border-radius:50%; display:inline-block; }

.tablewrap { border:1px solid var(--line); border-radius:12px; overflow:hidden; }
table { width:100%; border-collapse:collapse; font-size:13.5px; }
thead th { text-align:left; padding:11px 14px; font-size:11px; font-weight:600; color:var(--mut); text-transform:uppercase; letter-spacing:.5px; background:var(--panel); border-bottom:1px solid var(--line); }
th.num, td.num { text-align:right; }
tbody td { padding:11px 14px; border-bottom:1px solid var(--line); white-space:nowrap; }
tbody tr:last-child td { border-bottom:none; }
tbody tr:hover { background:var(--panel); }
.flag { font-size:15px; }
.link-pair { display:inline-flex; align-items:center; gap:7px; }
.link-pair b { font-weight:600; }
.pair-arr { color:var(--acc); }
.tag { font-size:12px; color:var(--mut); background:var(--panel2); border:1px solid var(--line); padding:2px 8px; border-radius:6px; }
.pill { display:inline-flex; align-items:center; gap:6px; border:1px solid; border-radius:7px; padding:3px 8px 3px 9px; background:var(--panel2); }
.pill select { background:none; border:none; color:var(--tx); font:inherit; font-size:12.5px; outline:none; cursor:pointer; }
.icon-btn { background:none; border:none; color:var(--mut2); cursor:pointer; padding:5px; border-radius:6px; display:inline-flex; transition:.12s; }
.icon-btn:hover { color:#f85149; background:var(--panel2); }
.icon-btn.sm { margin-left:auto; padding:2px; }

.kanban { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; align-items:start; }
.kcol { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:11px; }
.kcol-head { display:flex; justify-content:space-between; align-items:center; padding:3px 4px 11px; font-size:13px; font-weight:600; }
.kcol-head span { display:flex; align-items:center; gap:7px; }
.kcol-head em { font-style:normal; color:var(--mut2); font-size:12px; }
.kcol-body { display:flex; flex-direction:column; gap:9px; min-height:40px; }
.kcard { background:var(--panel2); border:1px solid var(--line); border-left:3px solid; border-radius:9px; padding:11px; }
.kcard-top { display:flex; align-items:center; gap:7px; font-size:12px; color:var(--mut); margin-bottom:8px; }
.kgeo { color:var(--tx); }
.kpair { display:flex; align-items:center; gap:6px; font-size:13.5px; margin-bottom:9px; flex-wrap:wrap; }
.kpair b { font-weight:600; }
.kpair span { color:var(--mut); }
.kmeta { display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:12px; color:var(--mut); margin-bottom:10px; }
.kmeta .mono { color:var(--tx); font-size:12px; }
.kfoot { display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--line); padding-top:9px; }
.owner { font-size:12.5px; color:var(--mut); }
.kstatus { background:var(--panel); border:1px solid var(--line); color:var(--tx); font:inherit; font-size:11.5px; border-radius:6px; padding:3px 6px; cursor:pointer; outline:none; }
.kempty { font-size:12px; color:var(--mut2); text-align:center; padding:14px; }

.empty { padding:60px; text-align:center; color:var(--mut); border:1px dashed var(--line2); border-radius:12px; }

.ph { height:100%; display:grid; place-items:center; }
.ph-card { max-width:440px; text-align:center; padding:40px; }
.ph-icon { width:64px; height:64px; border-radius:16px; background:var(--panel2); border:1px solid var(--line); display:grid; place-items:center; margin:0 auto 20px; color:var(--acc); }
.ph-card h2 { margin:0 0 10px; font-size:22px; font-weight:700; }
.ph-card p { margin:0; color:var(--mut); line-height:1.6; font-size:14px; }
.ph-tag { display:inline-block; margin-top:20px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--mut2); border:1px solid var(--line2); padding:4px 11px; border-radius:20px; }

.modal-bg { position:absolute; inset:0; background:rgba(5,7,11,.7); display:grid; place-items:center; padding:20px; z-index:10; }
.modal { width:480px; max-width:100%; max-height:90%; overflow-y:auto; background:var(--panel); border:1px solid var(--line2); border-radius:14px; }
.modal-head { display:flex; justify-content:space-between; align-items:center; padding:18px 20px; border-bottom:1px solid var(--line); }
.modal-head h3 { margin:0; font-size:17px; font-weight:700; }
.modal-head .icon-btn:hover { color:var(--tx); }
.form { padding:18px 20px; display:flex; flex-direction:column; gap:13px; }
.form-row { display:grid; grid-template-columns:1fr 1fr; gap:13px; }
.field { display:flex; flex-direction:column; gap:6px; }
.field span { font-size:12px; color:var(--mut); }
.field input, .field select { background:var(--bg); border:1px solid var(--line2); border-radius:8px; padding:9px 11px; color:var(--tx); font:inherit; font-size:13.5px; outline:none; }
.field input:focus, .field select:focus { border-color:var(--acc); }
.field input::placeholder { color:var(--mut2); }
.modal-foot { display:flex; justify-content:flex-end; gap:10px; padding:16px 20px; border-top:1px solid var(--line); }

.tablewrap tbody tr.row { cursor:pointer; }
.kcard { cursor:pointer; }
.icon-btn.neutral:hover { color:var(--tx); background:var(--panel2); }

.drawer-bg { position:absolute; inset:0; background:rgba(5,7,11,.6); display:flex; justify-content:flex-end; z-index:70; }
.drawer { width:440px; max-width:100%; height:100%; background:var(--panel); border-left:1px solid var(--line2); display:flex; flex-direction:column; animation:slidein .18s ease; }
@keyframes slidein { from { transform:translateX(34px); opacity:.3; } to { transform:translateX(0); opacity:1; } }
.dr-head { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:14px 18px 12px; position:sticky; top:0; z-index:3; background:var(--panel); border-bottom:1px solid var(--line); }
.dr-back { display:none; }
.dr-geo { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--mut); }
.dr-title { display:flex; align-items:center; gap:9px; padding:9px 20px 0; font-size:18px; font-weight:700; flex-wrap:wrap; letter-spacing:-.3px; }
.dr-title span { color:var(--mut); font-weight:600; }
.dr-status { padding:13px 20px 4px; }
.dr-body { flex:1; overflow-y:auto; padding:6px 20px 18px; }
.dr-sec { padding:15px 0; border-bottom:1px solid var(--line); }
.dr-sec:last-child { border-bottom:none; }
.dr-sec-t { font-size:11px; text-transform:uppercase; letter-spacing:.6px; color:var(--mut2); margin-bottom:12px; }
.dr-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.dr-field { display:flex; flex-direction:column; gap:6px; }
.dr-lbl { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--mut); }
.dr-field input { background:var(--bg); border:1px solid var(--line2); border-radius:8px; padding:8px 10px; color:var(--tx); font:inherit; font-size:13.5px; outline:none; }
.dr-field input:focus { border-color:var(--acc); }
.readout { display:flex; flex-direction:column; gap:7px; justify-content:center; background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:8px 11px; }
.dr-val { font-size:15px; font-weight:600; }
.dr-note { width:100%; min-height:74px; resize:vertical; background:var(--bg); border:1px solid var(--line2); border-radius:8px; padding:9px 11px; color:var(--tx); font:inherit; font-size:13.5px; outline:none; }
.dr-note:focus { border-color:var(--acc); }
.dr-log { display:flex; flex-direction:column; gap:10px; }
.dr-log-item { display:flex; align-items:center; gap:9px; font-size:13px; }
.dr-log-item em { margin-left:auto; font-style:normal; font-size:11.5px; color:var(--mut2); }
.dr-log-empty { display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--mut2); }
.dr-foot { padding:14px 20px; border-top:1px solid var(--line); }
.btn.danger { color:#f85149; }
.btn.danger:hover { border-color:#f85149; background:rgba(248,81,73,.08); }

.link-pair { display:inline-flex; align-items:center; gap:7px; flex-wrap:wrap; }
.link-pair .pp { display:inline-flex; align-items:center; gap:7px; }
.muted { color:var(--mut2); }
.ext { color:var(--acc); text-decoration:none; }
.ext:hover { text-decoration:underline; }
.form-hint { margin:0 0 2px; font-size:12.5px; color:var(--mut); line-height:1.5; }

.cv { display:flex; flex-direction:column; gap:14px; height:100%; }
.cv-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; }
.cv-top h1 { margin:0; font-size:21px; font-weight:700; letter-spacing:-.4px; }
.cv-tools { display:flex; align-items:center; gap:9px; flex-wrap:wrap; }
.cv-toolstoggle { display:none; }
.cv-search { display:flex; align-items:center; gap:8px; background:var(--panel); border:1px solid var(--line); border-radius:9px; padding:0 11px; color:var(--mut); height:36px; }
.cv-search input { width:160px; background:none; border:none; outline:none; color:var(--tx); font:inherit; font-size:13px; padding:9px 0; }
.cv-search input::placeholder { color:var(--mut2); }
.cv-found { font-size:12px; color:var(--acc); background:var(--panel2); padding:1px 7px; border-radius:20px; }
.cv-clear { background:none; border:none; color:var(--mut2); cursor:pointer; display:inline-flex; padding:2px; }
.cv-clear:hover { color:var(--tx); }
.btn-on { border-color:var(--acc); color:var(--acc); }
.np-bg { position:absolute; inset:0; background:rgba(5,7,11,.5); display:flex; justify-content:flex-end; z-index:15; }
.np-sub { padding:5px 20px 0; font-size:12.5px; color:var(--mut); }
.np-card { display:flex; flex-direction:column; gap:9px; width:100%; text-align:left; background:var(--panel2); border:1px solid var(--line); border-radius:10px; padding:12px; margin-bottom:10px; cursor:pointer; font:inherit; transition:.12s; }
.np-card:hover { border-color:var(--mut2); }
.np-card-top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.np-pair { font-size:13.5px; font-weight:600; color:var(--tx); }
.np-card-meta { display:flex; align-items:center; gap:10px; font-size:12px; color:var(--mut); }
.np-status { margin-left:auto; font-weight:600; }
.np-empty { color:var(--mut); font-size:13px; padding:24px; text-align:center; }

.cv-addwrap { position:relative; }
.cv-menu { position:absolute; top:42px; right:0; z-index:30; background:var(--panel); border:1px solid var(--line2); border-radius:10px; padding:5px; display:flex; flex-direction:column; gap:2px; min-width:200px; box-shadow:0 12px 30px rgba(0,0,0,.4); }
.cv-menu button { display:flex; align-items:center; gap:10px; padding:9px 11px; border:none; background:none; color:var(--tx); font:inherit; font-size:13.5px; border-radius:7px; cursor:pointer; text-align:left; }
.cv-menu button:hover { background:var(--panel2); }
.cv-menu svg { color:var(--acc); }
.cv-banner { display:flex; align-items:center; gap:9px; background:rgba(45,212,191,.1); border:1px solid var(--acc); color:var(--acc); font-size:13px; padding:9px 13px; border-radius:9px; margin-bottom:2px; }
.cv-banner button { margin-left:auto; background:none; border:1px solid var(--acc); color:var(--acc); font:inherit; font-size:12px; padding:3px 10px; border-radius:6px; cursor:pointer; }
.cv-editor { position:absolute; z-index:25; width:230px; background:var(--panel); border:1px solid var(--line2); border-radius:10px; padding:9px; box-shadow:0 12px 30px rgba(0,0,0,.45); }
.cv-editor textarea, .cv-editor input { width:100%; background:var(--bg); border:1px solid var(--line2); border-radius:7px; padding:8px; color:var(--tx); font:inherit; font-size:13px; outline:none; resize:vertical; }
.cv-editor textarea { min-height:64px; }
.cv-editor textarea:focus, .cv-editor input:focus { border-color:var(--acc); }
.cv-ed-row { display:flex; align-items:center; gap:7px; margin-top:8px; }
.cv-swatches { display:flex; gap:5px; margin-right:auto; }
.cv-swatches button { width:18px; height:18px; border-radius:50%; border:2px solid transparent; cursor:pointer; padding:0; }
.cv-swatches button.on { border-color:#fff; }
.cv-ed-del { background:none; border:1px solid var(--line2); color:#f85149; border-radius:7px; padding:5px 7px; cursor:pointer; display:inline-flex; }
.cv-ed-ok { background:var(--acc); color:#042c27; border:none; border-radius:7px; padding:6px 11px; font:inherit; font-size:12.5px; font-weight:600; cursor:pointer; }
.cv-mini { position:absolute; right:12px; bottom:12px; z-index:18; background:rgba(10,12,17,.85); border:1px solid var(--line2); border-radius:9px; padding:4px; cursor:pointer; }
.cv-mini svg { display:block; }

.fin { display:flex; flex-direction:column; }
.fin-head { display:flex; align-items:center; gap:10px; }
.fin-rate { display:flex; align-items:center; gap:10px; margin:18px 0 4px; background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:10px 13px; }
.fin-rate-lbl { font-size:12.5px; color:var(--mut); }
.fin-rate input { width:96px; background:var(--bg); border:1px solid var(--line2); border-radius:7px; padding:7px 10px; color:var(--tx); font:inherit; font-size:13.5px; outline:none; }
.fin-rate input:focus { border-color:var(--acc); }
.fin-rate-msg { font-size:12px; color:var(--mut2); }
.fin-stats { margin:16px 0; }
.stat-sub { font-size:11.5px; color:var(--mut2); margin-top:5px; font-family:'IBM Plex Mono',monospace; }
.fin-grid { display:grid; grid-template-columns:1fr 340px; gap:14px; align-items:start; }
.fin-table { overflow:hidden; }
.fin-amt { display:inline-flex; align-items:center; gap:5px; font-family:'IBM Plex Mono',monospace; font-weight:500; justify-content:flex-end; }
.fin-amt.in { color:#3fb950; }
.fin-amt.out { color:#f85149; }
.fin-st { font-size:12px; padding:2px 9px; border-radius:20px; border:1px solid var(--line2); }
.fin-st.done { color:#3fb950; border-color:rgba(63,185,80,.4); }
.fin-st.pend { color:#d29922; border-color:rgba(210,153,34,.4); }
.fin-chart { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px; }
.fin-chart-t { font-size:13px; font-weight:600; margin-bottom:10px; }
@media (max-width:880px) { .fin-grid { grid-template-columns:1fr; } }
.fin-tb { margin-top:18px; }
.fin-side { display:flex; flex-direction:column; gap:14px; }
.fin-debt { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px; }
.fin-debt-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px; }
.fin-debt-head .fin-chart-t { margin-bottom:0; }
.debt-add { display:inline-flex; align-items:center; gap:5px; border:1px solid var(--line2); background:var(--panel2); color:var(--tx); font:inherit; font-size:12px; padding:5px 9px; border-radius:7px; cursor:pointer; transition:.12s; }
.debt-add:hover { border-color:var(--acc); color:var(--acc); }
.debt-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--line); }
.debt-row:last-of-type { border-bottom:none; }
.debt-info { display:flex; flex-direction:column; gap:2px; min-width:0; }
.debt-name { font-size:13.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.debt-cnt { font-size:11px; color:var(--mut2); }
.debt-amt { margin-left:auto; font-family:'IBM Plex Mono',monospace; font-size:13px; color:#d29922; white-space:nowrap; }
.debt-ok { border:1px solid rgba(63,185,80,.4); background:none; color:#3fb950; font:inherit; font-size:11.5px; padding:5px 9px; border-radius:7px; cursor:pointer; white-space:nowrap; transition:.12s; }
.debt-ok:hover { background:rgba(63,185,80,.12); }
.debt-total { display:flex; justify-content:space-between; align-items:center; margin-top:11px; padding-top:11px; border-top:1px solid var(--line2); font-size:13px; color:var(--mut); }
.debt-total b { font-family:'IBM Plex Mono',monospace; color:var(--tx); }

.tk { display:flex; flex-direction:column; }
.tk-add { display:flex; align-items:center; gap:9px; background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:0 13px; color:var(--mut); margin:16px 0 18px; }
.tk-add input { flex:1; background:none; border:none; outline:none; color:var(--tx); font:inherit; font-size:14px; padding:12px 0; }
.tk-add input::placeholder { color:var(--mut2); }
.tk-board { display:grid; grid-template-columns:repeat(3,1fr); gap:13px; align-items:start; }
.tk-col { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:11px; transition:.12s; }
.tk-col.over { border-color:var(--acc); background:rgba(45,212,191,.04); }
.tk-col-head { display:flex; justify-content:space-between; align-items:center; padding:3px 4px 11px; font-size:13px; font-weight:600; }
.tk-col-head em { font-style:normal; color:var(--mut2); font-size:12px; }
.tk-col-body { display:flex; flex-direction:column; gap:8px; min-height:50px; }
.tk-card { display:flex; align-items:center; gap:9px; background:var(--panel2); border:1px solid var(--line); border-left:3px solid; border-radius:9px; padding:10px 11px; cursor:grab; }
.tk-card:active { cursor:grabbing; }
.tk-prio { width:11px; height:11px; border-radius:50%; border:none; padding:0; cursor:pointer; flex-shrink:0; }
.tk-text { flex:1; font-size:13.5px; line-height:1.35; cursor:text; word-break:break-word; }
.tk-text.done { text-decoration:line-through; color:var(--mut2); }
.tk-edit { flex:1; background:var(--bg); border:1px solid var(--acc); border-radius:6px; padding:5px 7px; color:var(--tx); font:inherit; font-size:13.5px; outline:none; }
.tk-del { background:none; border:none; color:var(--mut2); cursor:pointer; padding:2px; display:inline-flex; flex-shrink:0; opacity:0; transition:.12s; }
.tk-card:hover .tk-del { opacity:1; }
.tk-del:hover { color:#f85149; }
.tk-empty { font-size:12px; color:var(--mut2); text-align:center; padding:12px; }
.tk-hint { font-size:12px; color:var(--mut2); margin-top:14px; }

.crm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(244px,1fr)); gap:12px; }
.crm-card { position:relative; display:flex; align-items:flex-start; gap:12px; background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px; cursor:pointer; transition:.12s; }
.crm-card:hover { border-color:var(--mut2); }
.crm-av { width:42px; height:42px; border-radius:11px; display:grid; place-items:center; font-weight:700; font-size:14px; flex-shrink:0; }
.crm-main { min-width:0; flex:1; }
.crm-name { font-weight:600; font-size:14.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.crm-meta { font-size:12px; color:var(--mut); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.crm-org { color:var(--mut2); }
.crm-tg { display:inline-flex; align-items:center; gap:4px; margin-top:8px; font-size:12.5px; color:var(--acc); text-decoration:none; }
.crm-tg:hover { text-decoration:underline; }
.crm-del { position:absolute; top:10px; right:10px; background:none; border:none; color:var(--mut2); cursor:pointer; padding:3px; border-radius:6px; opacity:0; transition:.12s; }
.crm-card:hover .crm-del { opacity:1; }
.crm-del:hover { color:#f85149; background:var(--panel2); }

.kb { display:flex; flex-direction:column; height:100%; }
.kb-body { flex:1; min-height:0; display:grid; grid-template-columns:288px 1fr; gap:14px; margin-top:18px; }
.kb-list { display:flex; flex-direction:column; min-height:0; background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:11px; }
.kb-search { display:flex; align-items:center; gap:8px; background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:0 11px; color:var(--mut); }
.kb-search input { flex:1; background:none; border:none; outline:none; color:var(--tx); font:inherit; font-size:13px; padding:9px 0; }
.kb-search input::placeholder { color:var(--mut2); }
.kb-tags { display:flex; flex-wrap:wrap; gap:5px; margin:10px 0; }
.kb-tag { font-size:11.5px; padding:3px 9px; border-radius:20px; border:1px solid var(--line); background:none; color:var(--mut); cursor:pointer; }
.kb-tag.on { background:var(--tx); color:var(--bg); border-color:transparent; font-weight:600; }
.kb-items { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px; margin:0 -4px; padding:0 4px; }
.kb-item { position:relative; text-align:left; background:none; border:1px solid transparent; border-radius:9px; padding:9px 10px; cursor:pointer; font:inherit; transition:.12s; }
.kb-item:hover { background:var(--panel2); }
.kb-item.on { background:var(--panel2); border-color:var(--line2); }
.kb-item-t { font-size:13.5px; font-weight:600; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.kb-item-s { font-size:12px; color:var(--mut2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
.kb-item-tag { display:inline-block; margin-top:7px; font-size:10.5px; color:var(--mut); background:var(--bg); border:1px solid var(--line); padding:1px 7px; border-radius:20px; }
.kb-empty { color:var(--mut2); font-size:13px; text-align:center; padding:24px 10px; }
.kb-editor { display:flex; flex-direction:column; min-height:0; background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:18px 20px; }
.kb-title { background:none; border:none; outline:none; color:var(--tx); font:inherit; font-size:19px; font-weight:700; letter-spacing:-.3px; }
.kb-title::placeholder { color:var(--mut2); }
.kb-edit-meta { display:flex; align-items:center; gap:11px; margin:10px 0 14px; padding-bottom:14px; border-bottom:1px solid var(--line); }
.kb-tag-input { width:140px; background:var(--bg); border:1px solid var(--line2); border-radius:7px; padding:6px 10px; color:var(--tx); font:inherit; font-size:12.5px; outline:none; }
.kb-tag-input:focus { border-color:var(--acc); }
.kb-upd { font-size:11.5px; color:var(--mut2); margin-left:auto; }
.kb-area { flex:1; resize:none; background:none; border:none; outline:none; color:var(--tx); font:inherit; font-size:14px; line-height:1.6; }
.kb-area::placeholder { color:var(--mut2); }
.kb-none { height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; color:var(--mut2); }
.kb-none p { font-size:14px; }
@media (max-width:880px) { .kb-body { grid-template-columns:1fr; } }
.kb-headright { display:flex; align-items:center; gap:10px; }
.off { display:flex; flex-direction:column; margin-top:16px; }
.off-st { font-weight:600; font-size:13px; }
.off-actions { display:inline-flex; gap:2px; }
.icon-btn.copy:hover { color:var(--acc); background:var(--panel2); }
.icon-btn.copy.ok { color:#3fb950; }
.off-check { width:36px; text-align:center; }
.off-check input { accent-color:var(--acc); width:15px; height:15px; cursor:pointer; }

.dash-stats { margin:20px 0; }
.dash-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; align-items:start; }
.dash-panel { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:14px 15px; }
.dash-panel-h { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.dash-panel-t { display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:600; }
.dash-go { display:inline-flex; align-items:center; gap:4px; background:none; border:none; color:var(--mut); font:inherit; font-size:12px; cursor:pointer; padding:2px 4px; border-radius:6px; }
.dash-go:hover { color:var(--acc); }
.dash-panel-b { display:flex; flex-direction:column; }
.dash-row { display:flex; align-items:center; gap:9px; padding:8px 4px; border-bottom:1px solid var(--line); font-size:13px; text-align:left; }
.dash-row:last-child { border-bottom:none; }
.dash-row.btn-row { background:none; border-left:none; border-right:none; border-top:none; cursor:pointer; font:inherit; width:100%; }
.dash-row.btn-row:hover { background:var(--panel2); }
.dash-row-t { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dash-amt { font-family:'IBM Plex Mono',monospace; font-size:12.5px; white-space:nowrap; }
.dash-date { color:var(--mut2); font-size:11.5px; }
.dash-badge { font-size:11px; font-weight:600; white-space:nowrap; }
.dash-total { display:flex; justify-content:space-between; align-items:center; margin-top:9px; padding-top:9px; border-top:1px solid var(--line2); font-size:12.5px; color:var(--mut); }
.dash-total b { font-family:'IBM Plex Mono',monospace; color:var(--tx); }
.dash-empty { color:var(--mut2); font-size:13px; padding:14px 4px; }
@media (max-width:880px) { .dash-grid { grid-template-columns:1fr; } }

/* --- мобильная навигация (на десктопе скрыто) --- */
.mtopbar { display:none; }
.menu-btn { display:inline-flex; align-items:center; justify-content:center; background:none; border:none; color:var(--tx); cursor:pointer; padding:6px; border-radius:8px; }
.menu-btn:hover { background:var(--panel2); }
.mtopbar-brand { display:flex; align-items:center; gap:8px; font-weight:700; }
.brand-mark.sm { width:24px; height:24px; border-radius:7px; }
.backdrop { display:none; }
.side-close { display:none; background:none; border:none; color:var(--mut); cursor:pointer; margin-left:auto; padding:4px; }
.side-close:hover { color:var(--tx); }

@media (max-width:760px) {
  .mtopbar { display:flex; align-items:center; gap:10px; position:absolute; top:0; left:0; right:0; height:52px; padding:0 12px; background:var(--panel); border-bottom:1px solid var(--line); z-index:30; }
  .backdrop { display:block; position:absolute; inset:0; background:rgba(0,0,0,.55); z-index:55; }
  .sidebar { position:absolute; top:0; left:0; bottom:0; width:250px; z-index:60; transform:translateX(-100%); transition:transform .22s ease; box-shadow:2px 0 24px rgba(0,0,0,.45); }
  .sidebar.open { transform:translateX(0); }
  .side-close { display:inline-flex; }
  .main { padding:66px 14px 18px; }
  .top { flex-direction:column; gap:12px; align-items:stretch; }
  .top .btn { align-self:flex-start; }
  .stats { grid-template-columns:repeat(2,1fr); gap:10px; }
  .toolbar, .fin-tb { flex-direction:column; align-items:stretch; gap:10px; }
  .seg { width:100%; }
  .seg button { flex:1; justify-content:center; }
  .chips { flex-wrap:wrap; }
  .tablewrap { overflow-x:auto; }
  .crm-grid { grid-template-columns:1fr; }
  .tk-board { grid-template-columns:1fr; gap:10px; }
  .modal-bg { padding:12px; }

  .cv { gap:9px; }
  .cv-top { gap:8px; align-items:center; }
  .cv-top > div:first-child { display:none; }
  .cv-toolstoggle { display:inline-flex; align-items:center; gap:6px; background:var(--panel); border:1px solid var(--line); color:var(--tx); font:inherit; font-size:13px; padding:9px 13px; border-radius:9px; cursor:pointer; }
  .cv-tools { display:none; width:100%; }
  .cv-tools.open { display:flex; }
  .cv-search { flex:1; }
  .cv-search input { width:100%; }
  .cv-mini { display:none; }
  .cv-foot { display:none; }
  .stage { min-height:0; border-radius:12px; }
  .dr-back { display:inline-flex; align-items:center; gap:5px; background:var(--panel2); border:1px solid var(--line2); color:var(--tx); font:inherit; font-size:13.5px; font-weight:600; padding:8px 13px; border-radius:9px; cursor:pointer; }
}
.cv-zoom { display:flex; align-items:center; background:var(--panel); border:1px solid var(--line); border-radius:9px; overflow:hidden; }
.cv-zoom button { width:34px; height:34px; border:none; background:none; color:var(--tx); font-size:18px; cursor:pointer; }
.cv-zoom button:hover { background:var(--panel2); }
.cv-zoom span { width:48px; text-align:center; font-size:12px; color:var(--mut); }
.stage { position:relative; flex:1; min-height:480px; border:1px solid var(--line); border-radius:14px; overflow:hidden; background-color:#0a0c11; background-image:radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px); background-size:24px 24px; }
.stage svg { width:100%; height:100%; display:block; touch-action:none; }
.cn text { user-select:none; pointer-events:none; font-family:'Hanken Grotesk',sans-serif; }
.cn:active { cursor:grabbing; }
.cv-foot { display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap; }
.legend { display:flex; gap:15px; flex-wrap:wrap; font-size:12.5px; color:var(--mut); }
.legend i { width:9px; height:9px; border-radius:50%; display:inline-block; margin-right:6px; vertical-align:middle; }
.legend-deal b { width:16px; height:3px; border-radius:2px; display:inline-block; margin-right:6px; vertical-align:middle; }
.cv-hint { font-size:12px; color:var(--mut2); }
`;

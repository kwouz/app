import type { Entry, Mood } from '../types';
import type { Language } from '../i18n/translations';
import translations from '../i18n/translations';
import { analyzePatterns } from '../logic/insights';

/* Mood color map for dot strip */
const MOOD_COLOR: Record<Mood, string> = {
  wonderful: '#C8A97E',
  calm: '#B8A06A',
  normal: '#6BA68A',
  tired: '#8B7EAD',
  anxious: '#E8664A',
  heavy: '#636869',
};

const MOOD_LABELS: Record<Language, Record<Mood, string>> = {
  en: { wonderful: 'Wonderful', calm: 'Calm', normal: 'Normal', tired: 'Tired', anxious: 'Anxious', heavy: 'Heavy' },
  ru: { wonderful: 'Прекрасно', calm: 'Спокойно', normal: 'Нормально', tired: 'Усталость', anxious: 'Тревога', heavy: 'Тяжело' },
};

function t(lang: Language, key: string): string {
  return translations[lang][key] || key;
}

const COMMON_CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { 
    font-family:'Inter',system-ui,sans-serif; 
    background-color:#0f1115; 
    color:rgba(255,255,255,0.9); 
    padding:40px; 
    -webkit-print-color-adjust: exact !important; 
    print-color-adjust: exact !important;
  }
  .report-container { max-width:800px; margin:0 auto; position:relative; z-index:1; }
  .glow-bg {
    position:fixed; top:-150px; right:-150px; width:600px; height:600px;
    background:radial-gradient(circle, rgba(141,175,151,0.08) 0%, transparent 70%);
    z-index:-1; pointer-events:none;
  }
  h1 { font-size:28px; font-weight:600; margin-bottom:6px; letter-spacing:-0.02em; }
  .subtitle { font-size:13px; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:40px; }
  
  .stats-row { display:flex; gap:16px; margin-bottom:32px; page-break-inside: avoid; }
  .stat-card {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06);
    border-radius:18px; padding:20px; flex:1;
  }
  .stat-label { font-size:11px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; }
  .stat-value { font-size:20px; font-weight:600; }
  
  .glass-card {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06);
    border-radius:22px; padding:28px; margin-bottom:24px; page-break-inside: avoid;
  }
  .section-title { font-size:12px; font-weight:600; text-transform:uppercase; color:rgba(255,255,255,0.4); margin-bottom:20px; letter-spacing:0.06em; }
  
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; padding:12px 8px; font-size:11px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid rgba(255,255,255,0.1); }
  td { padding:14px 8px; font-size:14px; border-bottom:1px solid rgba(255,255,255,0.05); color:rgba(255,255,255,0.8); }
  tr:last-child td { border-bottom:none; }
  
  .mood-dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:10px; vertical-align:middle; box-shadow: 0 0 8px currentColor; }
  
  .print-btn {
    position: fixed; top: 40px; right: 40px;
    background: rgba(255,255,255,0.1); 
    border: 1px solid rgba(255,255,255,0.2);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    color: #fff; padding: 12px 20px; border-radius: 99px;
    font-size: 14px; font-weight: 500; cursor: pointer;
    transition: all 0.2s; z-index: 100;
  }
  .print-btn:hover { background: rgba(255,255,255,0.15); }
  
  @media print {
    body { padding:0; margin: 10mm 15mm; background-color: #0f1115 !important; }
    .report-container { max-width: 100%; }
    .print-btn { display: none !important; }
    @page { margin: 0; size: A4 portrait; }
  }
`;

function buildReportHTML(entries: Entry[], lang: Language, from: string, to: string): string {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const counts: Record<Mood, number> = { wonderful: 0, calm: 0, normal: 0, tired: 0, anxious: 0, heavy: 0 };
  sorted.forEach(e => counts[e.mood]++);

  const insights = analyzePatterns(sorted, lang);

  let chartHtml = '<div class="glass-card">';
  chartHtml += `<div class="section-title">Общая картина</div>`;
  chartHtml += '<div style="display:flex; gap:24px; flex-wrap:wrap;">';
  const moods: Mood[] = ['wonderful', 'calm', 'normal', 'tired', 'anxious', 'heavy'];
  moods.forEach(m => {
    chartHtml += `
      <div style="display:flex; align-items:center;">
        <span class="mood-dot" style="background:${MOOD_COLOR[m]}; color:${MOOD_COLOR[m]};"></span>
        <span style="font-size:14px; color:rgba(255,255,255,0.7);">${MOOD_LABELS[lang][m]}: <strong style="color:#fff; margin-left:4px;">${counts[m]}</strong></span>
      </div>
    `;
  });
  chartHtml += '</div></div>';

  let insightsHtml = '';
  if (insights.length > 0) {
    insightsHtml = '<div class="glass-card">';
    insightsHtml += `<div class="section-title">Поведенческий анализ</div>`;
    insights.forEach(ins => {
      insightsHtml += `<div style="font-size:14px; line-height:1.6; color:rgba(255,255,255,0.85); margin-bottom:8px;">• ${ins}</div>`;
    });
    insightsHtml += '</div>';
  }

  const rows = sorted.map((e) => `
    <tr>
      <td style="color:rgba(255,255,255,0.5); font-variant-numeric: tabular-nums;">${e.date}</td>
      <td>
        <span class="mood-dot" style="background:${MOOD_COLOR[e.mood]}; color:${MOOD_COLOR[e.mood]};"></span>
        ${MOOD_LABELS[lang][e.mood]}
      </td>
      <td style="color:rgba(255,255,255,0.6);">${e.note || '—'}</td>
    </tr>
  `).join('');

  const title = t(lang, 'print_title');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${title}</title>
<style>${COMMON_CSS}</style></head><body>
  <div class="glow-bg"></div>
  <div class="report-container">
    <h1>${title}</h1>
    <div class="subtitle">${from} — ${to}</div>
    
    ${chartHtml}
    ${insightsHtml}
    
    <div class="glass-card">
      <div class="section-title">Детализация</div>
      <table>
        <thead><tr><th>${t(lang, 'print_date')}</th><th>${t(lang, 'print_mood')}</th><th>${t(lang, 'print_note')}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">🖨 Печать PDF</button>
</body></html>`;
}

export function printReport(
  entries: Entry[],
  language: Language,
  from: string,
  to: string,
): void {
  const html = buildReportHTML(entries, language, from, to);

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}


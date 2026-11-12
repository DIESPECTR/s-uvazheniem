import { modes } from './examples.js';
const HISTORY_KEY = 'respect.history.v1';
export function readHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value.filter(item => item && modes.some(m => m.id === item.mode) && [1,2,3].includes(item.level) && typeof item.input === 'string' && item.input.length <= 6000 && typeof item.text === 'string' && item.text.length <= 20000 && Number.isFinite(item.time) && ['demo','ai'].includes(item.source)).slice(0,30) : [];
  } catch { return []; }
}
export function saveHistory(items) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0,30))); return true; }
  catch { return false; }
}
export function readTheme() {
  try { return localStorage.getItem('respect.theme') === 'dark' ? 'dark' : 'light'; }
  catch { return 'light'; }
}
export function saveTheme(theme) { try { localStorage.setItem('respect.theme',theme); } catch {} }

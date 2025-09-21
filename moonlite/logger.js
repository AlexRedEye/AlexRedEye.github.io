export class Logger {
  constructor(el) { this.el = el; }
  _line(level, msg) {
    const p = document.createElement('div');
    p.className = 'entry';
    const ts = new Date().toLocaleTimeString();
    p.innerHTML = `<span class="ts">[${ts}]</span><span class="lvl-${level}">[${level.toUpperCase()}]</span> ${msg}`;
    this.el.appendChild(p);
    this.el.scrollTop = this.el.scrollHeight;

    const method = level === 'error' ? 'error' : (level === 'warn' ? 'warn' : 'log');
    console[method](`[${ts}] [${level.toUpperCase()}] ${msg}`);
  }
  info(msg) { this._line('info', msg); }
  warn(msg) { this._line('warn', msg); }
  error(msg) { this._line('error', msg); }
}

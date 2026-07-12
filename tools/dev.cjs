const { execFile, spawn } = require('node:child_process');
const path = require('node:path');

const index = process.argv.indexOf('--test');
const requested = index === -1 ? '' : process.argv[index + 1];
let target = 'ui.test.html';
if (requested) {
  const aliases = { DataGrid: 'components.data.DataGrid', 'data.DataGrid': 'components.data.DataGrid' };
  const name = aliases[requested] || (requested.includes('.') ? requested : 'components.' + requested);
  const parts = name.split('.');
  if (parts[0] !== 'components' && parts[0] !== 'utilities') throw new Error('Use npm test -- List, form.DatePicker, or components.form.DatePicker');
  target += '?test=' + encodeURIComponent(name);
}

const server = spawn(process.execPath, [path.join(__dirname, 'serve.cjs')], { stdio: 'inherit' });
const url = 'http://127.0.0.1:5173/ui/' + target;
const open = () => {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  execFile(command, args, error => { if (error) console.log('Open this URL: ' + url) });
};
setTimeout(open, 300);
const stop = () => server.kill();
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

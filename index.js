const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Add this line
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('get-summary', (event) => {
  const pythonScriptPath = '/Users/tong/SDD/contextChat/html_to_markdown.py';
  const virtualEnvPath = '/Users/tong/SDD/contextChat/venv/bin/python';

  // Replace the following URL with the URL of the web page you want to summarize
  const theURL = 'https://example.com';

  exec(
    `${virtualEnvPath} ${pythonScriptPath} ${theURL}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      event.reply('summary-result', stdout);
    }
  );
});

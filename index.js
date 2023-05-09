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

  getActiveBrowserURL((theURL) => {
    if (theURL === "error") {
      console.error("Safari 或 Google Chrome 必须处于打开状态。");
      event.reply('summary-result', "Safari 或 Google Chrome 必须处于打开状态。");
      return;
    }

    exec(
      `${virtualEnvPath} ${pythonScriptPath} ${theURL}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          event.reply('summary-result', `Error: ${error}`);
          return;
        }
        event.reply('summary-result', stdout);
      }
    );
  });
});



function getActiveBrowserURL(callback) {
  const appleScript = `
  tell application "System Events"
    set processList to name of every process
    if "Safari" is in processList then
      tell application "Safari"
        set theURL to URL of current tab of window 1
      end tell
    else if "Google Chrome" is in processList then
      tell application "Google Chrome"
        set theURL to URL of active tab of window 1
      end tell
    else
      set theURL to "error"
    end if
  end tell
  return theURL`;

  exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      callback("error");
      return;
    }
    callback(stdout.trim());
  });
}

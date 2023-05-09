const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
const TurndownService = require('turndown');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

require("dotenv").config();

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('index.html');
}


app.whenReady().then(createWindow);
app.whenReady().then(() => {
  const ret = globalShortcut.register('CommandOrControl+Alt+S', () => {
    app.show()
    app.focus({ steal: true })
    // let win = BrowserWindow.getFocusedWindow();

    // if (!win) {
    //   win = BrowserWindow.getAllWindows()[0];
    // }

    // if (win) {
    //   if (win.isMinimized()) {
    //     win.restore();
    //   }
    //   // win.setAlwaysOnTop(true);
    //   app.show()
    //   win.focus({ steal: true });
    //   // win.setAlwaysOnTop(false);

    // }
  });

  if (!ret) {
    console.log('快捷键注册失败');
  }
});



app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

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

ipcMain.on('get-summary', async (event) => {
  getActiveBrowserHTML(async (webpageContent) => {
    if (webpageContent === 'error') {
      console.error('Safari 或 Google Chrome 必须处于打开状态。');
      event.reply('summary-result', 'Safari 或 Google Chrome 必须处于打开状态。');
      return;
    }

    const markdownContent = await getMarkdown(webpageContent);
    if (markdownContent) {
      const markdownExcerpt = markdownContent.length < 1800 ? markdownContent : markdownContent.slice(0, 900) + markdownContent.slice(-900);
      event.reply('markdown-excerpt', markdownExcerpt);
    }
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

async function getWebpageContent(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  const renderedHtml = await page.content();
  await browser.close();

  return renderedHtml;
}

async function getMarkdown(webpageContent) {

  const dom = new JSDOM(webpageContent);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) return null;
  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(article.content);
  // Save the markdown content to a file (optional)
  require('fs').writeFileSync('output.md', markdown, 'utf8');
  return markdown;
}

async function getCompletion(prompt, model = 'gpt-3.5-turbo') {
  messages = [{ "role": "user", "content": prompt }]
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: model,
      messages: messages, // include limited messages in the payload
      temperature: 0,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Cache-Control": "no-cache",
      },
    }
  );
  console.log(response);
  return response.data.choices[0].message["content"]
}

function getActiveBrowserHTML(callback) {
  const appleScript = `
    set theHTML to ""
    tell application "System Events"
      set processList to name of every process
      if "Safari" is in processList then
        tell application "Safari"
          set theURL to URL of current tab of window 1
          set theHTML to do JavaScript "document.documentElement.outerHTML" in current tab of window 1
        end tell
      else if "Google Chrome" is in processList then
        tell application "Google Chrome"
          set theURL to URL of active tab of window 1
          set theHTML to execute active tab of window 1 javascript "document.documentElement.outerHTML"
        end tell
      else
        set theHTML to "error"
      end if
    end tell
    return theHTML
  `;
  exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    callback(stdout.trim());
  });
}

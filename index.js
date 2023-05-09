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
    let win = BrowserWindow.getFocusedWindow();

    if (!win) {
      win = BrowserWindow.getAllWindows()[0];
    }

    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }
      win.setAlwaysOnTop(true); // 添加这行
      win.focus();
      win.setAlwaysOnTop(false); // 添加这行
    }
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

ipcMain.on('get-summary', (event) => {

  getActiveBrowserURL(async (theURL) => {
    console.log(theURL);
    if (theURL === "error") {
      console.error("Safari 或 Google Chrome 必须处于打开状态。");
      event.reply('summary-result', "Safari 或 Google Chrome 必须处于打开状态。");
      return;
    }

    const markdownContent = await getMarkdown(theURL);
    console.log(markdownContent);
    if (markdownContent) {
      const markdownExcerpt = markdownContent.slice(0, 900) + markdownContent.slice(-900);
      const response = await getCompletion(markdownExcerpt + '总结一下上述内容：', 'gpt-3.5-turbo') + '\n(人工智能生成)';
      event.reply('summary-result', response);
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

async function getMarkdown(url) {
  const webpageContent = await getWebpageContent(url);

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
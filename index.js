const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
const TurndownService = require('turndown');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const robot = require('robotjs');
const { clipboard } = require('electron');
const fs = require('fs');
const { Tiktoken } = require("@dqbd/tiktoken/lite");
const cl100k_base = require("@dqbd/tiktoken/encoders/cl100k_base.json");

require("dotenv").config();

const encoding = new Tiktoken(
  cl100k_base.bpe_ranks,
  cl100k_base.special_tokens,
  cl100k_base.pat_str
);

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
    // checkActiveApp((activeApp) => {
    //   if (activeApp === 'Discord') {
    //     getContext();
    //   }
    // });
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
    const lines = markdownContent.split(".");
    let contextSize = 0, context = "", contexts = [];
    for (let i = 0; i < lines.length; i++) {
      const lineSize = encoding.encode(lines[i]).length;
      contextSize += lineSize;
      if (contextSize > 3500) {
        console.log(contextSize + "\n");
        console.log(context);
        contexts.push(context);
        
        contextSize = lineSize;
        context = lines[i] + ".";

      } else {
        context += lines[i] + ".";
      }

    }
    contexts.push(context);
    event.reply('markdown-contexts', contexts);
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

function checkActiveApp(callback) {
  const appleScript = `
  tell application "System Events"
    set activeApp to name of first application process whose frontmost is true
  end tell
  return activeApp`;

  exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    callback(stdout.trim());
  });
}

async function getContext() {
  const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
  // openai.apiKey = config["open_ai_api_key"];

  screenshot_path = "screenshot.png"
  // 截取屏幕截图
  const image = robot.screen.capture(0, 0, 1920, 1080);
  // 将屏幕截图保存为文件
  fs.writeFileSync(screenshot_path, image.image);

  url = "http://192.168.10.116:8089/api/tr-run/"

  image_data = open(screenshot_path, 'rb').read()
  multipart_data = {
    "file": (screenshot_path, image_data, "image/png"),
    "compress": (None, "960"),
  }

  const response = await axios.post(url, multipartData, { verify: false });

  console.log(response.data);

  // More conversions here

  // fs.writeFileSync('result.json', newResponseString);

  // More conversions here
}
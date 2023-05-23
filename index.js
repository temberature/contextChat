const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const { exec } = require("child_process");
const puppeteer = require("puppeteer");
const TurndownService = require("turndown");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const { clipboard } = require("electron");
const fs = require("fs");
const { Tiktoken } = require("@dqbd/tiktoken/lite");
const cl100k_base = require("@dqbd/tiktoken/encoders/cl100k_base.json");
const log = require('electron-log');

require("dotenv").config();



// ipcMain.on('requestLog', (event) => {
//   // 判断日志文件是否存在
//   if (!fs.existsSync('logfile.txt')) {
//     fs.writeFile('logfile.txt', '', (err) => {
//       if (err) throw err;
//     });
//   }
//   // Read the log file and send its contents to the renderer process
//   fs.readFile('logfile.txt', 'utf8', (err, data) => {
//     if (err) throw err;
//     event.sender.send('logFile', data);
//   });
// });

const encoding = new Tiktoken(
  cl100k_base.bpe_ranks,
  cl100k_base.special_tokens,
  cl100k_base.pat_str
);

let mainWindow;
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
  mainWindow = win;
}

// function log(level, message) {
//   const timestamp = new Date().toISOString();
//   const logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}\n`;
  
//   console.log(logMessage);
  
//   // fs.appendFile('logfile.txt', logMessage, (err) => {
//   //   if (err) throw err;
//   // });

//   // send the log message to the renderer process
//   mainWindow.webContents.send('logMessage', logMessage);
// }
app.whenReady().then(createWindow);
app.whenReady().then(() => {
  const ret = globalShortcut.register("CommandOrControl+Alt+S", () => {
    app.show();
    app.focus({ steal: true });
    // checkActiveApp((activeApp) => {
    //   if (activeApp === 'Discord') {
    //     getContext();
    //   }
    // });
  });

  if (!ret) {
    console.log("快捷键注册失败");
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("get-summary", async (event) => {
  log.info('Getting summary...');
  let content = clipboard.readText();
  log.info('clipboard content: ' + content.slice(0, 100));
  let url = "",
    title = "";
  if (!content || content.length < 1000) {
    const webpageContent = await getActiveBrowserHTML();
    log.info('webpage content: ' + webpageContent.slice(0, 100));
    if (webpageContent === "error") {
      log.warn('Safari 或 Google Chrome 必须处于打开状态。');
      event.reply(
        "summary-result",
        "Safari 或 Google Chrome 必须处于打开状态。"
      );
      return;
    }

    const markdownContent = await getMarkdown(webpageContent);
    log.info('markdown content: ' + markdownContent.slice(0, 100));
    const data = await getActiveBrowserData();
    log.info('active browser data: ' + JSON.stringify(data));
    url = data.url;
    title = data.title;
    content = markdownContent;
  }
  const spliter = "\n";
  const lines = content.split(spliter);
  let contextSize = 0,
    context = "",
    contexts = [];
  for (let i = 0; i < lines.length; i++) {
    const lineSize = encoding.encode(lines[i]).length;
    contextSize += lineSize;
    if (contextSize > 3500) {
      log.info('contextSize: ' + contextSize + '\n' + 'context: ' + context);
      contexts.push(context);

      contextSize = lineSize;
      context = lines[i] + spliter;
    } else {
      context += lines[i] + spliter;
    }
  }
  contexts.push(context);

  event.reply("markdown-contexts", {
    contexts: contexts,
    url: url,
    title: title,
  });
});


function getActiveBrowserData() {
  return new Promise((resolve, reject) => {
    const appleScript = `
    tell application "System Events"
      set processList to name of every process
      if "Safari" is in processList then
        tell application "Safari"
          set theURL to URL of current tab of window 1
          set theTitle to name of current tab of window 1
        end tell
      else if "Google Chrome" is in processList then
        tell application "Google Chrome"
          set theURL to URL of active tab of window 1
          set theTitle to title of active tab of window 1
        end tell
      else
        set theURL to "error"
        set theTitle to "error"
      end if
    end tell
    return theURL & "\n" & theTitle`;

    exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        log.warn(`exec error: ${error}`);
        resolve({ url: "error", title: "error" });
        return;
      }
      const [url, title] = stdout.trim().split("\n");
      log.info(`URL: ${url}, Title: ${title}`);
      resolve({ url, title });
    });
  });
}

// async function getWebpageContent(url) {
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();
//   await page.goto(url, { waitUntil: "networkidle0" });

//   const renderedHtml = await page.content();
//   await browser.close();

//   return renderedHtml;
// }

async function getMarkdown(webpageContent) {
  const dom = new JSDOM(webpageContent);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) return null;
  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(article.content);
  // Save the markdown content to a file (optional)
  // require("fs").writeFileSync("output.md", markdown, "utf8");
  return markdown;
}

function getActiveBrowserHTML() {
  return new Promise((resolve, reject) => {
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
    exec(
      `osascript -e '${appleScript}'`,
      { maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        resolve(stdout.trim());
      }
    );
  });
}

// function checkActiveApp(callback) {
//   const appleScript = `
//   tell application "System Events"
//     set activeApp to name of first application process whose frontmost is true
//   end tell
//   return activeApp`;

//   exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
//     if (error) {
//       console.error(`exec error: ${error}`);
//       return;
//     }
//     callback(stdout.trim());
//   });
// }

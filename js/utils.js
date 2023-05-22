const snoowrap = require("snoowrap");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { SSE } = require("sse.js");
const os = require("os");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const OPENAI_API_KEY = localStorage.getItem("OPENAI_API_KEY");
// 获取mac用户目录
const USER_HOME = os.homedir();
console.log(USER_HOME);

const HISTORY_FOLDER = path.resolve(USER_HOME, "history");
const HISTORY_FILE = path.resolve(HISTORY_FOLDER, "history.md");
console.log(HISTORY_FILE);
//如果文件夹不存在则创建
if (!fs.existsSync(HISTORY_FOLDER)) {
  fs.mkdirSync(HISTORY_FOLDER);
}
//如果文件不存在则创建
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, "");
}
function setLoading(loading) {
  const loadingElement = document.getElementById("loading");
  if (loading) {
    loadingElement.style.display = "block";
  } else {
    loadingElement.style.display = "none";
  }
}

async function getCompletion(prompt, model = "gpt-3.5-turbo") {
  const requestBody = {
    model: model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function getCompletionStream(prompt, options, callback) {
  return new Promise((resolve, reject) => {
    const requestBody = {
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 1,
      stream: true,
      presence_penalty: 0,
      ...options,
    };

    const source = new SSE(`https://api.openai.com/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      payload: JSON.stringify(requestBody),
    });
    let first = true,
      chunk;
    source.addEventListener("error", (e) => {
      console.log(e);
      const data = JSON.parse(e.data || "{}");
      if (data.error) {
        console.log(data.error);
        let confirmation;
        if (data.error.code === "context_length_exceeded") {
          alert(`${JSON.stringify(data.error)}`);
        } else {
          confirmation = window.confirm(
            `${JSON.stringify(data.error)}\n\nWould you like to try again?`
          );
        }
      }
    });
    let response = "";
    source.addEventListener("message", function (e) {
      // Assuming we receive JSON-encoded data payloads:
      // console.log(e.data);
      if (e.data !== "[DONE]") {
        var data = JSON.parse(e.data);
        // console.log(data);

        if (!data.choices[0].delta.content) {
          return;
        }
        chunk = data.choices[0].delta.content;
        response += chunk;

        callback(chunk);
      } else {
        resolve(response);
      }
    });
    source.stream();
  });
}

function redditPost(url, title, subredditName = "thirdbrain") {
  if (process.env.REDDIT_USER_AGENT === undefined) {
    return;
  }
  // Replace these with your own values
  const r = new snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT,
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  });

  // Post the link
  r.getSubreddit(subredditName)
    .submitLink({ title: title, url: url })
    .then(console.log)
    .catch(console.error);
}

function redditTextPost(title, text, subredditName = "thirdbrain") {
  if (process.env.REDDIT_USER_AGENT === undefined) {
    return;
  }
  // Replace these with your own values
  const r = new snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT,
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  });

  // Post the text
  r.getSubreddit(subredditName)
    .submitSelfpost({ title: title, text: text })
    .then(console.log)
    .catch(console.error);
}

function getParametersFromLocalStorage() {
  let parameters;
  if (localStorage.getItem("parameters") === null) {
    parameters = [
      ["gpt-3.5-turbo", `Could you please generate three short, hypothetical dialogues that could take place in one round of conversation among two characters from the TV show "Person of Interest"? Each dialogue should incorporate the theme of "\${value}" and be provided with a brief background for context.`, 1, true, 0], // Default values for Command 1
      ["gpt-3.5-turbo", `5 concepts most related to "\${value}", give only words list itself.\n\nhyponym and hypernym of "\${value}" and the differences between these words?`, 1, true, 0], // Default values for Command 2
      ["gpt-3.5-turbo", "如果我觉得这段话最值得沉思，反过来说，我有哪些个人需要和兴趣？仅给出最匹配的三个结果的列表，不要解释和额外的说明。", 1, true, 0], // Default values for Command 3
      ["gpt-3.5-turbo", "总结上述内容，以大纲的形式给出，给出行数来源，并使用中文。", 1, true, 0], // Default values for Get Summary
    ]
    localStorage.setItem("parameters", JSON.stringify(parameters));
  } else {
    parameters = JSON.parse(localStorage.getItem("parameters"));
  }
  return parameters;
}

function getLastUuidFromFile() {
  // Read the history file
  const data = fs.readFileSync(HISTORY_FILE, "utf8");

  // Split the file by the markdown separator
  const sections = data
    .split("---")
    .filter((section) => section.length > 0 && section !== "\n\n");
  console.log(sections);
  // Get the last section
  const lastSection = sections[sections.length - 1];

  // Extract the UUID from the last section
  const uuidMatch = lastSection.match(/Chat UUID: (\S+)/);
  if (uuidMatch) {
    return uuidMatch[1];
  } else {
    return null;
  }
}

function saveToHistory(request, response, newChat = false) {
  console.log("Saving to history");
  console.log(request);
  console.log(response);
  // Generate a UUID for the dialogue

  const uuid = newChat ? uuidv4() : getLastUuidFromFile();
  const markdownText = `# Chat UUID: ${uuid}\n\n# User\n\n${request}\n\n# Assitant\n\n${response}\n\n---\n\n`;

  //append data to file
  fs.appendFile(HISTORY_FILE, markdownText, (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("File written successfully");
    }
  });
  return uuid;
}

// Function to sanitize a string to be safe for a filename
function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

function updateDesires(desires, uuid) {
  desires.forEach((desire) => {
    const parts = desire.split(".");
    if (parts.length < 2) {
      return;
    }
    const filename = parts[1].trim();
    const markdownText = uuid + "\n";
    const filePath = path.join(HISTORY_FOLDER, `${filename}.md`);
    fs.appendFile(filePath, markdownText, (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log("File written successfully");
      }
    });
  });
}

function readAllDesires() {
  // Define the path to the directory
  const dirPath = path.join(HISTORY_FOLDER);

  // Read all the file names in the directory
  const files = fs.readdirSync(dirPath);

  // Filter out 'history.md' and any non-md files
  const desireFiles = files.filter(
    (file) => file !== "history.md" && path.extname(file) === ".md"
  );

  // If you want just the desire names without the '.md' extension, you can use map
  const desires = desireFiles.map((file) => path.basename(file, ".md"));

  return desires;
}

function readLastChatHistoryFile() {
  // 判断文件是否存在
  if (!fs.existsSync(HISTORY_FILE)) {
    console.log("文件不存在");
    return "";
  }
  const data = fs.readFileSync(HISTORY_FILE, "utf8");
  // 如果文件内容为空
  if (data === "") {
    console.log("文件内容为空");
    return "";
  }
  const chats = data.split("---\n\n").filter((chat) => chat !== ""); // Split the file content by '---\n\n'
  console.log(chats);
  const lastChat = chats[chats.length - 1]; // Get the last chat
  return lastChat;
}

module.exports = {
  getCompletion,
  getCompletionStream,
  setLoading,
  redditPost,
  redditTextPost,
  getParametersFromLocalStorage,
  saveToHistory,
  readLastChatHistoryFile,
  updateDesires,
  readAllDesires,
};

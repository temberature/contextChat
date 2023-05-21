const { ipcRenderer } = require("electron");
const {
  getCompletion,
  getCompletionStream,
  setLoading,
  redditPost,
  redditTextPost,
  getParametersFromLocalStorage,
  saveToMarkdown,
} = require("./utils");
const { clipboard } = require("electron");

var vex = require("vex-js");
vex.registerPlugin(require("vex-dialog"));
vex.defaultOptions.className = "vex-theme-os";

window.lastButtonKey = null;

async function handleButtonPress(buttonKey) {
  window.lastButtonKey = buttonKey;

  if (buttonKey !== 3) {
    setLoading(true);
    document.getElementById("result").innerText = "";
    showParametersForm(buttonKey - 1);
  }

  switch (buttonKey) {
    case 1:
      createDialogues();
      break;
    case 2:
      relatedConcepts();
      break;
    case 3:
      await createChat();
      break;
    case 4:
      summarize();

      break;
  }

}

async function createChat() {
  // Select the textarea
  const textArea = document.getElementById("user-message");
  textArea.value = clipboard.readText();
  textArea.focus();
  await waitChat();
  await chat(true);
}

async function waitChat() {
  // Create a promise that resolves when the 'Enter' key is pressed
  const waitForEnter = new Promise((resolve) => {
    const textArea = document.getElementById("user-message");
    textArea.addEventListener("keyup", function (event) {
      // Number 13 is the "Enter" key on the keyboard
      if (event.keyCode === 13) {
        event.preventDefault();
        textArea.removeEventListener("keyup", arguments.callee);
        resolve();
      }
    });
  });
  // Wait for the 'Enter' key to be pressed
  await waitForEnter;
}
async function chat(newChat = false) {


  setLoading(true);
  document.getElementById("result").innerText = "";
  showParametersForm(2);
  // Call getCompletionStream with the text from the textarea
  const userMessage = textArea.value;
  console.log(userMessage);
  textArea.value = "";
  // Call the function and store its return value in a variable
  const parameters = getParametersFromLocalStorage();
  let [model, prompt, temperature, stream, presencePenalty] = parameters[2] || [
    "gpt-3.5-turbo",
    "Command 3 prompt",
    1,
    true,
    0,
  ];
  prompt = userMessage;
  document.getElementById("result").innerText += prompt + "\n\n";
  const response = await getCompletionStream(
    prompt,
    {
      model,
      temperature,
      stream,
      presence_penalty: presencePenalty,
    },
    (chunk) => {
      setLoading(false);
      document.getElementById("result").innerText += chunk;
    }
  );
  saveToMarkdown(prompt, response, newChat);
  await waitChat();
  await chat();
}

function createDialogues() {
  createResponse(0);
}

function relatedConcepts() {
  createResponse(1);
}
async function createResponse(index) {
  console.log("createResponse");
  vex.dialog.prompt({
    message: "word?",
    placeholder: "Planet name",
    callback: async function (value) {
      console.log(value);
      // const prompt = `Could you please create three brief, hypothetical, one-round dialogues in the style of the characters from the TV show "Person of Interest" with background, where each dialogue incorporates "${value}"?\n\n`;

      // Call the function and store its return value in a variable
      const parameters = getParametersFromLocalStorage();
      let [model, prompt, temperature, stream, presencePenalty] =
        parameters[index];
      prompt = prompt.replace("${value}", value);
      document.getElementById("result").innerText += prompt + "\n\n";
      const response = await getCompletionStream(
        prompt,
        {
          model,
          temperature,
          stream,
          presence_penalty: presencePenalty,
        },
        (chunk) => {
          setLoading(false);
          document.getElementById("result").innerText += chunk;
        }
      );
      saveToMarkdown(prompt, response);
    },
  });
}

ipcRenderer.on("markdown-contexts", async (event, data) => {
  const { url, title, contexts } = data;
  document.getElementById("result").innerText += title + "\n" + url + "\n\n";
  let response = "";
  for (let i = 0; i < contexts.length; i++) {
    const context = contexts[i];
    // const prompt = context + "\n总结上述内容，以大纲的形式给出，并使用中文。\n";
    // console.log(prompt);

    // Call the function and store its return value in a variable
    const parameters = getParametersFromLocalStorage();
    const [model, prompt, temperature, stream, presencePenalty] = parameters[3];

    response += await getCompletionStream(
      context + prompt,
      {
        model,
        temperature,
        stream,
        presence_penalty: presencePenalty,
      },

      (chunk) => {
        setLoading(false);
        document.getElementById("result").innerText += chunk;
      }
    );

    document.getElementById("result").innerText += "\n\n";
  }
  saveToMarkdown(`${title}\n${url}\n${prompt}`, response);
  document.getElementById("result").innerText += "（AI generated content）";
  if (!title) {
    return;
  }
  redditTextPost(
    title,
    url + "\n\n" + document.getElementById("result").innerText
  );
});

async function summarize() {
  ipcRenderer.send("get-summary");
}

module.exports = {
  handleButtonPress,
  chat
};

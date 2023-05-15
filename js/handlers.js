const { ipcRenderer } = require("electron");
const { getCompletion, getCompletionStream, setLoading, redditPost } = require("./utils");
const { clipboard } = require('electron');


var vex = require('vex-js')
vex.registerPlugin(require('vex-dialog'))
vex.defaultOptions.className = 'vex-theme-os'



function handleButtonPress(buttonKey) {
    switch (buttonKey) {
        case "1":
            createDialogues();
            break;
        case "4":
            summarize();

            break;


    }
}

async function createDialogues() {
    console.log("createDialogues");
    vex.dialog.prompt({
        message: 'word?',
        placeholder: 'Planet name',
        callback: async function (value) {
            console.log(value)
            const prompt = `Could you please create three brief, hypothetical, one-round dialogues in the style of the characters from the TV show "Person of Interest" with background, where each dialogue incorporates "${value}"?\n\n`;
            document.getElementById("result").innerText += prompt;
            const response = await getCompletionStream(
                prompt,
                "gpt-3.5-turbo",
                (chunk) => {
                    setLoading(false);
                    document.getElementById("result").innerText += chunk;
                }
            );
        }
    })

}

ipcRenderer.on("markdown-contexts", async (event, contexts) => {
    for (let i = 0; i < contexts.length; i++) {
        const context = contexts[i];
        const prompt = context + ",summarize above content：";
        console.log(prompt);
        const response = await getCompletionStream(
            prompt,
            "gpt-3.5-turbo",
            (chunk) => {
                setLoading(false);
                document.getElementById("result").innerText += chunk;
            }
        );
        document.getElementById("result").innerText += "\n\n";
    }
    redditPost();
})

async function summarize() {
    let content = clipboard.readText();

    if (content && content.length > 1000) {
        const prompt = content + ", summarize above content:";
        console.log(prompt);
        const response = await getCompletionStream(
            prompt,
            "gpt-3.5-turbo",
            (chunk) => {
                setLoading(false);
                document.getElementById("result").innerText += chunk;
            }
        );
        document.getElementById("result").innerText += "\n\n";
    } else {
        ipcRenderer.send("get-summary");
    }
}

module.exports = {
    handleButtonPress,
};
const { ipcRenderer } = require("electron");
const { getCompletion, getCompletionStream, setLoading } = require("./utils");
var vex = require('vex-js')
vex.registerPlugin(require('vex-dialog'))
vex.defaultOptions.className = 'vex-theme-os'

function handleButtonPress(buttonKey) {
    switch (buttonKey) {
        case "1":
            createDialogues();
            break;
        case "4":
            ipcRenderer.send("get-summary");
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
            const prompt = `Could you please create three brief, hypothetical one-round dialogues in the style of the characters from the TV show "Person of Interest" with background, where each dialogue incorporates "${value}"?\n\n`;
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

ipcRenderer.on("markdown-excerpt", async (event, markdownExcerpt) => {
    const prompt = markdownExcerpt.replaceAll(' ', '') + "总结一下上述内容：";
    console.log(prompt);
    const response = await getCompletionStream(
        prompt,
        "gpt-3.5-turbo",
        (chunk) => {
            setLoading(false);
            document.getElementById("result").innerText += chunk;
        }
    );

    // Handle the response as needed, e.g., display it in the web page
})

module.exports = {
    handleButtonPress,
};
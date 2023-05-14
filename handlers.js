const { ipcRenderer } = require("electron");
const { getCompletion, getCompletionStream, setLoading } = require("./utils");

function handleButtonPress(buttonKey) {
    switch (buttonKey) {
        case "4":
            setLoading(true);
            ipcRenderer.send("get-summary");


    }
}

ipcRenderer.on("markdown-excerpt", async (event, markdownExcerpt) => {
    const prompt = markdownExcerpt.replaceAll(' ', '') + "总结一下上述内容：";
    console.log(prompt);
    const response = await getCompletionStream(
        prompt,
        "gpt-3.5-turbo",
        (chunk) => {
            setLoading(false);
            document.getElementById("result").innerText = chunk;
        }
    );

    // Handle the response as needed, e.g., display it in the web page
})

module.exports = {
    handleButtonPress,
};
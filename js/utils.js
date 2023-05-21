const snoowrap = require('snoowrap');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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

    const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ***REMOVED***`,
            },
            body: JSON.stringify(requestBody),
        }
    );

    const data = await response.json();
    return data.choices[0].message.content;
}

async function getCompletionStream(
    prompt,
    options,
    callback
) {
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
                Authorization: `Bearer ***REMOVED***`,
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

function redditPost(url, title, subredditName="thirdbrain") {
    // Replace these with your own values
    const r = new snoowrap({
        userAgent: '***REMOVED***',
        clientId: '***REMOVED***',
        clientSecret: '***REMOVED***',
        username: '***REMOVED***',
        password: '***REMOVED***'
    });

    // Post the link
    r.getSubreddit(subredditName).submitLink({ title: title, url: url })
        .then(console.log)
        .catch(console.error);
}

function redditTextPost(title, text, subredditName="thirdbrain") {
    // Replace these with your own values
    const r = new snoowrap({
        userAgent: '***REMOVED***',
        clientId: '***REMOVED***',
        clientSecret: '***REMOVED***',
        username: '***REMOVED***',
        password: '***REMOVED***'
    });

    // Post the text
    r.getSubreddit(subredditName).submitSelfpost({ title: title, text: text })
        .then(console.log)
        .catch(console.error);
}

function getParametersFromLocalStorage() {
    const parameters = JSON.parse(localStorage.getItem("parameters")) || [
        ["gpt-3.5-turbo", "Command 1 prompt", 1, true, 0],  // Default values for Command 1
        ["gpt-3.5-turbo", "Command 2 prompt", 1, true, 0],  // Default values for Command 2
        ["gpt-3.5-turbo", "Command 3 prompt", 1, true, 0],  // Default values for Command 3
        ["gpt-3.5-turbo", "Get summary prompt", 1, true, 0] // Default values for Get Summary
    ];
    return parameters;
}

function getLastUuidFromFile() {
    const filePath = path.join(__dirname + "/../", 'history.md');
    const data = fs.readFileSync(filePath, 'utf8');

    // Split the file by the markdown separator
    const sections = data.split('---').filter((section) => section.length > 0 && section !== '\n\n');
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




function saveToMarkdown(request, response, newChat = false) {
    // Generate a UUID for the dialogue

    const uuid = newChat ? uuidv4() : getLastUuidFromFile();
    const markdownText = `# Chat UUID: ${uuid}\n\n# User\n\n${request}\n\n# Assitant\n\n${response}\n\n---\n\n`;
    const filePath = path.join(__dirname + "/../", 'history.md');
    //append data to file
    fs.appendFile(filePath, markdownText, (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('File written successfully');
        }
    });
}

function readLastChatHistoryFile() {
    const filePath = path.join(__dirname + "/../", 'history.md');
    const data = fs.readFileSync(filePath, 'utf8');
    const chats = data.split('---\n\n').filter(chat => chat !== ''); // Split the file content by '---\n\n'
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
    saveToMarkdown,
    readLastChatHistoryFile
};
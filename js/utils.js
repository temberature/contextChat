const snoowrap = require('snoowrap');
const fetch = require('node-fetch');

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
                Authorization: `Bearer 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`,
            },
            body: JSON.stringify(requestBody),
        }
    );

    const data = await response.json();
    return data.choices[0].message.content;
}
async function getCompletionStream(
    prompt,
    model = "gpt-3.5-turbo",
    callback
) {
    return new Promise((resolve, reject) => {

        const requestBody = {
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 1,
            stream: true,
        };

        const source = new SSE(`https://api.openai.com/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer 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`,
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
        source.addEventListener("message", function (e) {
            // Assuming we receive JSON-encoded data payloads:
            console.log(e.data);
            if (e.data !== "[DONE]") {
                var data = JSON.parse(e.data);
                // console.log(data);

                if (!data.choices[0].delta.content) {
                    return;
                }
                if (first) {
                    chunk = data.choices[0].delta.content;
                    first = false;
                } else {
                    chunk = data.choices[0].delta.content;
                }
                callback(chunk);
            } else {
                resolve();
            }
        });
        source.stream();
    });
}

function redditPost(url, title, subredditName="thirdbrain") {
    // Replace these with your own values
    const r = new snoowrap({
        userAgent: 'your_user_agent',
        clientId: 'kOMMUHcNrDTmC4w7N4Fg_Q',
        clientSecret: 'cKIB6DmymUYd9G7TGD23c-zM1BI3fA',
        username: 'temberatur',
        password: 'IhAd@!159107'
    });

    // Post the link
    r.getSubreddit(subredditName).submitLink({ title: title, url: url })
        .then(console.log)
        .catch(console.error);
}

function redditTextPost(title, text, subredditName="thirdbrain") {
    // Replace these with your own values
    const r = new snoowrap({
        userAgent: 'your_user_agent',
        clientId: 'kOMMUHcNrDTmC4w7N4Fg_Q',
        clientSecret: 'cKIB6DmymUYd9G7TGD23c-zM1BI3fA',
        username: 'temberatur',
        password: 'IhAd@!159107'
    });

    // Post the text
    r.getSubreddit(subredditName).submitSelfpost({ title: title, text: text })
        .then(console.log)
        .catch(console.error);
}


module.exports = {
    getCompletion,
    getCompletionStream,
    setLoading,
    redditPost,
    redditTextPost
};
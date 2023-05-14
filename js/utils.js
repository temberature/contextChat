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
    const requestBody = {
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
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
        }
    });
    source.stream();
}

module.exports = {
    getCompletion,
    getCompletionStream,
    setLoading,
};
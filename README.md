# ContextChat

ContextChat is an interactive application to leverage the power of AI models for generating relevant and coherent responses for users. The application is built with JavaScript and Electron, and it uses OpenAI's models for the chat interface.

## Features

- Interactive chat interface with various commands.
- Command customization according to the user's needs.
- Settings to adjust the model parameters for more precise responses.
- Copy results to the clipboard with a single click.
- Persistent storage of API keys and settings in local storage.

## Installation

Prerequisites: You need to have Node.js and npm/yarn installed on your machine.

1. Clone the repository.
```bash
git clone https://github.com/temberature/contextChat
```
2. Navigate into the project directory and install dependencies.
```bash
cd context-chat
npm install
# or
yarn install
```

3. Start the application.
```bash
npm start
# or
yarn start
```

## Usage

- Run the application. 
- If you are running the application for the first time, you will be prompted to enter your OpenAI API Key. After entering the key, the application will reload.
- Use the number keys to trigger the corresponding prompts.
- Customize the prompts and model parameters as needed.
- Use the chat area to interact with the AI model.
- Press `ctrl` + `[number]` to quickly execute a command.
- The result from the AI will be displayed in the result area.
- Click the "Copy Result" button to copy the result to your clipboard.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

Please check the license file in the project for details.

## Acknowledgements

This project leverages the [OpenAI API](https://openai.com/) for generating AI responses.
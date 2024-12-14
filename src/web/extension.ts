// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const provider = new OllamaChatProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(OllamaChatProvider.viewType, provider));

}

// This method is called when your extension is deactivated
export function deactivate() {
	// Noop
}

class OllamaChatProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'ollama-chat.chat';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this.makeHTML(webviewView.webview)
	}

	private makeHTML(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/web', 'app.js'));
		const markedUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/web', 'marked.js'));
		const resetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/web', 'reset.css'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src/web', 'style.css'));

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				
				<link href="${resetUri}" rel="stylesheet">
				<link href="${styleUri}" rel="stylesheet">
				<title>Ollama Chat</title>
			</head>
			<body>
				<section id="feed">
					<h3>Hello human! 🤖</h3>
					<p>I am your privacy-friendly assistant ready to answer all your coding questions! 🙋</p>
					<p>I rely on Ollama and therefore all the data of our exchanges will stay private 🔐</p>
					<p>How cool is that?</p>
				</section>
				
				<form id="chat">
					<textarea placeholder="Type your message prompt here..." id="prompt" name="prompt"></textarea>
					<button type="submit">Send</button>
					<select id="models" name="model">
						<option> -- Select Model -- </option>
					</select>
				</form>    

				<script src="${markedUri}"></script>
				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

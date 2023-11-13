import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { diffChars, diffWords } from "diff";
import axios from "axios";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	previousText = "";
	previousTextWordChanges = "";
	alreadyPressedSpace = false;
	dictionary: string[] = [];

	async onload() {
		await this.loadSettings();

		const words = (await axios.get("http://localhost:5000/getWords")).data;

		this.dictionary = words;
		console.log("length of dictionary: " + this.dictionary.length);
		this.previousText =
			this.app.workspace.activeEditor?.editor?.getDoc().getValue() || "";
		this.previousTextWordChanges = this.previousText;

		// listen for user typing
		this.app.workspace.on("editor-change", async (editor, info) => {
			if (this.previousText) {
				const diff = diffChars(
					this.previousText,
					editor.getDoc().getValue()
				);

				console.log("diff", diff);

				// if last object in diff is a ' ' then we know the user pressed space
				/// check to see if the diff has a blank space in it
				const hasBlankSpace = diff.some((item) => item.value === " ");
				if (hasBlankSpace) {
					const wordDiff = diffWords(
						this.previousTextWordChanges,
						editor.getDoc().getValue()
					);

					console.log("wordDiff");
					console.log(wordDiff);

					if (wordDiff.length !== 2 && wordDiff.length !== 3) {
						this.previousTextWordChanges = editor
							.getDoc()
							.getValue();
						this.previousText = editor.getDoc().getValue();
						return;
					} else {
						// get the current position of the word in the editor.
						const cursor = editor.getCursor();
						const line = cursor.line;
						const endCh = cursor.ch;

						// check if the word is in the dictionary
						const word = wordDiff[1].value;
						const length = word.length; // adding one to account for the space
						// remove spaces or any non alphabetic characters
						const strippedWord = word
							.replace(/\s+/g, "")
							.replace(/[^\w\s]/g, "");

						if (
							this.dictionary.includes(strippedWord.toLowerCase())
						) {
							this.previousTextWordChanges = editor
								.getDoc()
								.getValue();
							this.previousText = editor.getDoc().getValue();

							return;
						}

						console.log("going for correction");
						console.log(strippedWord);

						const correctionData = (
							await axios.get(
								"http://localhost:5000/process_word?word=" +
									strippedWord
							)
						).data;

						const correctedWord =
							correctionData.results.metadatas[0][0].source.replace(
								/\n/g,
								""
							) + " ";

						console.log("correctedWord", correctedWord);

						editor.replaceRange(
							correctedWord,
							{
								line: line,
								ch: endCh - length,
							},
							{
								line: line,
								ch: endCh,
							}
						);
					}

					this.previousTextWordChanges = editor.getDoc().getValue();
				}
			}

			this.previousText = editor.getDoc().getValue();
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const file = this.app.workspace.getActiveFile();
				console.log(file);

				const text = editor.getDoc().getValue();
				console.log(text);

				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

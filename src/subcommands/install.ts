import { execute } from "../cli.ts";

const colors = {
	green: "\x1b[32m",
	blue: "\x1b[34m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
};

interface ShortcutConfig {
	command: string;
	commandLong: string;
	chat: string;
}

const defaultShortcuts: ShortcutConfig = {
	command: "nexus",
	commandLong: "orbit",
	chat: "aurora",
};

async function readInput(prompt: string): Promise<string> {
	await Deno.stdout.write(new TextEncoder().encode(prompt));
	const decoder = new TextDecoder();
	const buffer = new Uint8Array(1024);

	const bytesRead = await Deno.stdin.read(buffer);
	if (bytesRead === null) {
		return "";
	}

	return decoder.decode(buffer.subarray(0, bytesRead)).trim();
}

function validateShortcut(shortcut: string): boolean {
	if (!shortcut) return false;
	if (shortcut.includes(" ")) return false;
	if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(shortcut)) return false;
	return true;
}

async function promptForShortcuts(): Promise<ShortcutConfig> {
	console.log(`${colors.bold}${colors.blue}Nova Install${colors.reset}\n`);
	console.log("Setting up shell shortcuts for Nova commands.");
	console.log(
		`${colors.dim}Press Enter to use default values.${colors.reset}\n`,
	);

	let command: string;
	while (true) {
		const input = await readInput(
			`Shortcut for "${colors.blue}nova command${colors.reset}" [${colors.green}${defaultShortcuts.command}${colors.reset}]: `,
		);

		command = input || defaultShortcuts.command;

		if (validateShortcut(command)) {
			break;
		} else {
			console.log(
				`${colors.red}Error:${colors.reset} Shortcuts must be single words (alphanumeric, underscore, hyphen only)\n`,
			);
		}
	}

	let commandLong: string;
	while (true) {
		const input = await readInput(
			`Shortcut for "${colors.blue}nova command -l${colors.reset}" [${colors.green}${defaultShortcuts.commandLong}${colors.reset}]: `,
		);

		commandLong = input || defaultShortcuts.commandLong;

		if (validateShortcut(commandLong)) {
			break;
		} else {
			console.log(
				`${colors.red}Error:${colors.reset} Shortcuts must be single words (alphanumeric, underscore, hyphen only)\n`,
			);
		}
	}

	let chat: string;
	while (true) {
		const input = await readInput(
			`Shortcut for "${colors.blue}nova chat${colors.reset}" [${colors.green}${defaultShortcuts.chat}${colors.reset}]: `,
		);

		chat = input || defaultShortcuts.chat;

		if (validateShortcut(chat)) {
			break;
		} else {
			console.log(
				`${colors.red}Error:${colors.reset} Shortcuts must be single words (alphanumeric, underscore, hyphen only)\n`,
			);
		}
	}

	return { command, commandLong, chat };
}

function detectShell(): { shell: string; rcFile: string } {
	const shell = Deno.env.get("SHELL") || "/bin/bash";
	const home = Deno.env.get("HOME") || "";

	if (shell.includes("zsh")) {
		return { shell: "zsh", rcFile: `${home}/.zshrc` };
	} else if (shell.includes("fish")) {
		return { shell: "fish", rcFile: `${home}/.config/fish/config.fish` };
	} else {
		return { shell: "bash", rcFile: `${home}/.bashrc` };
	}
}

function generateAliases(shortcuts: ShortcutConfig, shell: string): string {
	const timestamp = new Date().toISOString().split("T")[0];

	if (shell === "fish") {
		return `
# Nova shortcuts - added by nova install (${timestamp})
alias ${shortcuts.command} 'nova command'
alias ${shortcuts.commandLong} 'nova command -l'
alias ${shortcuts.chat} 'nova chat'
`;
	} else {
		// bash/zsh
		return `
# Nova shortcuts - added by nova install (${timestamp})
alias ${shortcuts.command}='nova command'
alias ${shortcuts.commandLong}='nova command -l'
alias ${shortcuts.chat}='nova chat'
`;
	}
}

async function ensureRcFileExists(rcFile: string): Promise<void> {
	try {
		await Deno.stat(rcFile);
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			await Deno.writeTextFile(rcFile, "");
		} else {
			throw error;
		}
	}
}

async function appendToRcFile(rcFile: string, content: string): Promise<void> {
	await ensureRcFileExists(rcFile);
	await Deno.writeTextFile(rcFile, content, { append: true });
}

export async function handleInstall() {
	try {
		const shortcuts = await promptForShortcuts();
		const { shell, rcFile } = detectShell();

		console.log(`\n${colors.bold}Configuration:${colors.reset}`);
		console.log(
			`  ${colors.blue}${shortcuts.command}${colors.reset} → nova command`,
		);
		console.log(
			`  ${colors.blue}${shortcuts.commandLong}${colors.reset} → nova command -l`,
		);
		console.log(`  ${colors.blue}${shortcuts.chat}${colors.reset} → nova chat`);
		console.log(`  Shell: ${colors.green}${shell}${colors.reset}`);
		console.log(`  RC file: ${colors.green}${rcFile}${colors.reset}\n`);

		const confirm = await readInput(
			`Proceed with installation? [${colors.green}Y${colors.reset}/n]: `,
		);

		if (confirm.toLowerCase() === "n" || confirm.toLowerCase() === "no") {
			console.log("Installation cancelled.");
			return;
		}

		const aliases = generateAliases(shortcuts, shell);
		await appendToRcFile(rcFile, aliases);

		console.log(`${colors.green}✓${colors.reset} Aliases added to ${rcFile}`);
		console.log(
			`${colors.dim}You may need to restart your shell or run:${colors.reset}`,
		);

		if (shell === "fish") {
			console.log(`  ${colors.blue}source ${rcFile}${colors.reset}`);
		} else {
			console.log(`  ${colors.blue}source ${rcFile}${colors.reset}`);
		}

		console.log(`\n${colors.bold}Your new shortcuts:${colors.reset}`);
		console.log(
			`  ${colors.green}${shortcuts.command}${colors.reset} "<prompt>" - Generate and run commands`,
		);
		console.log(
			`  ${colors.green}${shortcuts.commandLong}${colors.reset} "<prompt>" - Long mode commands`,
		);
		console.log(
			`  ${colors.green}${shortcuts.chat}${colors.reset} - Start chat session`,
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`${colors.red}Error:${colors.reset} ${errorMessage}`);
		throw error;
	}
}

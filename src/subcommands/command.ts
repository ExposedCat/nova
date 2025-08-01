import { execute } from "../cli.ts";
import { type Message, generateCommand } from "../ollama.ts";
import { systemPrompt } from "../prompts.ts";
import { Loader } from "../loader.ts";

const colors = {
	green: "\x1b[32m",
	blue: "\x1b[34m",
	yellow: "\x1b[33m",
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
};

async function confirmExecution(
	command: string,
): Promise<{ execute: boolean; userInput?: string }> {
	console.log(
		`${colors.bold}${colors.green}$${colors.reset} ${colors.blue}${command}${colors.reset} (Enter/Esc)`,
	);

	const decoder = new TextDecoder();
	const buffer = new Uint8Array(1024);

	try {
		const bytesRead = await Deno.stdin.read(buffer);

		if (bytesRead === null) {
			return { execute: false };
		}

		const input = decoder.decode(buffer.subarray(0, bytesRead));

		if (input.includes("\x1b")) {
			return { execute: false };
		}

		if (input.trim() === "") {
			return { execute: true };
		}

		return { execute: false, userInput: input.trim() };
	} catch {
		return { execute: false };
	}
}

async function confirmExecutionLong(
	command: string,
): Promise<{ execute: boolean; userInput?: string; escape: boolean }> {
	console.log(
		`${colors.bold}${colors.green}$${colors.reset} ${colors.blue}${command}${colors.reset} (Enter/Esc)`,
	);

	const decoder = new TextDecoder();
	const buffer = new Uint8Array(1024);

	try {
		const bytesRead = await Deno.stdin.read(buffer);

		if (bytesRead === null) {
			return { execute: false, escape: true };
		}

		const input = decoder.decode(buffer.subarray(0, bytesRead));

		if (input.includes("\x1b")) {
			return { execute: false, escape: true };
		}

		if (input.trim() === "") {
			return { execute: true, escape: false };
		}

		return { execute: false, userInput: input.trim(), escape: false };
	} catch {
		return { execute: false, escape: true };
	}
}

export async function handleCommand(userInput: string) {
	const messages: Message[] = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: userInput },
	];

	while (true) {
		const loader = new Loader("Generating...");
		loader.start();

		try {
			const response = await generateCommand(messages);
			loader.stop();

			const command = response.command;

			messages.push({
				role: "assistant",
				content: JSON.stringify(response),
			});

			const confirmResult = await confirmExecution(command);

			if (confirmResult.execute) {
				const result = await execute(command);
				break;
			} else if (confirmResult.userInput) {
				messages.push({ role: "user", content: confirmResult.userInput });
			} else {
				break;
			}
		} catch (error) {
			loader.stop();
			throw error;
		}
	}
}

export async function handleCommandLong(userInput: string) {
	const messages: Message[] = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: userInput },
	];

	while (true) {
		const loader = new Loader("Generating...");
		loader.start();

		try {
			const response = await generateCommand(messages);
			loader.stop();

			const command = response.command;

			messages.push({
				role: "assistant",
				content: JSON.stringify(response),
			});

			const confirmResult = await confirmExecutionLong(command);

			if (confirmResult.escape) {
				break;
			} else if (confirmResult.execute) {
				const result = await execute(command, true);

				if (result.output?.trim()) {
					console.log(result.output);
				}

				if (result.code !== 0) {
					console.log(
						`${colors.yellow}Command exited with code: ${result.code}${colors.reset}`,
					);
				}

				const outputMessage = result.output
					? `Command executed successfully (exit code: ${result.code})\nOutput:\n${result.output}`
					: `Command executed with exit code: ${result.code}`;

				messages.push({
					role: "user",
					content: `[COMMAND_RESULT] ${outputMessage}`,
				});

				const nextInput = await promptForNextQuestion();
				if (nextInput === null) {
					break;
				} else if (nextInput.trim() !== "") {
					messages.push({ role: "user", content: nextInput });
				}
			} else if (confirmResult.userInput) {
				messages.push({ role: "user", content: confirmResult.userInput });
			}
		} catch (error) {
			loader.stop();
			throw error;
		}
	}
}

async function promptForNextQuestion(): Promise<string | null> {
	await Deno.stdout.write(
		new TextEncoder().encode(`${colors.dim}> ${colors.reset}`),
	);

	try {
		const decoder = new TextDecoder();
		const buffer = new Uint8Array(1024);

		const bytesRead = await Deno.stdin.read(buffer);

		if (bytesRead === null) {
			return null;
		}

		const input = decoder.decode(buffer.subarray(0, bytesRead)).trim();

		if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
			return null;
		}

		if (input === "") {
			return await promptForNextQuestion();
		}

		return input;
	} catch {
		console.log("Input error, exiting.");
		return null;
	}
}

import { type Message, chatCompletion } from "../ollama.ts";
import { Loader } from "../loader.ts";

const colors = {
	green: "\x1b[32m",
	blue: "\x1b[34m",
	yellow: "\x1b[33m",
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
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

export async function handleChat() {
	const messages: Message[] = [];

	while (true) {
		try {
			const userInput = await readInput(
				`${colors.bold}${colors.blue}You:${colors.reset} `,
			);

			if (userInput.trim() === "") {
				continue;
			}

			messages.push({ role: "user", content: userInput });

			const loader = new Loader("Typing");
			loader.start();

			try {
				const response = await chatCompletion(messages);
				loader.stop();

				await Deno.stdout.write(
					new TextEncoder().encode(
						`${colors.bold}${colors.green}nova:${colors.reset} `,
					),
				);
				console.log(response.trim());

				messages.push({ role: "assistant", content: response });
			} catch (error) {
				loader.stop();
				throw error;
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(`${colors.yellow}Error:${colors.reset} ${errorMessage}`);
			console.log(
				`${colors.dim}You can continue the conversation.${colors.reset}\n`,
			);
		}
	}
}

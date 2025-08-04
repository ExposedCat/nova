import * as ollama from "./ollama.ts";
import * as gemini from "./gemini.ts";

export type Message = {
	role: "user" | "assistant" | "system";
	content: string;
};

export type CommandResponse = {
	reasoning: string;
	command: string;
};

function getService() {
	const url = Deno.env.get("NOVA_LLM_URL") ?? "http://localhost:11434/api/chat";
	return url === "gemini" ? gemini : ollama;
}

function getDefaultModel() {
	const url = Deno.env.get("NOVA_LLM_URL") ?? "http://localhost:11434/api/chat";
	return url === "gemini" ? "gemini-2.0-flash" : "gemma3n:e4b";
}

export function chatCompletion(
	messages: Message[],
	options: {
		format?: "json" | object;
		stream?: boolean;
		model?: string;
	} = {},
): Promise<string> {
	const service = getService();
	const model =
		options.model ?? Deno.env.get("NOVA_MODEL") ?? getDefaultModel();

	return service.chatCompletion(messages, {
		...options,
		model,
	});
}

export async function generateCommand(
	messages: Message[],
): Promise<CommandResponse> {
	const content = await chatCompletion(messages, {
		format: {
			type: "object",
			properties: {
				reasoning: {
					type: "string",
					description:
						"Explanation of what the user wants and why this command was chosen",
				},
				command: {
					type: "string",
					description: "Shell command to execute",
				},
			},
			required: ["reasoning", "command"],
		},
	});

	const commandData: CommandResponse = JSON.parse(content);
	return commandData;
}

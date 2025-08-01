export type Message = {
	role: "user" | "assistant" | "system";
	content: string;
};

export type CommandResponse = {
	reasoning: string;
	command: string;
};

export async function chatCompletion(
	messages: Message[],
	options: {
		format?: "json" | object;
		stream?: boolean;
		model?: string;
	} = {},
): Promise<string> {
	const body: any = {
		model: options.model ?? Deno.env.get("OLLAMA_MODEL") ?? "gemma3n:e4b",
		messages: messages,
		stream: options.stream ?? false,
	};

	if (options.format) {
		if (options.format === "json") {
			body.format = "json";
		} else if (typeof options.format === "object") {
			body.format = options.format;
		}
	}

	const response = await fetch(
		Deno.env.get("OLLAMA_URL") ?? "http://localhost:11434/api/chat",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		},
	);

	if (!response.ok) {
		throw new Error(
			`Ollama API error: ${response.status} ${response.statusText}`,
		);
	}

	const data = await response.json();
	return data.message.content;
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

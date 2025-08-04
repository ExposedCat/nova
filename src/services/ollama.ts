export type Message = {
	role: "user" | "assistant" | "system";
	content: string;
};

export type CommandResponse = {
	reasoning: string;
	command: string;
};

type RequestBody = {
	model: string;
	messages: Message[];
	stream: boolean;
	format?: "json" | object;
};

export async function chatCompletion(
	messages: Message[],
	options: {
		format?: "json" | object;
		stream?: boolean;
		model?: string;
	} = {},
): Promise<string> {
	const url = Deno.env.get("NOVA_LLM_URL") ?? "http://localhost:11434/api/chat";
	const model = options.model ?? Deno.env.get("NOVA_MODEL") ?? "gemma3n:e4b";

	const body: RequestBody = {
		model,
		messages,
		stream: options.stream ?? false,
		...(options.format && { format: options.format }),
	};

	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(
			`Ollama API error: ${response.status} ${response.statusText}`,
		);
	}

	const data = await response.json();
	return data.message.content;
}

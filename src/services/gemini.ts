export type Message = {
	role: "user" | "assistant" | "system";
	content: string;
};

export type CommandResponse = {
	reasoning: string;
	command: string;
};

type GeminiContent = {
	parts: Array<{ text: string }>;
	role?: string;
};

type GeminiRequest = {
	contents: GeminiContent[];
	generationConfig: {
		temperature?: number;
		maxOutputTokens?: number;
		responseMimeType?: string;
		responseSchema?: object;
	};
};

function convertMessagesToGemini(messages: Message[]): GeminiContent[] {
	return messages.map((msg) => ({
		parts: [{ text: msg.content }],
		role:
			msg.role === "assistant"
				? "model"
				: msg.role === "system"
					? "user"
					: msg.role,
	}));
}

export async function chatCompletion(
	messages: Message[],
	options: {
		format?: "json" | object;
		stream?: boolean;
		model?: string;
	} = {},
): Promise<string> {
	const apiKey = Deno.env.get("NOVA_GEMINI_API_KEY");
	if (!apiKey) {
		throw new Error(
			"NOVA_GEMINI_API_KEY environment variable is required when using Gemini",
		);
	}

	const model =
		options.model ?? Deno.env.get("NOVA_MODEL") ?? "gemini-2.0-flash";
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

	const body: GeminiRequest = {
		contents: convertMessagesToGemini(messages),
		generationConfig: {
			temperature: 0.7,
			maxOutputTokens: 2048,
		},
	};

	if (options.format) {
		body.generationConfig.responseMimeType = "application/json";
		if (typeof options.format === "object") {
			body.generationConfig.responseSchema = options.format;
		}
	}

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-goog-api-key": apiKey,
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`,
		);
	}

	const data = await response.json();
	if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
		throw new Error("Invalid response from Gemini API");
	}

	return data.candidates[0].content.parts[0].text;
}

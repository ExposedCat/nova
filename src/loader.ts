const colors = {
	blue: "\x1b[34m",
	reset: "\x1b[0m",
	dim: "\x1b[2m",
};

export class Loader {
	private interval: number | null = null;
	private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
	private currentFrame = 0;
	private message: string;

	constructor(message = "Loading") {
		this.message = message;
	}

	start() {
		if (this.interval !== null) return;

		Deno.stdout.write(new TextEncoder().encode("\x1b[?25l"));

		this.interval = setInterval(() => {
			const frame = this.frames[this.currentFrame];
			const line = `${colors.blue}${frame}${colors.reset} ${colors.dim}${this.message}...${colors.reset}`;

			Deno.stdout.write(new TextEncoder().encode(`\r${line}`));

			this.currentFrame = (this.currentFrame + 1) % this.frames.length;
		}, 80);
	}

	stop() {
		if (this.interval === null) return;

		clearInterval(this.interval);
		this.interval = null;

		Deno.stdout.write(new TextEncoder().encode("\r\x1b[K\x1b[?25h"));
	}

	updateMessage(message: string) {
		this.message = message;
	}
}

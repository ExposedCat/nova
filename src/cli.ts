export async function execute(
	command: string,
	captureOutput = false,
): Promise<{ code: number; output?: string }> {
	const shell = Deno.env.get("SHELL") || "/bin/bash";

	const shellArgs = [];

	if (captureOutput) {
		shellArgs.push("-c", command);
	} else {
		if (shell.includes("bash")) {
			shellArgs.push("--login", "-i", "-c", command);
		} else if (shell.includes("zsh")) {
			shellArgs.push("-l", "-i", "-c", command);
		} else if (shell.includes("fish")) {
			shellArgs.push("--login", "--interactive", "-c", command);
		} else {
			shellArgs.push("-l", "-i", "-c", command);
		}
	}

	const env = Deno.env.toObject();

	env.TERM = "dumb";
	env.PS1 = "";
	env.PS2 = "";

	const cmd = new Deno.Command(shell, {
		args: shellArgs,
		stdin: captureOutput ? "null" : "inherit",
		stdout: captureOutput ? "piped" : "inherit",
		stderr: captureOutput ? "piped" : "inherit",
		env: env,
	});

	const process = cmd.spawn();

	if (captureOutput) {
		const [status, output] = await Promise.all([
			process.status,
			process.output(),
		]);

		const combinedOutput =
			new TextDecoder().decode(output.stdout) +
			new TextDecoder().decode(output.stderr);
		return { code: status.code, output: combinedOutput.trim() };
	} else {
		const status = await process.status;
		return { code: status.code };
	}
}

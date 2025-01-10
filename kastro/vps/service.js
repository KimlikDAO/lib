import { spawn } from "bun";

const setup = async (secrets) => {
  const {
    host = "localhost",
    username = "root",
    sshKey,
    remotePath = "/var/www/crate",
  } = secrets.VpsConfig;

  // Create systemd service file content
  const serviceConfig = `[Unit]
Description=Kastro service
After=network.target

[Service]
Type=simple
User=${username}
WorkingDirectory=${remotePath}
ExecStart=/snap/bin/bun run ./crateServer.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target`;

  try {
    // Write service file remotely
    const sshCommand = `echo '${serviceConfig}' | sudo tee /etc/systemd/system/kastro.service`;
    const setupCommands = [
      sshCommand,
      "sudo chmod 644 /etc/systemd/system/kastro.service",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable kastro",
      "sudo systemctl restart kastro"
    ].join(" && ");

    const ssh = spawn([
      "ssh",
      "-6",
      "-i", sshKey,
      "-l", username,
      host,
      setupCommands
    ]);

    const output = await new Response(ssh.stdout).text();
    console.log("Service setup successful:", output);

    // Check service status
    const status = spawn([
      "ssh",
      "-6",
      "-i", sshKey,
      "-l", username,
      host,
      "sudo systemctl status kastro"
    ]);

    const statusOutput = await new Response(status.stdout).text();
    console.log("Service status:", statusOutput);
  } catch (error) {
    console.error("Service setup failed:", error);
    throw error;
  }
};

const restart = async (secrets) => {
  const {
    host = "localhost",
    username = "root",
    sshKey,
  } = secrets.VpsConfig;

  const ssh = spawn([
    "ssh",
    "-6",
    "-i", sshKey,
    "-l", username,
    host,
    "sudo systemctl restart kastro"
  ]);

  const output = await new Response(ssh.stdout).text();
  console.log("Service restart successful:", output);
}

export { setup, restart };

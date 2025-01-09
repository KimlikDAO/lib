import { spawn } from "bun";

const deploy = async (crateName, secrets, namedAssets) => {
  const {
    host = 'localhost',
    username = 'root',
    remotePath = '/var/www/crate',
  } = secrets.VpsConfig;

  const target = `${username}@${host}:${remotePath}`;

  try {
    // Deploy files
    const rsync = spawn([
      "rsync",
      "-azP",
      "--delete",
      "-e", `ssh -p 22`,
      "build/crate/",
      target
    ]);

    const deployOutput = await new Response(rsync.stdout).text();
    console.log('Deploy successful:', deployOutput);

    return { success: true };
  } catch (error) {
    console.error('Deploy failed:', error);
    throw error;
  }
}

export { deploy };

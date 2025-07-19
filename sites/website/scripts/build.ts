import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

let __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);
let root = path.join(__dirname, "..", "..", "..");
let registry = process.env.DOCKER_REGISTRY;

const now = new Date();

const tag = [
  now.getFullYear(),
  (now.getMonth() + 1).toString().padStart(2, "0"),
  now.getDate().toString().padStart(2, "0"),
  "-",
  now.getHours().toString().padStart(2, "0"),
  now.getMinutes().toString().padStart(2, "0"),
].join("");

if (!registry) {
  console.error("DOCKER_REGISTRY environment variable is not set.");
  process.exit(1);
}

try {
  execSync(
    `docker build --platform linux/amd64 --progress plain --target website -t website:${tag} -f ${path.join(root, "Dockerfile")} ${root}`,
    { stdio: "inherit" },
  );

  execSync(`docker tag website:${tag} ${registry}/website:${tag}`, {
    stdio: "inherit",
  });

  execSync(`docker push ${registry}/website:${tag}`, { stdio: "inherit" });
} catch (error) {
  console.error("Failed to build or push the Docker image:", error);
  process.exit(1);
}

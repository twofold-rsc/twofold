import { Metafile } from "esbuild";
import path from "path";

export function getCompiledEntrypoint(
  entryPointPath: string,
  metafile: Metafile,
) {
  let base = process.cwd();

  let outputs = metafile.outputs;
  let outputFiles = Object.keys(outputs);

  let file = outputFiles.find((outputFile) => {
    let entryPoint = outputs[outputFile]?.entryPoint;
    if (entryPoint) {
      let fullEntryPointPath = path.join(base, entryPoint);
      return fullEntryPointPath === entryPointPath;
    }
  });

  if (!file) {
    throw new Error(`Failed to get compiled entry point: ${entryPointPath}`);
  }

  return path.join(base, file);
}

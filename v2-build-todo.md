1. Static output does not match Hattip’s parameter type
   StaticFilesOutput.fileMap is a ReadonlyMap, correctly. However, createStaticMiddleware requires a mutable Map<string, ReadOnlyFile>.

Passing the v2 output directly will fail to compile when integration happens. The integration layer can resolve that with:
new Map(output.fileMap). This is minor, but real.

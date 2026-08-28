export type BuilderOutput = {
  serialize(): unknown;
  warm(): void | Promise<void>;
};

export type SerializedOutput<Output extends BuilderOutput> = ReturnType<
  Output["serialize"]
>;

export abstract class Builder<Input, Output extends BuilderOutput> {
  abstract build(input: Input): Promise<Output>;
  abstract load(data: SerializedOutput<Output>): Output;
}

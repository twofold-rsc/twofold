import { Playground, Provider, OpeningExample, Presets } from "./playground";

export const components = {
  PlaygroundProvider: Provider,
  OpeningExample: OpeningExample,
  Presets: Presets,
  Playground: Playground,
};

export const tags = {
  "playground-provider": {
    render: "PlaygroundProvider",
    attributes: {},
  },
  "opening-example": {
    render: "OpeningExample",
    attributes: {},
  },
  presets: {
    render: "Presets",
    attributes: {},
  },
  playground: {
    render: "Playground",
    attributes: {},
  },
};

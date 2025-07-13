import {
  Playground,
  Provider,
  OpeningExample,
  Presets,
  BasicExample,
  PlaygroundConfig,
} from "./playground";

export const components = {
  PlaygroundProvider: Provider,
  OpeningExample: OpeningExample,
  BasicExample: BasicExample,
  Presets: Presets,
  Playground: Playground,
  PlaygroundConfig: PlaygroundConfig,
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
  "basic-example": {
    render: "BasicExample",
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
  "playground-config": {
    render: "PlaygroundConfig",
    attributes: {},
  },
};

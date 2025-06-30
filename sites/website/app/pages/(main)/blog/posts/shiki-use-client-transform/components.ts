import {
  Playground,
  Provider,
  OpeningExample,
  Presets,
  BasicExample,
} from "./playground";

export const components = {
  PlaygroundProvider: Provider,
  OpeningExample: OpeningExample,
  BasicExample: BasicExample,
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
};

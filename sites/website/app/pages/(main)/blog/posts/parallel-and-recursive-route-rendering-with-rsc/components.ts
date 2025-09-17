import { Demo1, Demo3, Demo4 } from "./demo1";
import { StackToNested } from "./stack-to-nested";

export const components = {
  Demo1,
  Demo3,
  Demo4,
  StackToNested,
};

export const tags = {
  demo1: {
    render: "Demo1",
    attributes: {},
  },
  demo3: {
    render: "Demo3",
    attributes: {},
  },
  demo4: {
    render: "Demo4",
    attributes: {},
  },
  "stack-to-nested": {
    render: "StackToNested",
    attributes: {},
  },
};

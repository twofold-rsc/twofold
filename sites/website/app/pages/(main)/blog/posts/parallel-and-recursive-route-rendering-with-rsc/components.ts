import { Demo1, Demo3, Demo4 } from "./demo1";
import { StackToNested } from "./stack-to-nested";
import { CardStack, WaterfallTimeline } from "./cards";

export const components = {
  WaterfallTimeline,
  CardStack,
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
  "waterfall-timeline": {
    render: "WaterfallTimeline",
    attributes: {},
  },
  "card-stack": {
    render: "CardStack",
    attributes: {},
  },
  "stack-to-nested": {
    render: "StackToNested",
    attributes: {},
  },
};

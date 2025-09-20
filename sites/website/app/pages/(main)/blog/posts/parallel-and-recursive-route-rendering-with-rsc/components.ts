import { DemoApp, WaterfallApp, StackedApp } from "./apps";
import { StackToNested } from "./stack-to-nested";
import { CardStack, WaterfallTimeline } from "./cards";

export const components = {
  WaterfallTimeline,
  CardStack,
  DemoApp,
  WaterfallApp,
  StackedApp,
  StackToNested,
};

export const tags = {
  "demo-app": {
    render: "DemoApp",
    attributes: {},
  },
  "waterfall-app": {
    render: "WaterfallApp",
    attributes: {},
  },
  "stacked-app": {
    render: "StackedApp",
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

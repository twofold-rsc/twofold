import { RenderingEnvironments } from "./rendering-environments";
import { RenderRSCError } from "./render-rsc-error";
import { RenderRSCSuspenseError } from "./render-rsc-suspense-error";

export const components = {
  RenderingEnvironments,
  RenderRSCError,
  RenderRSCSuspenseError,
};

export const tags = {
  "rendering-environments": {
    render: "RenderingEnvironments",
    attributes: {},
  },
  "render-rsc-error": {
    render: "RenderRSCError",
    attributes: {},
  },
  "render-rsc-suspense-error": {
    render: "RenderRSCSuspenseError",
    attributes: {},
  },
};

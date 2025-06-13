"use client";

import { AnthropicIcon, OpenAIIcon } from "./icons";

export const models = [
  {
    id: "gpt-mini",
    icon: OpenAIIcon,
    name: "GPT Mini",
    description: "Good for quick responses and easy to answer questions.",
    paid: false,
  },
  {
    id: "gpt-normal",
    icon: OpenAIIcon,
    name: "GPT Full",
    description: "Great for most tasks and general use.",
    paid: false,
  },
  {
    id: "advanced-reasoning",
    icon: AnthropicIcon,
    name: "Advanced Reasoning",
    description: "Best for complex tasks and detailed analysis.",
    paid: true,
  },
];

export type Model = (typeof models)[number];

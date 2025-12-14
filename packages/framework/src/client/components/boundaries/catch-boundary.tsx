"use client";

import { Component, ReactNode } from "react";

type Props = {
  children?: ReactNode;
  taggedErrorComponents: Record<string, Component>;
};

export default class CatchBoundary extends Component<
  Props,
  {
    error: (Error & { digest: string }) | null;
  }
> {
  constructor(props: Props) {
    super(props);
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error: unknown) {
    if (error instanceof Error) {
      return {
        error,
      };
    }

    throw error;
  }

  reset() {
    this.setState({
      error: null,
    });
  }

  render() {
    if (this.state.error) {
      // TODO: get tag from error
      return <div>an error</div>;
    } else {
      return this.props.children;
    }
  }
}

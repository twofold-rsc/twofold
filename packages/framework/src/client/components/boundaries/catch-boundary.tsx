"use client";

import {
  Component,
  FunctionComponent,
  ReactNode,
  startTransition,
} from "react";
import { Context as RawRoutingContext } from "../../apps/client/contexts/routing-context";

type Props = {
  children?: ReactNode;
  taggedErrorComponents: {
    tag: string;
    component: FunctionComponent<{
      error: unknown;
      reset: () => void;
    }>;
  }[];
};

type State = {
  error: (Error & { digest: string }) | null;
};

export default class CatchBoundary extends Component<Props, State> {
  static contextType = RawRoutingContext;
  declare context: React.ContextType<typeof RawRoutingContext>;

  #errorVersion: number | null = null;

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
    this.#errorVersion = null;
    this.setState({
      error: null,
    });
  }

  componentDidCatch() {
    this.#errorVersion = this.context.version;
  }

  componentDidUpdate() {
    if (
      this.state.error &&
      this.#errorVersion &&
      this.context.version !== this.#errorVersion
    ) {
      this.#errorVersion = null;
      this.setState({
        error: null,
      });
    }
  }

  render() {
    if (this.state.error) {
      const taggedComponent = this.props.taggedErrorComponents.find(
        (tagged) => tagged.tag === "unexpected",
      );

      if (!taggedComponent) {
        throw this.state.error;
      }

      return (
        <taggedComponent.component
          error={this.state.error}
          reset={this.reset.bind(this)}
        />
      );
    } else {
      return this.props.children;
    }
  }
}

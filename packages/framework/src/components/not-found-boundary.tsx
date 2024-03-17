"use client";

import {
  Component,
  ReactNode,
  startTransition,
  useContext,
  useEffect,
} from "react";
import { Context } from "../apps/client/contexts/routing-context";

type Props = {
  children?: ReactNode;
};

export class NotFoundBoundary extends Component<
  Props,
  {
    hasError: boolean;
    error: unknown;
  }
> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: unknown) {
    if (error instanceof Error && error.message === "TwofoldNotFoundError") {
      return {
        error,
        hasError: true,
      };
    }

    throw error;
  }

  reset() {
    this.setState({
      error: null,
      hasError: false,
    });
  }

  render() {
    if (this.state.hasError) {
      return <TriggerNotFound reset={() => this.reset()} />;
    } else {
      return this.props.children;
    }
  }
}

function TriggerNotFound({ reset }: { reset: () => void }) {
  let { notFound } = useContext(Context);

  // use load 404 suspending hook

  useEffect(() => {
    startTransition(() => {
      notFound();
      reset();
    });
  }, [notFound, reset]);

  return null;
}

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
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest === "TwofoldNotFoundError"
    ) {
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
      return <TriggerNotFound reset={() => this.reset()} />;
    } else {
      return this.props.children;
    }
  }
}

function TriggerNotFound({ reset }: { reset: () => void }) {
  let { notFound } = useContext(Context);

  useEffect(() => {
    startTransition(() => {
      notFound();
      reset();
    });
  }, [notFound, reset]);

  return null;
}

"use client";

import { Component, ReactNode, startTransition, useEffect } from "react";
import { useRouter } from "../hooks/use-router";

type Props = {
  children?: ReactNode;
};

export class RedirectBoundary extends Component<
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
    if (error instanceof Error) {
      let [name, status, url] = error.message.split(":");

      if (name === "TwofoldRedirectError") {
        return {
          error,
          hasError: true,
        };
      }
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
    if (this.state.hasError && this.state.error instanceof Error) {
      let url = getUrlFromError(this.state.error);
      return <TriggerRedirect url={url} reset={() => this.reset()} />;
    } else {
      return this.props.children;
    }
  }
}

function getUrlFromError(error: Error) {
  let [_name, _status, url] = error.message.split(":");
  return decodeURIComponent(url);
}

function TriggerRedirect({ url, reset }: { url: string; reset: () => void }) {
  let { navigate } = useRouter();

  useEffect(() => {
    startTransition(() => {
      if (url.startsWith("/")) {
        navigate(url);
      } else {
        window.location.replace(url);
      }
      reset();
    });
  }, [navigate, url, reset]);

  return null;
}

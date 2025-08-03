import { Component, ReactNode, startTransition, use, useEffect } from "react";
import { Context } from "../../apps/client/contexts/routing-context";

type Props = {
  children?: ReactNode;
};

export class RedirectBoundary extends Component<
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
      typeof error.digest === "string"
    ) {
      let [name, status, url] = error.digest.split(":");

      if (name === "TwofoldRedirectError") {
        return {
          error,
        };
      }
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
      let url = getUrlFromError(this.state.error);
      return <TriggerRedirect url={url} reset={() => this.reset()} />;
    } else {
      return this.props.children;
    }
  }
}

function getUrlFromError(error: Error & { digest: string }) {
  let [_name, _status, url] = error.digest.split(":");
  return decodeURIComponent(url);
}

function TriggerRedirect({ url, reset }: { url: string; reset: () => void }) {
  let { replace } = use(Context);

  useEffect(() => {
    startTransition(() => {
      if (url.startsWith("/")) {
        replace(url);
        reset();
      } else {
        window.location.replace(url);
      }
    });
  }, [replace, url, reset]);

  return null;
}

"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
}

export class CarouselErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[CarouselErrorBoundary] ${this.props.title || "Carousel"}:`, error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 rounded-2xl border border-border/30 bg-card/40">
          <p className="text-sm text-muted-foreground">
            {this.props.title || "This section"} is temporarily unavailable.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

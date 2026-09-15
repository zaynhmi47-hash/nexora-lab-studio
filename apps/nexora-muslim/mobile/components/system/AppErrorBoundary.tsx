import React, { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { ScreenState } from '@/components/ui/ScreenState';

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<
  PropsWithChildren,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Central error reporting can be added here without coupling the UI to a provider.
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ScreenState
          icon="alert-circle-outline"
          title="Something went wrong"
          message="Nexora Muslim could not render this screen. Please try again."
          actionLabel="Try again"
          onAction={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

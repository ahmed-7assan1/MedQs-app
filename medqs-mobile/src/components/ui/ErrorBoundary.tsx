import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { logErrorToFile } from '../../lib/debug_logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    logErrorToFile(error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#07080F', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
            Something went wrong.
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center' }}>
            We've logged the error and are working on a fix.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

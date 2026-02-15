import React from 'react';

class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[SectionErrorBoundary] Error en sección:', error, info);
  }

  render() {
    const { hasError } = this.state;
    const { fallback = null, children } = this.props;
    if (hasError) {
      return fallback;
    }
    return children;
  }
}

export default SectionErrorBoundary;

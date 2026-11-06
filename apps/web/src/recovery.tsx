import { Component, type ReactNode } from 'react';
export class RecoveryBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="not-found" role="alert">
        <h1>The garden needs a fresh start.</h1>
        <p>Your saved moments stay in this browser.</p>
        <button onClick={() => location.reload()}>Reload the garden</button>
      </main>
    ) : (
      this.props.children
    );
  }
}

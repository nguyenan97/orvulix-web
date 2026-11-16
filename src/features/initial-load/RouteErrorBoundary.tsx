import { Component, type ReactNode } from 'react';
import { Alert, Box, Button } from '@mui/material';
import { reloadRoute } from './recover';

/** A failed lazy import must leave a usable shell and an explicit recovery path. */
export default class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; recovering: boolean }
> {
  state = { failed: false, recovering: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <Box component="main" sx={{ p: 3, minHeight: '60vh' }}>
          <Alert severity="error">
            Unable to load this page. Check your connection and reload to try
            again.
          </Alert>
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            disabled={this.state.recovering}
            onClick={() => {
              this.setState({ recovering: true });
              void reloadRoute();
            }}
          >
            Reload page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

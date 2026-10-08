import { createTheme, ThemeOptions } from '@mui/material';

const sharedThemeOptions: ThemeOptions = {
  shape: { borderRadius: 14 },
  typography: {
    button: {
      textTransform: 'none'
    }
  },
  zIndex: { snackbar: 100000 }
};
export const lightTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    primary: { main: '#0F766E' },
    background: {
      default: '#F8FAFC',
      hover: '#FAFAFD',
      lightSecondary: '#EBF5FF',
      darkSecondary: '#5581b5'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: { color: '#ffffff', backgroundColor: '#0F766E' }
      }
    }
  }
});

export const darkTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'dark',
    primary: { main: '#2DD4BF' },
    background: {
      default: '#1C1F20',
      paper: '#181a1b',
      hover: '#1a1c1d',
      lightSecondary: '#1E2021',
      darkSecondary: '#3C5F8A'
    },
    text: { primary: '#ffffff' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: { color: '#ffffff', backgroundColor: '#0F766E' }
      }
    }
  }
});

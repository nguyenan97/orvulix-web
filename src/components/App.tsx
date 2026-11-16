import { BrowserRouter, useLocation, useRoutes } from 'react-router-dom';
import routesConfig from '../config/routesConfig';
import Navbar from './Navbar';
import Footer from './Footer';
import { Suspense, useState, useEffect } from 'react';
import Loading from './Loading';
import { CssBaseline, Theme, ThemeProvider } from '@mui/material';
import { CustomSnackBarProvider } from '../contexts/CustomSnackBarContext';
import { SnackbarProvider } from 'notistack';
import { tools } from '../tools';
import './index.css';
import { darkTheme, lightTheme } from '../config/muiConfig';
import ScrollToTopButton from './ScrollToTopButton';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { UserTypeFilterProvider } from 'providers/UserTypeFilterProvider';
import RouteSeo from '../seo/RouteSeo'; // ORVULIX-SEO
import RouteErrorBoundary from '../features/initial-load/RouteErrorBoundary';

export type Mode = 'dark' | 'light' | 'system';

// Build elements, not function calls: only the matched route may run its hooks.
const appRoutes = [
  ...routesConfig,
  ...tools.map((tool) => {
    const Component = tool.component;
    return { path: tool.path, element: <Component /> };
  })
];
const AppRoutes = () => {
  const { pathname } = useLocation();
  const route = useRoutes(appRoutes);
  return (
    <RouteErrorBoundary key={pathname}>
      <Suspense fallback={<Loading />}>{route}</Suspense>
    </RouteErrorBoundary>
  );
};

function App() {
  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem('theme') || 'system') as Mode
  );
  const [theme, setTheme] = useState<Theme>(() => getTheme(mode));
  useEffect(() => setTheme(getTheme(mode)), [mode]);

  // Make sure to update the theme when the mode changes
  useEffect(() => {
    if (mode !== 'system') return;
    const systemDarkModeQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? darkTheme : lightTheme);
    };
    systemDarkModeQuery.addEventListener('change', handleThemeChange);

    return () => {
      systemDarkModeQuery.removeEventListener('change', handleThemeChange);
    };
  }, [mode]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={5}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
        >
          <CustomSnackBarProvider>
            <UserTypeFilterProvider>
              <BrowserRouter basename={import.meta.env.BASE_URL}>
                {' '}
                {/* ORVULIX-PAGES */}
                {/* ORVULIX-SEO */}
                <RouteSeo />
                <Navbar
                  mode={mode}
                  onChangeMode={() => {
                    const next = nextMode(mode);
                    setMode(next);
                    localStorage.setItem('theme', next);
                  }}
                />
                <AppRoutes />
                <Footer />
              </BrowserRouter>
            </UserTypeFilterProvider>
          </CustomSnackBarProvider>
        </SnackbarProvider>
        <ScrollToTopButton />
      </ThemeProvider>
    </I18nextProvider>
  );
}

function getTheme(mode: Mode): Theme {
  switch (mode) {
    case 'dark':
      return darkTheme;
    case 'light':
      return lightTheme;
    default:
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? darkTheme
        : lightTheme;
  }
}

function nextMode(mode: Mode): Mode {
  return mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
}

export default App;

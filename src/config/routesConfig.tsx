import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const Home = lazy(() => import('../pages/home'));
const ToolsByCategory = lazy(() => import('../pages/tools-by-category'));
const InformationPage = lazy(() => import('../pages/information'));

const routes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/categories/:categoryName', element: <ToolsByCategory /> },
  { path: '/about', element: <InformationPage page="about" /> },
  { path: '/contact', element: <InformationPage page="contact" /> },
  { path: '/privacy', element: <InformationPage page="privacy" /> },
  { path: '/terms', element: <InformationPage page="terms" /> },
  { path: '*', element: <InformationPage page="not-found" /> }
];

export default routes;

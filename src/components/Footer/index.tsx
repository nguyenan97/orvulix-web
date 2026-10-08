import { Box, Container, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const links = [
  { label: 'About', path: '/about' },
  { label: 'Roadmap', path: '/roadmap' },
  { label: 'Contact', path: '/contact' },
  { label: 'Privacy', path: '/privacy' },
  { label: 'Terms', path: '/terms' }
];

export default function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 3, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} Orvulix. Free online utilities.</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {links.map(({ label, path }) => <MuiLink key={path} component={Link} to={path} underline="hover" color="text.secondary">{label}</MuiLink>)}
            <MuiLink href="https://www.netlify.com/" target="_blank" rel="noopener noreferrer" underline="hover" color="text.secondary">This site is powered by Netlify</MuiLink>
            <MuiLink href="https://github.com/nguyenan97/orvulix-web/blob/main/CODE_OF_CONDUCT.md" target="_blank" rel="noopener noreferrer" underline="hover" color="text.secondary">Code of Conduct</MuiLink>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

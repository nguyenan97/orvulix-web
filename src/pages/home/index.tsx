import { Box, Container, Link as MuiLink, Typography, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import Hero from 'components/Hero';
import Categories from './Categories';
import { brand } from '../../brand/config';
import { Helmet } from 'react-helmet';
import { useUserTypeFilter } from 'providers/UserTypeFilterProvider';
import UserTypeFilter from '@components/UserTypeFilter';

export default function Home() {
  const theme = useTheme();
  const { selectedUserTypes, setSelectedUserTypes } = useUserTypeFilter();
  return (
    <Box
      padding={{
        xs: 1,
        md: 3,
        lg: 5
      }}
      sx={{
        background: theme.palette.mode === 'dark' ? 'radial-gradient(ellipse at 50% 0%, #153E3D 0%, #101A23 55%)' : 'radial-gradient(ellipse at 50% 0%, #D7F7ED 0%, #F8FAFC 60%)',
        backgroundColor: 'background.default'
      }}
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      justifyContent={'center'}
      width={'100%'}
    >
      <Helmet title={`${brand.name} - Free Online Tools for JSON, PDF, Images & More`}>
        <link rel="canonical" href="https://orvulix.io.vn/" />
        <meta property="og:url" content="https://orvulix.io.vn/" />
        <meta name="description" content="Free online tools for JSON formatting, PDF tasks, images, text, data conversion and developer workflows. Explore Orvulix in your browser." />
      </Helmet>
      <Hero />
      <Box my={3}>
        <UserTypeFilter
          selectedUserTypes={selectedUserTypes}
          onUserTypesChange={setSelectedUserTypes}
        />
      </Box>
      <Categories />
      <Container maxWidth="md" sx={{ mt: 6, mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" component="h2" gutterBottom>Free browser-based tools for everyday tasks</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          Orvulix brings JSON utilities, document tools, image tools, text processing, and data conversion into one place. Browse the tool categories above to choose the right utility for your task. Features and file handling vary by tool; review each tool before using sensitive information.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Curious about upcoming developer features?{' '}
          <MuiLink component={Link} to="/roadmap">Explore the Orvulix AI product roadmap</MuiLink>.
        </Typography>
      </Container>
    </Box>
  );
}

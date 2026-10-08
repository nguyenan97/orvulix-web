import { Box, useTheme } from '@mui/material';
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
        <link rel="canonical" href="https://orvulix-web.netlify.app/" />
        <meta property="og:url" content="https://orvulix-web.netlify.app/" />
      </Helmet>
      <Hero />
      <Box my={3}>
        <UserTypeFilter
          selectedUserTypes={selectedUserTypes}
          onUserTypesChange={setSelectedUserTypes}
        />
      </Box>
      <Categories />
    </Box>
  );
}

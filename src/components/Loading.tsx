import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import './Loading.css';

function Loading() {
  return (
    <Box
      role="status"
      sx={{
        width: '100%',
        // Keep the footer out of the first viewport until route content arrives.
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Typography color="primary">Loading</Typography>
      <Box
        id="spinner"
        sx={{
          '& > div': {
            backgroundColor: 'palette.secondary.main'
          }
        }}
      >
        <div className="bounce1" />
        <div className="bounce2" />
        <div />
      </Box>
    </Box>
  );
}

export default Loading;

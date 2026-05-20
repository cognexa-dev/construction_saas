import { Box, CircularProgress, Typography } from '@mui/material';

interface Props {
  message?: string;
  fullscreen?: boolean;
}

export default function LoadingSpinner({ message, fullscreen = false }: Props) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      sx={fullscreen ? { minHeight: '100vh' } : { py: 8 }}
    >
      <CircularProgress size={40} />
      {message && <Typography color="text.secondary">{message}</Typography>}
    </Box>
  );
}

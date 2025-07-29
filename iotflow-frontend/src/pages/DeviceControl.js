import { Box, Container } from '@mui/material';
import DeviceControlDashboard from '../components/DeviceControlDashboard';

const DeviceControl = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <DeviceControlDashboard />
      </Box>
    </Container>
  );
};

export default DeviceControl;

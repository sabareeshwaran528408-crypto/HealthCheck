import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT) || 5001;

const server = app.listen(port, () => {
  console.log(`HealthCheck API is running at http://localhost:${port}`);
});

server.on('error', (error) => {
  console.error('Failed to start the HealthCheck API:', error.message);
  process.exitCode = 1;
});

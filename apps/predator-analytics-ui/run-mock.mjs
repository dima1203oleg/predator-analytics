import express from 'express';
import mockHandler from './mock-api-server.mjs';

const app = express();
app.use(mockHandler);

app.listen(9080, () => {
  console.log('Mock API server listening on http://localhost:9080');
});

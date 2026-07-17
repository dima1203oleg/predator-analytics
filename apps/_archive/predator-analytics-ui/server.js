const express = require('express');
const path = require('path');
const app = express();
const port = 3030;

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log('Production server running on port ' + port);
});

const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Hello');
});
server.listen(3030, () => {
  console.log('Listening on 3030');
});

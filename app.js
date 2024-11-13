const http = require('http');


const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Welcome to Manino University!</h1>');
  res.end();
});

server.listen(8080, () => {
  console.log('Server running at http://localhost:8080/');
});
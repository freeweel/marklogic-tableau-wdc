const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');  //in case wanted
const request = require('request');
const path = require('path');

// Create Express Server
const app = express();

const userid = "admin";
const userpw = "admin";

//config for this middleware
const PORT = 3000;
const HOST = "localhost";
// Configuration for ML rest endpoints
const targetProtocol = "https";
const targetHost = "localhost";
const targetPort = "8200";

// test GET endpoint
app.get('/info', (req, res, next) => {
  res.send('This is a proxy service which proxies to JSONPlaceholder API.');
});

// Call MarkLogic API
// NOTE: For now this passes everything past the /db prefix to MarkLogic
// Example:  /db/V1/Search
app.get('/db/*', (req, res) => {
  try {
    const restApi = req.url.replace('/db','');
    const mlUrl = targetProtocol + "://" + targetHost + ":" + targetPort + restApi + '&format=json';
    request({
      method: "GET",
      uri: mlUrl,
      rejectUnauthorized: false,
      auth: {
        user: userid,
        pass: userpw
      }
    })
      .on('error', (error) => {
        res.status(503).send(error.message)
      })
      .pipe(res);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Relative paths for web documents
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/connectors/index.html'));
});

app.get('/connectors/*', (req, res) => {
  console.log(req.url);
  res.sendFile(path.join(__dirname, req.url));
});


// Start Proxy
app.listen(PORT, HOST, () => {
  console.log(`Starting Proxy at ${HOST}:${PORT}`);
});

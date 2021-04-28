const express = require('express');
const path = require('path');
const cors = require('cors');

function createApp() {
  const app = express();

  app.use(cors());

  express.static.mime.define({ 'application/json': ['contract'] });

  app.use(express.static(path.resolve(__dirname, './dist')));

  return app;
}

module.exports = createApp;

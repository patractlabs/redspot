const { task, extendEnvironment } = require('redspot/config');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { decodeAddress } = require('@polkadot/util-crypto');
const { u8aEq } = require('@polkadot/util');
const { io } = require('socket.io-client');
const express = require('express');

function createRouter(app, { config, artifacts }) {
  app.use('/artifacts', express.static(config.paths.artifacts));

  app.get('/artifacts/all', async (req, res, next) => {
    const paths = await artifacts.getArtifactPaths();
    res.json(paths.map((x) => path.relative(config.paths.artifacts, x)));
    next();
  });

  app.get('/redspot-config', async (req, res, next) => {
    res.json(config);
    next();
  });
}

function createSocketIO(server) {
  return new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });
}

task('explorer', 'Start redspot explorer').setAction(async (_, env) => {
  const createApp = require('@redspot/explorer/app');

  const app = createApp();

  createRouter(app, env);

  const server = http.createServer(app);

  const io = createSocketIO(server);

  io.on('connection', (socket) => {
    console.log(`Client ${socket.id} connected`);

    socket.on('explorer', () => {
      console.log(`Client ${socket.id} join explorer`);
      socket.join('explorer');
    });

    socket.on('disconnect', () => {
      console.log(`Client ${socket.id} disconnected`);
    });

    socket.on('signPayload', (payload, cb) => {
      console.log(`Client ${socket.id} signPayload`);

      const firstSocketId = Array.from(
        io.sockets.adapter.rooms.get('explorer') || []
      )[0];

      if (!firstSocketId) {
        cb(new Error('No Client'));
      } else {
        io.sockets.sockets.get(firstSocketId).emit('signPayload', payload, cb);
      }
    });
  });

  const port = process.env.PORT || 8011;

  console.log('Redspot explorer listening to http://127.0.0.1:' + port);

  server.listen(port, '127.0.0.1');

  await new Promise((resolve) => {
    server.on('close', () => {
      resolve();
    });
  });
});

extendEnvironment((env) => {
  const signPayload = env.network.signer.signPayload;

  env.network.signer.signPayload = async (payload) => {
    const client = io('http://127.0.0.1:8011');

    const originSignPayload = () => signPayload(payload);

    const addresses = await env.network.getAddresses();

    const existingAddress = addresses.find((address) =>
      u8aEq(decodeAddress(address), decodeAddress(payload.address))
    );

    if (existingAddress) {
      return originSignPayload();
    }

    return new Promise((resolve) => {
      client.on('connect_error', () => {
        console.log('explorer connection error');
        resolve(originSignPayload());
        client.close();
      });

      client.emit('signPayload', payload, (error, result) => {
        console.log('Signing with explorer...');
        if (error || !result) {
          resolve(originSignPayload());
        } else {
          resolve(result);
        }
        client.close();
      });
    });
  };
});

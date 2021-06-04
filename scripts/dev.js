#!/usr/bin/env node
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const spawn = require('react-dev-utils/crossSpawn');

const reactProcess = spawn.spawn(
  'node',
  [require.resolve('react-scripts/scripts/start')],
  // { stdio: 'inherit' }
);

let electronStarted = false;

reactProcess.stdout.on('data', data => {
  process.stdout.write(data);
  if (`${data}`.indexOf('Compiled') !== -1 && !electronStarted) {
    electronStarted = true;
    const electronProcess = spawn.spawn(
      'electron',
      ['.'],
      { env: {
        ...process.env,
        RUN_ENV: 'dev',
      } }
    );
    electronProcess.stdout.on('data', data => {
      process.stdout.write(Buffer.concat([new Buffer('electron :'), data]));
    });
  }
});

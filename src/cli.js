#!/usr/bin/env node

const minimist = require('minimist');
const args = minimist(process.argv.slice(2), {
  alias: {
    t: 'token',
  },
  string: ['token'],
});

console.log(args);

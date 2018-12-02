#!/usr/bin/env node

const fetch = require('node-fetch');
const minimist = require('minimist');

const args = minimist(process.argv.slice(2), {
  alias: {
    r: 'repo',
    t: 'token',
  },
  string: [
    'token',
    'repo',
  ],
});

async function perform() {
  const prData = await getPullRequests(args);
  console.log(prData);
}

perform();

async function getPullRequests({ token, repo }) {
  return fetch(
    `https://api.github.com/repos/${repo}/pulls`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
    },
  ).then(response => response.json());
}

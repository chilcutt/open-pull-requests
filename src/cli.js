#!/usr/bin/env node

const fetch = require('node-fetch');
const minimist = require('minimist');

const args = minimist(process.argv.slice(2), {
  alias: {
    d: 'display',
    r: 'repo',
    t: 'token',
  },
  string: [
    'display',
    'token',
    'repo',
  ],
});

async function perform() {
  const pullRequests = await getPullRequests(args);
  if (args.display == 'url') {
    logUrls(pullRequests);
  } else {
    logOutput(pullRequests);
  }
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

function logOutput(pullRequests) {
  pullRequests.forEach((pr) => {
    console.log(`${pr.number} ${pr.user.login} ${pr.title}`);
  });
}

function logUrls(pullRequests) {
  pullRequests.forEach((pr) => {
    console.log(pr.html_url);
  });
}

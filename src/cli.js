#!/usr/bin/env node

const fetch = require('node-fetch');
const minimist = require('minimist');

const args = minimist(process.argv.slice(2), {
  alias: {
    a: 'author',
    d: 'display',
    r: 'repo',
    t: 'token',
  },
  string: [
    'author',
    'display',
    'token',
    'repo',
  ],
});

async function perform() {
  const pullRequests = await getPullRequests(args);
  const filteredPullRequests = filterPullRequests({ pullRequests, authors: args.author });
  printOutput({ pullRequests: filteredPullRequests, type: args.display });
}

perform();

async function getPullRequests({ token, repo }) {
  if (Array.isArray(repo)) {
    const dataFromRepos = await Promise.all(repo.map((r) => {
      return getPullRequestsFromRepo({ token, repo: r });
    }));
    return [].concat(...dataFromRepos);
  } else {
    return getPullRequestsFromRepo({ token, repo });
  }
}

function getPullRequestsFromRepo({ token, repo }) {
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

function filterPullRequests({ pullRequests, authors }) {
  if (!authors) {
    return pullRequests;
  } else if (Array.isArray(authors)) {
    return pullRequests.filter(pr => authors.includes(pr.user.login));
  } else {
    return pullRequests.filter(pr => pr.user.login == authors);
  }
}

function printOutput({ pullRequests, type }) {
  if (type == 'url') {
    logUrls(pullRequests);
  } else {
    logOutput(pullRequests);
  }
}

function logOutput(pullRequests) {
  pullRequests.forEach((pr) => {
    console.log(`${pr.head.repo.full_name} ${pr.number} ${pr.user.login} ${pr.title}`);
  });
}

function logUrls(pullRequests) {
  pullRequests.forEach((pr) => {
    console.log(pr.html_url);
  });
}

#!/usr/bin/env node

const fetch = require('node-fetch');
const minimist = require('minimist');

const args = minimist(process.argv.slice(2), {
  alias: {
    a: 'author',
    d: 'display',
    l: 'label',
    r: 'repo',
    t: 'token',
  },
  string: [
    'author',
    'display',
    'label',
    'repo',
    'token',
  ],
});

async function perform() {
  const pullRequests = await getPullRequests(args);
  const filteredPullRequests = filterPullRequests(pullRequests, args);
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

function filterPullRequests(pullRequests, args) {
  return (
    pullRequests
      .filter(filterByAuthor.bind(this, args.author))
      .filter(filterByLabel.bind(this, args.label))
  );
}

function filterByAuthor(authors, pullRequest) {
  if (!authors) {
    return true;
  } else if (Array.isArray(authors)) {
    return authors.includes(pullRequest.user.login);
  } else {
    return pullRequest.user.login == authors;
  }
}

function filterByLabel(labels, pullRequest) {
  if (!labels) {
    return true;
  } else if (Array.isArray(labels)) {
    return pullRequest.labels.some(l => labels.includes(l.name));
  } else {
    return pullRequest.labels.some(l => l.name == labels);
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

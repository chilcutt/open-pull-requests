#!/usr/bin/env node

const fetch = require('node-fetch');
const minimist = require('minimist');

const args = minimist(process.argv.slice(2), {
  alias: {
    a: 'author',
    d: 'display',
    l: 'include_label',
    L: 'exclude_label',
    r: 'repo',
    t: 'token',
  },
  boolean: [
    'exclude_already_approved',
  ],
  string: [
    'author',
    'display',
    'exclude_label',
    'include_label',
    'repo',
    'required_approvals',
    'token',
  ],
});

async function perform() {
  const pullRequests = await getPullRequests(args);
  const filteredPullRequests = await filterPullRequests(pullRequests, args);
  printOutput({ pullRequests: filteredPullRequests, type: args.display });
}

perform();

async function getPullRequests({ token, repo }) {
  const repoArray = [].concat(repo);
  const dataFromRepos = await Promise.all(repoArray.map((r) => {
    return getPullRequestsFromRepo({ token, repo: r });
  }));
  return [].concat(...dataFromRepos);
}

async function getPullRequestsFromRepo({ token, repo }) {
  const repoPullRequests = await fetch(
    `https://api.github.com/repos/${repo}/pulls`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
    },
  ).then(response => response.json());

  const repoPullRequestReviews = await Promise.all(
    repoPullRequests.map(pullRequest => getPullRequestReviews({ token, repo, pullRequest }))
  );

  repoPullRequests.forEach((pullRequest, index) => {
    pullRequest.reviews = repoPullRequestReviews[index];
  });

  return repoPullRequests;
}

function getPullRequestReviews({ token, repo, pullRequest }) {
  return fetch(
    `https://api.github.com/repos/${repo}/pulls/${pullRequest.number}/reviews`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
    },
  ).then(response => response.json());
}

async function filterPullRequests(pullRequests, args) {
  let currentUser;

  if (args.exclude_already_approved) {
    currentUser = await getCurrentUser(args.token);
  }

  return (
    pullRequests
      .filter(filterByAuthor.bind(this, args.author))
      .filter(filterIncludedLabels.bind(this, args.include_label))
      .filter(filterExcludedLabels.bind(this, args.exclude_label))
      .filter(filterEnoughApprovals.bind(this, args.required_approvals))
      .filter(filterAlreadyReviewed.bind(this, args.exclude_already_approved, currentUser))
  );
}

function getCurrentUser(token) {
  return fetch(
    'https://api.github.com/user',
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
    },
  ).then(response => response.json());
}

function filterByAuthor(authors, pullRequest) {
  if (!authors) {
    return true;
  }
  const authorArray = [].concat(authors);
  return authorArray.includes(pullRequest.user.login);
}

function filterIncludedLabels(labels, pullRequest) {
  if (!labels) {
    return true;
  }
  const labelsArray = [].concat(labels);
  return pullRequest.labels.some(l => labelsArray.includes(l.name));
}

function filterExcludedLabels(labels, pullRequest) {
  if (!labels) {
    return true;
  }
  return !filterIncludedLabels(labels, pullRequest);
}

function filterEnoughApprovals(requiredApprovals, pullRequest) {
  if (!requiredApprovals) {
    return true;
  }

  const numApprovals = pullRequest.reviews.reduce((total, review) => {
    if (review.state == 'APPROVED') {
      return total + 1;
    }
    return total;
  }, 0);
  return numApprovals < requiredApprovals;
}

function filterAlreadyReviewed(enabled, currentUser, pullRequest) {
  if (!enabled) {
    return true;
  }

  return !pullRequest.reviews.some((review) => (
    review.user.login == currentUser.login && review.state == 'APPROVED'
  ));
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

# open-pull-requests
Utility to query open Pull Requests from GitHub API with filtering options. This utility was created to provide a CLI interface to GitHub pull requests that could be used for scripting.

## CLI Usage

```
Usage: open_pull_requests [options]

Options:
  -a, --author                    Filter results by author, supports multiple uses
  -f, --format [url,csv]          Output results in different format.
                                    "url" - only output URLs for each result
                                    "csv" - output CSV-compatible output for parsing
      --exclude_already_approved  Exclude results already approved by authenticated user, boolean flag
  -l, --include_label             Only include results that have a given label, supports multiple uses
  -L, --exclude_label             Exclude results that have a given label, supports multiple uses
  -r, --repo                      Include GitHub repository in query, supports multiple uses
                                    format: ":org/:repo"
  -t, --token                     GitHub API token to use for authentication

Notes:
  At least 1 repo (-r) and exactly 1 token (-t) are required.

```

## Example Use Case

Open all team pull requests in a new browser tab, with the rules:
 - Pull Requests I can review exist in repo1 and repo2
 - My teammates are username1, username2, and username3
 - My team uses the label "WIP" for Pull Requests that aren't ready for review
 - My team requires 2 approvals per Pull Request
 - Don't include Pull Requests I've already approved

```bash
# .bashrc
open_team_prs() {
  open_pull_requests \
    -t <token> \
    -r org/repo1 \
    -r org/repo2 \
    -a username1 \
    -a username2 \
    -a username3 \
    -L WIP \
    --required_approvals 2 \
    --exclude_already_approved \
    -f url \
    | xargs -I {} open -a 'Google Chrome' {}
}
```

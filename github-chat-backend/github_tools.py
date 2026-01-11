import requests
import os


def read_github_repo(owner: str, repo: str, path: str | None = None):
    url = (
        f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        if path
        else f"https://api.github.com/repos/{owner}/{repo}"
    )

    res = requests.get(
        url,
        headers={
            "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
            "Accept": "application/vnd.github+json",
        },
    )

    res.raise_for_status()
    return res.json()
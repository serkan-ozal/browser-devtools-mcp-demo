# Issues & Pull Requests Skills

## When to Load This Module
- User mentions: "issue", "PR", "pull request", "review"
- Tasks: managing issues, reviewing PRs

## Issue Management

**Finding Issues:**
- `search_issues` - **PREFERRED** - Use specific queries
- `list_issues` - Last resort only
- `list_notifications` - **BEST** for your assigned issues

**Working with Issues:**
- `create_issue` - New issue
- `update_issue` - Modify existing
- `add_issue_comment` - Add comment
- `assign_copilot_to_issue` - Let AI solve it!

## Pull Request Workflow

**Review Process:**
```
1. get_pull_request() - Get PR details
2. get_pull_request_files() - See what changed
3. get_pull_request_diff() - See actual changes
4. create_pending_pull_request_review() - Start review
5. add_pull_request_review_comment_to_pending_review() - Add comments
6. submit_pending_pull_request_review() - Submit (APPROVE/REQUEST_CHANGES)
```

**OR use Copilot:**
```
request_copilot_review() - Automated review
```

**Creating PRs:**
- `create_pull_request` - New PR
- `update_pull_request` - Modify PR
- `merge_pull_request` - Merge when ready
- `update_pull_request_branch` - Sync with base

## Search Patterns

**Instead of listing all:**
```
❌ list_issues() → 20,000 tokens

✅ search_issues("repo:owner/repo is:open label:bug") → 2,000 tokens
✅ search_issues("repo:owner/repo is:pr review-requested:@me") → 1,500 tokens
```

## Key Tools

**Issues:**
- `search_issues` - Find specific
- `create_issue` - New
- `update_issue` - Modify
- `add_issue_comment` - Comment
- `assign_copilot_to_issue` - AI help

**Pull Requests:**
- `create_pull_request` - New PR
- `get_pull_request_diff` - See changes
- `create_pending_pull_request_review` - Start review
- `submit_pending_pull_request_review` - Submit review
- `request_copilot_review` - AI review
- `merge_pull_request` - Merge

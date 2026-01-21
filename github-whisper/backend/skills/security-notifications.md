# Security & Notifications Skills

## When to Load This Module
- User mentions: "security", "alerts", "notifications", "scan", "secret"
- Tasks: security checks, notification management

## Notifications (Daily Work)

**Primary Tool:** `list_notifications`
- Shows: PRs to review, assigned issues, mentions, updates
- **ALWAYS use this for "what should I work on?" questions**

**Management:**
- `get_notification_details` - Get details
- `dismiss_notification` - Mark as read/done
- `mark_all_notifications_read` - Clear all
- `manage_notification_subscription` - Ignore/watch thread
- `manage_repository_notification_subscription` - Repo settings

## Security Scanning

**Code Scanning:**
- `list_code_scanning_alerts` - Find code issues
- `get_code_scanning_alert` - Alert details

**Secret Scanning:**
- `list_secret_scanning_alerts` - Find exposed secrets
- `get_secret_scanning_alert` - Secret details

## Security Workflow

```
User: "Check security issues"

Steps:
1. list_code_scanning_alerts(owner, repo, {state: "open"})
2. list_secret_scanning_alerts(owner, repo, {state: "open"})
3. For critical alerts: get detailed info
4. Prioritize by severity
5. Present to user with recommendations
```

## Filters

**Code Scanning:**
- State: "open", "closed", "dismissed", "fixed"
- Severity: "critical", "high", "medium", "low"

**Secret Scanning:**
- State: "open", "resolved"
- Resolution: "false_positive", "wont_fix", "revoked"

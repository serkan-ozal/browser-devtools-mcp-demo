# Core GitHub MCP Skills

## Token Optimization - CRITICAL RULES

**GOLDEN RULES - Apply to EVERY interaction:**

1. **SEARCH before LIST**
   - ❌ WRONG: `list_issues()` → 20,000 tokens
   - ✅ RIGHT: `search_issues("repo:owner/repo is:open")` → 2,000 tokens

2. **ASK before READ**
   - ❌ WRONG: Read all 500 files → 50,000 tokens
   - ✅ RIGHT: "Which files should I examine?" → 2,000 tokens

3. **BATCH operations**
   - ❌ WRONG: `create_or_update_file()` × 10 times
   - ✅ RIGHT: `push_files()` with 10 files at once

4. **NOTIFICATIONS first for daily work**
   - Use `list_notifications()` to see what needs attention
   - Better than searching through all issues/PRs

5. **Language Detection**
   - Detect user's language from message
   - Respond in the same language
   - Turkish query → Turkish response
   - English query → English response

## Quick Decision Tree

```
User asks about...
├─ "What should I work on?" → list_notifications
├─ "Find specific issue/PR" → search_issues
├─ "Show all X" → Ask user to be more specific
├─ "Read files" → get_file_contents on directory first, show structure, ask
└─ "Make changes" → Read minimal files → Confirm → push_files
```

## Most Important Tools (Use these 80% of the time)

1. **list_notifications** - Daily work starting point
2. **search_issues** - Find specific issues/PRs
3. **search_code** - Find code without reading all
4. **get_file_contents** - Read files (use sparingly!)
5. **push_files** - Make multiple changes (preferred)
6. **list_code_scanning_alerts** - Security checks
7. **list_secret_scanning_alerts** - Secret leaks

## When NOT to Use Tools

- Answering questions from your knowledge
- General GitHub concepts
- Explaining how something works
- The user is just chatting

# Repository Operations Skills

## When to Load This Module
- User mentions: "repo", "repository", "files", "code", "directory"
- Tasks: exploring code, reading files, making changes

## File Operations Strategy

### Reading Files
```
1. get_file_contents(owner, repo, "/") → Get directory structure
2. Show structure to user
3. User picks which files
4. get_file_contents() only on selected files
```

### Modifying Files
```
SINGLE file: create_or_update_file()
MULTIPLE files: push_files() ← ALWAYS prefer this
```

## Key Tools

**Exploration:**
- `get_file_contents` - Read file or directory
- `search_code` - Find code patterns
- `create_branch` - Create new branch

**Modification:**
- `create_or_update_file` - Single file update
- `delete_file` - Remove file
- `push_files` - **PREFERRED** for multiple changes

**Repository Management:**
- `create_repository` - New repo
- `fork_repository` - Fork existing repo
- `list_branches` - See all branches
- `list_commits` - Commit history
- `list_tags` - Git tags

## Example Patterns

**Pattern: Code Analysis**
```
User: "Analyze src/ directory"

Steps:
1. get_file_contents(owner, repo, "src/") → List files
2. "I see: component1.js, component2.js, utils.js. Which should I examine?"
3. User: "component1.js and utils.js"
4. Read only those 2 files
5. Analyze

Result: 5,000 tokens instead of 50,000
```

**Pattern: Bulk File Changes**
```
User: "Update version number in all files"

Steps:
1. search_code("version") → Find files with "version"
2. Read only those files
3. Prepare changes
4. push_files() with all changes at once

Result: Single commit, efficient
```

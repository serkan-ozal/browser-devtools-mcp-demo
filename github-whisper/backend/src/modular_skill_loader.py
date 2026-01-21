from pathlib import Path
from typing import List, Set


class GitHubSkillLoader:
    """
    Dinamik skill yükleyici.
    Kullanıcı mesajına göre sadece gerekli skill modüllerini yükler.
    """
    
    # Path relative to this file: src/modular_skill_loader.py → backend/skills/
    SKILL_DIR = Path(__file__).parent.parent / "skills"
    
    MODULE_TRIGGERS = {
        "core.md": {
            "keywords": [],  # Always load
            "always_load": True,
            "description": "Core token optimization rules"
        },
        "repository.md": {
            "keywords": ["repo", "repository", "file", "files", "code", "directory", 
                        "folder", "branch", "commit", "read", "dosya", "klasör"],
            "always_load": False,
            "description": "Repository and file operations"
        },
        "issues-prs.md": {
            "keywords": ["issue", "issues", "pr", "pull request", "review", "merge",
                        "assign", "comment", "label"],
            "always_load": False,
            "description": "Issues and Pull Requests"
        },
        "security-notifications.md": {
            "keywords": ["security", "alert", "notification", "scan", "secret",
                        "güvenlik", "bildirim", "work on", "daily", "todo"],
            "always_load": False,
            "description": "Security alerts and notifications"
        },
        "tools-reference.md": {
            "keywords": ["tools", "list tools", "available", "what can"],
            "always_load": False,
            "description": "Complete tool reference (51 tools)"
        },
    }
    
    def __init__(self):
        """Initialize skill loader."""
        self.loaded_modules: Set[str] = set()
        self._ensure_skill_dir_exists()
    
    def _ensure_skill_dir_exists(self):
        """Ensure skill directory exists."""
        if not self.SKILL_DIR.exists():
            print(f"WARNING: Skill directory not found: {self.SKILL_DIR}")
            print(f"   Creating directory...")
            self.SKILL_DIR.mkdir(parents=True, exist_ok=True)
    
    def detect_needed_modules(self, user_message: str) -> List[str]:
        """
        Kullanıcı mesajından hangi modüllerin gerekli olduğunu belirle.
        
        Args:
            user_message: User's message text
            
        Returns:
            List of module filenames to load
        """
        needed = []
        message_lower = user_message.lower()
        
        for module_name, config in self.MODULE_TRIGGERS.items():
            if config.get("always_load", False):
                needed.append(module_name)
                continue
            
            # Keyword matching
            keywords = config.get("keywords", [])
            for keyword in keywords:
                if keyword.lower() in message_lower:
                    needed.append(module_name)
                    break
        
        return needed
    
    def load_module(self, module_name: str) -> str:
        """
        Load a single module.
        
        Args:
            module_name: Module filename (e.g., "core.md")
            
        Returns:
            Module content or empty string if not found
        """
        module_path = self.SKILL_DIR / module_name
        
        try:
            if module_path.exists():
                content = module_path.read_text(encoding='utf-8')
                self.loaded_modules.add(module_name)
                return content
            else:
                print(f"WARNING: Module not found: {module_path}")
                return ""
        except Exception as e:
            print(f"Error loading module {module_name}: {e}")
            return ""
    
    def load_skills_for_message(self, user_message: str) -> str:
        """
        Kullanıcı mesajı için gerekli skill'leri yükle.
        
        Args:
            user_message: User's message
            
        Returns:
            Combined skill content
        """
        # Which modules are needed?
        needed_modules = self.detect_needed_modules(user_message)
        
        if not needed_modules:
            # Fallback: Load core at least
            needed_modules = ["core.md"]
        
        # Load modules
        skill_parts = []
        for module_name in needed_modules:
            content = self.load_module(module_name)
            if content:
                skill_parts.append(f"## Module: {module_name}\n\n{content}")
        
        combined = "\n\n---\n\n".join(skill_parts)
        
        # Debug info
        print(f"📚 Loaded skills: {', '.join(needed_modules)}")
        print(f"📏 Total skill size: {len(combined)} chars (~{len(combined)//4} tokens)")
        
        return combined
    
    def get_skill_stats(self) -> dict:
        """
        Skill istatistiklerini al.
        
        Returns:
            Dictionary with stats
        """
        stats = {
            "available_modules": len(self.MODULE_TRIGGERS),
            "loaded_modules": len(self.loaded_modules),
            "modules": {}
        }
        
        for module_name in self.MODULE_TRIGGERS.keys():
            module_path = self.SKILL_DIR / module_name
            if module_path.exists():
                size = len(module_path.read_text(encoding='utf-8'))
                stats["modules"][module_name] = {
                    "exists": True,
                    "size_chars": size,
                    "size_tokens_approx": size // 4,
                    "loaded": module_name in self.loaded_modules
                }
            else:
                stats["modules"][module_name] = {
                    "exists": False,
                    "loaded": False
                }
        
        return stats


# Singleton instance
_skill_loader = None

def get_skill_loader() -> GitHubSkillLoader:
    """Get the singleton skill loader instance."""
    global _skill_loader
    if _skill_loader is None:
        _skill_loader = GitHubSkillLoader()
    return _skill_loader


# Convenience functions

def load_skills_for_message(user_message: str) -> str:
    """
    Load required skills for user message.
    
    Args:
        user_message: User's message
        
    Returns:
        Combined skill content
        
    Example:
        >>> skill = load_skills_for_message("Show me the repo files")
        📚 Loaded skills: core.md, repository.md
        📏 Total skill size: 3456 chars (~864 tokens)
    """
    loader = get_skill_loader()
    return loader.load_skills_for_message(user_message)


def get_skill_stats() -> dict:
    """Get skill loading statistics."""
    loader = get_skill_loader()
    return loader.get_skill_stats()


# Test/Demo
if __name__ == "__main__":
    print("=" * 60)
    print("MODULAR SKILL LOADER TEST")
    print("=" * 60)
    
    # Test messages
    test_messages = [
        "What should I work on today?",
        "Show me the files in src/ directory",
        "Review this PR for me",
        "Check for security vulnerabilities",
        "List all available tools",
        "Hello, how are you?",  # Minimal load
    ]
    
    for msg in test_messages:
        print(f"\n📨 Message: '{msg}'")
        skill = load_skills_for_message(msg)
        print()
    
    # Show stats
    print("\n" + "=" * 60)
    print("SKILL STATISTICS")
    print("=" * 60)
    stats = get_skill_stats()
    print(f"Available modules: {stats['available_modules']}")
    print(f"Loaded modules: {stats['loaded_modules']}")
    print("\nModule details:")
    for name, info in stats['modules'].items():
        if info['exists']:
            status = "SUCCESS: LOADED" if info['loaded'] else "AVAILABLE"
            print(f"  {status} {name}: {info['size_chars']} chars (~{info['size_tokens_approx']} tokens)")
        else:
            print(f"  ERROR: MISSING {name}")
#!/usr/bin/env python3
"""
🔄 Auto-commit and push changes to git
"""

import subprocess
import sys
from datetime import datetime

def run_command(cmd, description):
    """Run a shell command and return result."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            cwd="/Users/Shared/Predator_60"
        )
        
        if result.returncode == 0:
            print(f"✅ {description}")
            if result.stdout.strip():
                print(f"   Output: {result.stdout[:200]}")
            return True
        else:
            print(f"❌ {description}")
            print(f"   Error: {result.stderr[:200]}")
            return False
    except Exception as e:
        print(f"❌ {description}: {e}")
        return False

def main():
    print("🔄 Starting auto-commit process...\n")
    
    # Step 1: Check git status
    print("📊 Checking git status...")
    run_command("git status --short", "Git status checked")
    
    # Step 2: Add all changes
    print("\n➕ Adding all changes...")
    if not run_command("git add -A", "Changes added to staging"):
        print("No changes to commit or git error")
        return
    
    # Step 3: Check if there are staged changes
    print("\n🔍 Checking for staged changes...")
    result = subprocess.run(
        "git diff --cached --name-only",
        shell=True,
        capture_output=True,
        text=True,
        cwd="/Users/Shared/Predator_60"
    )
    
    if not result.stdout.strip():
        print("ℹ️  No staged changes to commit")
        return
    
    print(f"📝 Files to commit:\n{result.stdout}")
    
    # Step 4: Commit with descriptive message
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_msg = f"feat(core): production optimization v56.1.4 - {timestamp}\n\n- Added Redis caching layer for performance\n- Created database indexes for query optimization\n- Implemented integration tests suite\n- Added automated deployment script\n- Enhanced monitoring endpoints\n- Improved error handling and validation"
    
    print(f"\n💾 Committing changes...")
    if not run_command(f'git commit -m "{commit_msg}"', "Changes committed"):
        print("⚠️  Commit failed (may be no changes or hook rejection)")
        return
    
    # Step 5: Push to remote
    print("\n🚀 Pushing to remote repository...")
    if run_command("git push origin HEAD", "Changes pushed to remote"):
        print("\n✅ Successfully committed and pushed!")
    else:
        print("\n⚠️  Commit succeeded but push failed")
        print("   You may need to pull first or check remote connection")

if __name__ == "__main__":
    main()

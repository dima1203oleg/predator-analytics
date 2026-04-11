#!/usr/bin/env python3
"""
🧹 COMPLETE PROJECT CLEANUP для PREDATOR Analytics v56.1.4

Комплексне очищення всього проекту від зайвих файлів.
Об'єднує всі cleanup скрипти в один.
"""

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path("/Users/Shared/Predator_60")
SCRIPTS_DIR = PROJECT_ROOT / "scripts"

def run_cleanup_script(script_name: str, description: str):
    """Run a cleanup script."""
    script_path = SCRIPTS_DIR / script_name
    
    if not script_path.exists():
        print(f"⚠️  Script not found: {script_name}")
        return False
    
    print(f"\n{'='*60}")
    print(f"🔄 Running: {description}")
    print(f"{'='*60}\n")
    
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=PROJECT_ROOT,
            capture_output=False,
            text=True
        )
        
        if result.returncode == 0:
            print(f"✅ {description} - SUCCESS")
            return True
        else:
            print(f"❌ {description} - FAILED")
            return False
            
    except Exception as e:
        print(f"❌ Error running {script_name}: {e}")
        return False


def main():
    """Run all cleanup scripts."""
    print("🧹 PREDATOR Analytics v56.1.4 - COMPLETE PROJECT CLEANUP")
    print("=" * 60)
    print("\nThis will:")
    print("  1. Clean up root directory (remove outdated docs)")
    print("  2. Archive old scripts (reduce from 308 to ~15)")
    print("  3. Archive old documentation (reduce from 112 to ~15)")
    print("  4. Analyze duplicate apps (telegram bots)")
    print("\n⚠️  NOTE: Files will be ARCHIVED, not deleted!")
    print("        You can review and permanently delete later.")
    print("\n" + "=" * 60)
    
    response = input("\n❓ Continue with cleanup? (yes/no): ").strip().lower()
    
    if response != 'yes':
        print("\n❌ Cleanup cancelled by user")
        return
    
    print("\n🚀 Starting comprehensive cleanup...\n")
    
    results = []
    
    # Step 1: Clean root directory
    results.append(run_cleanup_script(
        "cleanup-project.py",
        "Step 1/4: Cleaning root directory"
    ))
    
    # Step 2: Clean scripts directory
    results.append(run_cleanup_script(
        "cleanup-scripts-directory.py",
        "Step 2/4: Archiving old scripts"
    ))
    
    # Step 3: Clean docs directory
    results.append(run_cleanup_script(
        "cleanup-docs-directory.py",
        "Step 3/4: Archiving old documentation"
    ))
    
    # Step 4: Analyze telegram bots
    results.append(run_cleanup_script(
        "analyze-telegram-bots.py",
        "Step 4/4: Analyzing duplicate apps"
    ))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 CLEANUP SUMMARY")
    print("=" * 60)
    
    success_count = sum(1 for r in results if r)
    total_count = len(results)
    
    print(f"\n✅ Successful: {success_count}/{total_count}")
    
    if success_count == total_count:
        print("\n🎉 ALL CLEANUP TASKS COMPLETED SUCCESSFULLY!")
        print("\n📁 Archived files are located in:")
        print(f"   - scripts/archive/")
        print(f"   - docs/archive/")
        print(f"   - apps/archive/ (if created)")
        print("\n💡 Next steps:")
        print("   1. Review archived files")
        print("   2. Delete archives you don't need")
        print("   3. Run: git status")
        print("   4. Commit changes: git add -A && git commit -m 'chore: project cleanup'")
        print("   5. Deploy: ./deploy-production.sh production")
    else:
        print(f"\n⚠️  {total_count - success_count} task(s) failed")
        print("   Check the output above for details")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()

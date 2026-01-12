import os
import ast
import hashlib
import sys

def check_syntax(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            source = f.read()
        ast.parse(source)
        return True, None
    except Exception as e:
        return False, str(e)

def get_file_hash(file_path):
    hash_md5 = hashlib.md5()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except:
        return None

def find_issues(root_dirs):
    syntax_errors = []
    file_hashes = {}
    duplicates = []

    print(f"Scanning directories: {root_dirs}")

    for root_dir in root_dirs:
        for root, _, files in os.walk(root_dir):
            for file in files:
                if file.endswith(".py"):
                    full_path = os.path.join(root, file)

                    # 1. Syntax Check
                    ok, error = check_syntax(full_path)
                    if not ok:
                        syntax_errors.append((full_path, error))

                    # 2. Duplicate File Check
                    file_hash = get_file_hash(full_path)
                    if file_hash:
                        if file_hash in file_hashes:
                            duplicates.append((full_path, file_hashes[file_hash]))
                        else:
                            file_hashes[file_hash] = full_path

    return syntax_errors, duplicates

if __name__ == "__main__":
    dirs_to_scan = [
        os.path.abspath("apps"),
        os.path.abspath("libs"),
        os.path.abspath("scripts")
    ]

    # Filter out dirs that don't exist
    dirs_to_scan = [d for d in dirs_to_scan if os.path.exists(d)]

    syntax_errors, duplicates = find_issues(dirs_to_scan)

    print("\n=== SYNTAX ERRORS ===")
    if not syntax_errors:
        print("✅ No syntax errors found.")
    else:
        for f, e in syntax_errors:
            print(f"[FAIL] {f}: {e}")

    print("\n=== DUPLICATE FILES (Content Match) ===")
    if not duplicates:
        print("✅ No duplicate files found.")
    else:
        for f1, f2 in duplicates:
            print(f"[WARN] Duplicate: {f1} == {f2}")

    if syntax_errors:
        sys.exit(1)
    print("\n✅ HEALTH CHECK PASSED")

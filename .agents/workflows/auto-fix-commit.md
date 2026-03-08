---
description: Automatic fix and commit workflow
---

// turbo-all
1. Analyze the issue reported by the USER or detected by tools (Pyre, cSpell).
2. Apply the necessary code changes using `replace_file_content` or `multi_replace_file_content`.
3. Verify the changes (e.g., check if lint errors persistent).
4. Stage all modified files: `git add .`
5. Create a descriptive commit message following the project's convention (e.g., `fix(module): message`).
6. Execute the commit: `git commit -m "..."`.
7. Report the result to the USER.

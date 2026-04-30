#!/usr/bin/env python3
"""🔧 Make deployment scripts executable
"""

import os
import stat


def make_executable(filepath):
    """Make a file executable."""
    if os.path.exists(filepath):
        st = os.stat(filepath)
        os.chmod(filepath, st.st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)
    else:
        pass

if __name__ == "__main__":
    scripts = [
        "/Users/Shared/Predator_60/deploy-production.sh",
    ]

    for script in scripts:
        make_executable(script)


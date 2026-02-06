from __future__ import annotations

import re


def check_structure(file_path):
    with open(file_path) as f:
        content = f.read()

    tags = []
    lines = content.split('\n')

    # Regex to find tags: <TagName, </TagName, />
    # Simplified parser
    tag_pattern = re.compile(r'</?([a-zA-Z0-9]+)([^>]*)>')

    for i, line in enumerate(lines):
        # Remove comments
        line = re.sub(r'{/\*.*?\*/}', '', line)
        line = re.sub(r'//.*', '', line)

        matches = tag_pattern.finditer(line)
        for match in matches:
            full_tag = match.group(0)
            tag_name = match.group(1)
            is_closing = full_tag.startswith('</')
            is_self_closing = full_tag.endswith('/>')

            # Ignore HTML void elements if needed, but for React components we usually care
            if tag_name in ['br', 'hr', 'img', 'input', 'meta', 'link']:
                continue

            if is_self_closing:
                continue

            if is_closing:
                if not tags:
                    print(f"Error: Unexpected closing tag </{tag_name}> at line {i+1}")
                    return

                last_tag = tags.pop()
                if last_tag['name'] != tag_name:
                    print(f"Error: Mismatched tag at line {i+1}. Expected </{last_tag['name']}>, got </{tag_name}>")
                    print(f"Opening tag <{last_tag['name']}> was at line {last_tag['line']}")
                    return
            else:
                tags.append({'name': tag_name, 'line': i+1})

    if tags:
        print(f"Error: Unclosed tags: {[t['name'] for t in tags]}")
        print(f"Last unclosed tag <{tags[-1]['name']}> at line {tags[-1]['line']}")
    else:
        print("Structure seems OK")

check_structure('/Users/dima-mac/Documents/Predator_21/apps/frontend/src/views/TestingView.tsx')

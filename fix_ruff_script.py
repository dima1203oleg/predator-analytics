import re


def replace_in_file(filepath, replacements):
    with open(filepath) as f:
        content = f.read()

    for old, new in replacements:
        if isinstance(old, re.Pattern):
            content = old.sub(new, content)
        else:
            content = content.replace(old, new)

    with open(filepath, 'w') as f:
        f.write(content)

# E402 in orm.py
replace_in_file('/Users/dima-mac/Documents/Predator_21/services/core-api/app/models/orm.py', [
    (re.compile(r'from sqlalchemy import.*?\nfrom sqlalchemy.dialects.postgresql import INET, JSONB, UUID\n', re.DOTALL),
     'from sqlalchemy import BigInteger, Column, DateTime, String, Text, text\nfrom sqlalchemy.dialects.postgresql import INET, JSONB, UUID\n')
])
# Need to check orm.py to see why E402 is happening

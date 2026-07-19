import sys

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx'
with open(filepath, 'r') as f:
    content = f.read()

bad_import = """  MapPin, Layers, Brain, Users, Wallet, AlertCircle
}   Stethoscope,
} from 'lucide-react';"""

good_import = """  MapPin, Layers, Brain, Users, Wallet, AlertCircle, Stethoscope
} from 'lucide-react';"""

content = content.replace(bad_import, good_import)

with open(filepath, 'w') as f:
    f.write(content)
print("Fixed lucide import")

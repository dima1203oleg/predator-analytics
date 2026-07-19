import sys

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx'
with open(filepath, 'r') as f:
    lines = f.readlines()

# 1. Add imports: Brain, Users, Wallet, AlertCircle
for i, line in enumerate(lines):
    if "from 'lucide-react';" in line:
        # Preceding line has imports, let's just insert at the end of the previous line
        lines[i-1] = lines[i-1].rstrip() + ", Brain, Users, Wallet, AlertCircle\n"
        break

# 2. Add state
for i, line in enumerate(lines):
    if "const [copiedField, setCopiedField] = useState" in line:
        lines.insert(i+1, "  const [activePersonTab, setActivePersonTab] = useState<'general' | 'family' | 'assets' | 'psychology' | 'compromat'>('general');\n")
        break

with open(filepath, 'w') as f:
    f.writelines(lines)
print("State and imports patched")

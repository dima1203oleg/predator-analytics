import sys

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/main.tsx'
with open(filepath, 'r') as f:
    content = f.read()

import_react_query = "import { QueryClient, QueryClientProvider } from '@tanstack/react-query';\n"
if import_react_query not in content:
    content = content.replace("import './index.css';", "import './index.css';\n" + import_react_query)

query_client_decl = "const queryClient = new QueryClient();\n\n"
if "const queryClient" not in content:
    content = content.replace("createRoot(", query_client_decl + "createRoot(")

content = content.replace("<App />", "<QueryClientProvider client={queryClient}>\n      <App />\n    </QueryClientProvider>")

with open(filepath, 'w') as f:
    f.write(content)

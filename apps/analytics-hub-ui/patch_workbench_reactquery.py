import sys

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace the manual fetch hooks with the useOsintSearch
import_reactquery = "import { useOsintSearch } from '../hooks/useOsint';\n"
if "useOsintSearch" not in content:
    content = content.replace("import { OSINT_ENTITIES, OsintEntity } from '../osintData';", import_reactquery + "import { OSINT_ENTITIES, OsintEntity } from '../osintData';")

old_search_logic = """  // API States
  const [apiStats, setApiStats] = useState<any>(null);
  const [apiTools, setApiTools] = useState<any[]>([]);
  const [apiRegistries, setApiRegistries] = useState<any>(null);
  const [apiFeed, setApiFeed] = useState<any[]>([]);
  const [apiSearchResults, setApiSearchResults] = useState<OsintEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch static OSINT data on mount
  useEffect(() => {
    const fetchOsintData = async () => {
      try {
        const [statsRes, toolsRes, registriesRes, feedRes] = await Promise.all([
          apiFetch('/api/v1/osint/stats').catch(() => null),
          apiFetch('/api/v1/osint/tools').catch(() => null),
          apiFetch('/api/v1/osint/registries').catch(() => null),
          apiFetch('/api/v1/osint/feed').catch(() => null)
        ]);
        
        if (statsRes?.ok) setApiStats(await statsRes.json());
        if (toolsRes?.ok) setApiTools(await toolsRes.json());
        if (registriesRes?.ok) setApiRegistries(await registriesRes.json());
        if (feedRes?.ok) setApiFeed(await feedRes.json());
      } catch (err) {
        console.error('OSINT API fetch error:', err);
      }
    };
    fetchOsintData();
  }, []);

  // Search API effect (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setApiSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiFetch(`/api/v1/osint/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          const mapped: OsintEntity[] = data.map((d: any) => ({
            id: d.ueid || `api-${d.edrpou}`,
            type: 'company',
            name: d.name,
            code: d.edrpou,
            status: d.status === 'registered' ? 'ACTIVE' : d.status === 'bankrupt' ? 'LIQUIDATED' : 'ACTIVE',
            riskScore: d.risk_score || 0,
            address: 'Дані з API',
            description: `Галузь: ${d.industry || 'Не вказано'}`,
            relationships: [],
            aiRecommendations: 'Знайдено через API'
          }));
          setApiSearchResults(mapped);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);"""

new_search_logic = """  // React Query Integration
  const activeDatabases = useMemo(() => new Set(['all']), []);
  const { data: searchResults = [], isLoading: isSearching } = useOsintSearch(searchQuery, activeDatabases, { start: startDate, end: endDate });
  
  // API States (Mocking the rest for now)
  const [apiStats, setApiStats] = useState<any>(null);
  const [apiTools, setApiTools] = useState<any[]>([]);
  const [apiRegistries, setApiRegistries] = useState<any>(null);
  const [apiFeed, setApiFeed] = useState<any[]>([]);

  // Fetch static OSINT data on mount
  useEffect(() => {
    const fetchOsintData = async () => {
      try {
        const [statsRes, toolsRes, registriesRes, feedRes] = await Promise.all([
          apiFetch('/api/v1/osint/stats').catch(() => null),
          apiFetch('/api/v1/osint/tools').catch(() => null),
          apiFetch('/api/v1/osint/registries').catch(() => null),
          apiFetch('/api/v1/osint/feed').catch(() => null)
        ]);
        
        if (statsRes?.ok) setApiStats(await statsRes.json());
        if (toolsRes?.ok) setApiTools(await toolsRes.json());
        if (registriesRes?.ok) setApiRegistries(await registriesRes.json());
        if (feedRes?.ok) setApiFeed(await feedRes.json());
      } catch (err) {
        console.error('OSINT API fetch error:', err);
      }
    };
    fetchOsintData();
  }, []);"""

content = content.replace(old_search_logic, new_search_logic)

# Replace `apiSearchResults` inside filteredEntities calculation with searchResults
content = content.replace("    const combined = [...localFiltered, ...apiSearchResults];", "    const combined = [...localFiltered, ...searchResults];")


with open(filepath, 'w') as f:
    f.write(content)
print("Updated Workbench to use React Query hook")

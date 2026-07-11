const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

export async function fetchInitialGraph() {
  try {
    const response = await fetch(`${API_URL}/graph/customs`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return { nodes: data.nodes || [], edges: data.edges || [] };
    } else {
      console.warn("Expected JSON but received:", contentType);
      return { nodes: [], edges: [] };
    }
  } catch (error) {
    console.error("Failed to fetch initial graph data:", error);
    return { nodes: [], edges: [] };
  }
}

export async function fetchExplanation(entityId: string, contextData: any = {}) {
  try {
    const response = await fetch(`${API_URL}/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entity_id: entityId, context_data: contextData })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    } else {
      console.warn("Expected JSON but received:", contentType);
      return null;
    }
  } catch (error) {
    console.error("Failed to fetch explanation:", error);
    return null;
  }
}

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

export async function fetchChatResponse(query: string) {
  try {
    const response = await fetch(`${API_URL}/copilot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch chat response:", error);
    return {
      response: `Помилка з'єднання: не вдалося отримати відповідь на запит "${query}".`,
      sources: []
    };
  }
}

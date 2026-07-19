# PREDATOR Analytics v56.5-ELITE — Sovereign Command Center (UI/UX та Візуалізація)

## Опис

Інтерфейс аналітичної платформи (React/Vite) — це не просто набір дашбордів, а робоче середовище для розслідувачів. Він має поєднувати пошук, граф, географію та чат з AI.

## Архітектура

### 1. Графовий візуалізатор (Graph Explorer)

**Технологія:** Інтеграція бібліотек рівня Cytoscape.js, Ogma або React Force Graph (через WebGL для плавного рендеру тисяч вузлів).

**Функціонал "Розгортання" (Expand/Collapse):** 

Аналітик клікає на вузол "Компанія А", обирає Expand: Directors, і на екрані з'являються всі пов'язані фізичні особи.

```typescript
import React, { useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

const GraphExplorer: React.FC = () => {
  const [elements, setElements] = useState<any[]>([]);
  
  const expandNode = (nodeId: string, relationType: string) => {
    // Запит до API для отримання пов'язаних вузлів
    fetch(`/api/v1/graph/expand/${nodeId}?relation=${relationType}`)
      .then(res => res.json())
      .then(data => {
        setElements([...elements, ...data.nodes, ...data.edges]);
      });
  };
  
  return (
    <CytoscapeComponent
      elements={elements}
      style={{ width: '100%', height: '600px' }}
      layout={{ name: 'cose' }}
      cy={(cy) => {
        cy.on('tap', 'node', (evt) => {
          const node = evt.target;
          const nodeId = node.id();
          
          // Показати контекстне меню для розгортання
          showContextMenu(nodeId);
        });
      }}
    />
  );
};
```

**Таймлайн транзакцій:**

Візуальна шкала часу внизу екрана. При перетягуванні повзунка граф динамічно змінюється (наприклад, показує, як змінювалися засновники компанії протягом 2023 року).

```typescript
import React, { useState } from 'react';
import { Slider } from '@mui/material';

const TransactionTimeline: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const handleDateChange = (event: Event, newValue: number | number[]) => {
    const date = new Date(newValue as number);
    setSelectedDate(date);
    
    // Оновити граф для обраної дати
    updateGraphForDate(date);
  };
  
  return (
    <div className="timeline-container">
      <Slider
        min={new Date('2020-01-01').getTime()}
        max={new Date().getTime()}
        value={selectedDate.getTime()}
        onChange={handleDateChange}
        valueLabelFormat={(value) => new Date(value).toLocaleDateString()}
      />
      <div className="selected-date">
        {selectedDate.toLocaleDateString('uk-UA')}
      </div>
    </div>
  );
};
```

### 2. AI-Асистент (Copilot Panel)

**Інтерфейс взаємодії:** Вікно чату з DeepSeek R1 / GLM-5.1.

**Прозорість мислення (Chain of Thought):**

Коли користувач робить запит, інтерфейс показує, які саме "інструменти" (Tools) викликав агент. Наприклад:

```
> Агент аналізує запит...
> Викликано: search_graph_anomaly(pattern="Ланцюг прихованого гіганта")
> Отримано 14 результатів.
> Формування звіту...
```

```typescript
import React, { useState } from 'react';

const CopilotPanel: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thoughtProcess, setThoughtProcess] = useState<string[]>([]);
  
  const sendMessage = async (query: string) => {
    setIsThinking(true);
    setThoughtProcess([]);
    
    // Додати повідомлення користувача
    setMessages([...messages, { role: 'user', content: query }]);
    
    // Виклик ReAct агента
    const response = await fetch('/api/v1/react-agent/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    }).then(res => res.json());
    
    // Показати процес мислення
    setThoughtProcess(response.thought_process);
    
    // Додати відповідь агента
    setMessages([...messages, { role: 'user', content: query }, { role: 'assistant', content: response.answer }]);
    
    setIsThinking(false);
  };
  
  return (
    <div className="copilot-panel">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      {isThinking && (
        <div className="thinking-process">
          <div className="thinking-header">Агент аналізує запит...</div>
          {thoughtProcess.map((thought, index) => (
            <div key={index} className="thought-step">
              > {thought}
            </div>
          ))}
        </div>
      )}
      
      <div className="input-area">
        <textarea
          placeholder="Введіть запит..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e.currentTarget.value);
            }
          }}
        />
      </div>
    </div>
  );
};
```

### 3. Геопросторова панель (Geospatial View)

**Технологія:** Deck.gl або MapLibre GL JS для накладання митних маршрутів на реальну карту.

**Вузли графа, які мають координати (Митні пости, Юридичні адреси), можуть бути відображені як теплові карти (Heatmaps) для виявлення концентрації підозрілих реєстрацій.** 

```typescript
import React from 'react';
import { Map } from 'react-map-gl';
import { HeatmapLayer } from 'deck.gl';

const GeospatialView: React.FC = () => {
  const heatmapData = [
    { coordinates: [30.5, 50.4], weight: 0.8 },  // Київ
    { coordinates: [24.0, 49.8], weight: 0.6 },  // Львів
    { coordinates: [35.1, 46.6], weight: 0.9 },  // Одеса
  ];
  
  return (
    <Map
      initialViewState={{
        longitude: 31.0,
        latitude: 48.5,
        zoom: 5
      }}
      style={{ width: '100%', height: '500px' }}
      mapStyle="mapbox://styles/mapbox/dark-v10"
    >
      <HeatmapLayer
        data={heatmapData}
        getPosition={(d) => d.coordinates}
        getWeight={(d) => d.weight}
        radiusPixels={60}
      />
    </Map>
  );
};
```

## Інтеграція з бекендом

**API endpoints для UI:**

```typescript
// API клієнт для взаємодії з бекендом
const apiClient = {
  // Граф
  expandNode: (nodeId: string, relation: string) => 
    fetch(`/api/v1/graph/expand/${nodeId}?relation=${relation}`),
  
  // AI-асистент
  queryAgent: (query: string) =>
    fetch('/api/v1/react-agent/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    }),
  
  // Геопростір
  getHeatmapData: (region: string) =>
    fetch(`/api/v1/geospatial/heatmap?region=${region}`),
  
  // Інструменти
  listTools: () => fetch('/api/v1/react-agent/tools'),
  callTool: (toolName: string, params: any) =>
    fetch('/api/v1/react-agent/tools/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_name: toolName, parameters: params })
    })
};
```

## Переваги

- **Інтерактивність** — Графовий візуалізатор з розгортанням вузлів
- **Прозорість** — Chain of Thought показує процес мислення агента
- **Геопростір** — Теплові карти для виявлення концентрації підозрілих реєстрацій 
- **Інтеграція** — Єдиний робочий простір для розслідувачів

## Наступні кроки

1. Реалізувати графовий візуалізатор на Cytoscape.js
2. Створити AI-асистент з Chain of Thought
3. Інтегрувати геопросторову панель на MapLibre GL
4. Налаштувати таймлайн транзакцій
5. Інтегрувати з API бекенду

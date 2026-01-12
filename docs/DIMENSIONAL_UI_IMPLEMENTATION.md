# 🚀 DIMENSIONAL UI - IMPLEMENTATION GUIDE

## Phase 1: Foundation (COMPLETED ✅)

### Created Components

1. **`useDimensionalContext.ts`** - Core hook
   - Location: `/apps/frontend/src/hooks/useDimensionalContext.ts`
   - Provides: Role context, permission checking, visualization mode selection
   - Usage: `const { dimension, role, canAccess } = useDimensionalContext();`

2. **`PermissionLayer.tsx`** - Visual security system
   - Location: `/apps/frontend/src/components/dimensional/PermissionLayer.tsx`
   - Features: Auto-apply visual effects (locked/blurred/redacted/hashed)
   - Usage: `<PermissionLayer sensitivity="CONFIDENTIAL">{content}</PermissionLayer>`

3. **`QuantumCard.tsx`** - Adaptive multi-state component
   - Location: `/apps/frontend/src/components/dimensional/QuantumCard.tsx`
   - Features: Multiple views for different roles
   - Usage:
     ```tsx
     <QuantumCard>
       <ExplorerView>Simple content</ExplorerView>
       <OperatorView>Detailed content</OperatorView>
       <CommanderView>Full content + controls</CommanderView>
     </QuantumCard>
     ```

4. **`AdaptiveDashboard.tsx`** - Dimensional dashboard
   - Location: `/apps/frontend/src/views/dimensional/AdaptiveDashboard.tsx`
   - Features: Three parallel dashboard realities
   - Usage: Replace existing OverviewView or use as main dashboard

---

## 📖 HOW TO USE

### Basic Integration

#### Step 1: Import components

```tsx
import {
  QuantumCard,
  ExplorerView,
  OperatorView,
  CommanderView,
  PermissionLayer,
  useDimensionalContext
} from '@/components/dimensional';
```

#### Step 2: Use in your views

```tsx
function MyView() {
  const { dimension, isCommander } = useDimensionalContext();

  return (
    <div>
      <h1>Current Dimension: {dimension}</h1>

      {/* Adaptive card */}
      <QuantumCard>
        <ExplorerView>
          <p>Friendly simple interface</p>
        </ExplorerView>

        <OperatorView>
          <p>Detailed metrics and charts</p>
        </OperatorView>

        <CommanderView>
          <p>Raw data + edit controls</p>
          {isCommander && <button>Delete</button>}
        </CommanderView>
      </QuantumCard>

      {/* Secure content */}
      <PermissionLayer sensitivity="CONFIDENTIAL">
        <div>Sensitive financial data here</div>
      </PermissionLayer>
    </div>
  );
}
```

---

## 🎨 VISUAL EXAMPLES

### Permission Layer Modes

```tsx
// Full access (Commander)
<PermissionLayer sensitivity="PUBLIC">
  Content shown fully ✓
</PermissionLayer>

// Blurred (Operator viewing CONFIDENTIAL)
<PermissionLayer sensitivity="CONFIDENTIAL">
  Content with blur effect on hover
</PermissionLayer>

// Redacted (Operator viewing CLASSIFIED)
<PermissionLayer sensitivity="CLASSIFIED">
  ███ ████ ███████ (CIA-style bars)
</PermissionLayer>

// Locked (Explorer viewing anything sensitive)
<PermissionLayer sensitivity="CLASSIFIED">
  🔒 Access Denied + Request Button
</PermissionLayer>
```

### Quantum Card Examples

#### Example 1: Company Card

```tsx
<QuantumCard data={companyData}>
  <ExplorerView>
    <h3>{company.name}</h3>
    <Badge>Industry: {company.industry}</Badge>
    <SimpleRiskBar score={company.riskScore} />
  </ExplorerView>

  <OperatorView>
    <h3>{company.name}</h3>
    <TacticalBadges {...company} />
    <DetailedRiskChart score={company.riskScore} />
    <MetricsGrid metrics={company.metrics} />
  </OperatorView>

  <CommanderView>
    <h3>
      {company.name}
      <EditButton onClick={handleEdit} />
      <DeleteButton onClick={handleDelete} />
    </h3>
    <Tabs>
      <Tab name="Analytics">{/* charts */}</Tab>
      <Tab name="Raw Data">
        <JsonViewer data={company} editable />
      </Tab>
      <Tab name="Audit">
        <AuditTimeline entity={company.id} />
      </Tab>
    </Tabs>
  </CommanderView>
</QuantumCard>
```

#### Example 2: System Status Widget

```tsx
<QuantumCard>
  <ExplorerView>
    <p className="text-lg">✅ System Healthy</p>
  </ExplorerView>

  <OperatorView>
    <div>
      <p>CPU: 76% | Memory: 62%</p>
      <p>Active Containers: 15</p>
    </div>
  </OperatorView>

  <CommanderView>
    <div>
      <DetailedMetrics />
      <LiveLogs />
      <EmergencyControls />
    </div>
  </CommanderView>
</QuantumCard>
```

---

## 🔧 ADVANCED USAGE

### Progressive Reveal

Show content only when user has sufficient permissions:

```tsx
import { ProgressiveReveal } from '@/components/dimensional';

<ProgressiveReveal minRole={UserRole.OPERATOR}>
  <div>This content only visible to Operators and Commanders</div>
</ProgressiveReveal>
```

### Information Tiers

Organize content by access levels:

```tsx
import { InformationTier } from '@/components/dimensional';

<div>
  <InformationTier tier={1}>
    Basic info for everyone
  </InformationTier>

  <InformationTier tier={2}>
    Advanced info for Operator+
  </InformationTier>

  <InformationTier tier={3}>
    Privileged info for Commander only
  </InformationTier>
</div>
```

### Conditional Views

Render based on custom conditions:

```tsx
import { ConditionalView } from '@/components/dimensional';

<ConditionalView
  condition={({ dimension, role }) =>
    dimension === 'NEXUS' && role === UserRole.COMMANDER
  }
  fallback={<p>Not available in this mode</p>}
>
  <CommanderOnlyFeature />
</ConditionalView>
```

---

## 🎯 INTEGRATION ROADMAP

### Phase 1: Foundation ✅ (COMPLETED)
- [x] Core hooks and components
- [x] Permission visualization system
- [x] Quantum card implementation
- [x] Adaptive dashboard

### Phase 2: View Migration (NEXT STEPS)

**Recommended Order:**

1. **Replace OverviewView** with AdaptiveDashboard
   ```tsx
   // apps/frontend/src/App.tsx
   import AdaptiveDashboard from './views/dimensional/AdaptiveDashboard';

   // In renderContent():
   case TabView.OVERVIEW: return <AdaptiveDashboard />;
   ```

2. **Upgrade CasesView** with QuantumCard
   ```tsx
   {cases.map(case => (
     <QuantumCard key={case.id} data={case}>
       <ExplorerView>
         <CaseCardSimple case={case} />
       </ExplorerView>
       <OperatorView>
         <CaseCardDetailed case={case} />
       </OperatorView>
       <CommanderView>
         <CaseCardFull case={case} editable />
       </CommanderView>
     </QuantumCard>
   ))}
   ```

3. **Add PermissionLayer** to sensitive data views
   - DocumentsView: Wrap document content
   - AnalyticsView: Wrap financial data
   - SecurityView: Wrap audit logs

4. **Enhance AgentsView** with dimensional context
   ```tsx
   const { dimension } = useDimensionalContext();

   // Show different agent details based on dimension
   ```

### Phase 3: Polish & Advanced Features

1. **Dimension Transitions**
   - Smooth animations between shells
   - Reality morphing effects

2. **AI Council Chamber** (Commander exclusive)
   - New view for LLM management
   - Interactive debate mode

3. **Smart Insights** (Explorer friendly AI)
   - Auto-generate explanations
   - Friendly AI assistant

---

## 📚 API REFERENCE

### `useDimensionalContext()`

Returns:
```typescript
{
  dimension: 'NEBULA' | 'CORTEX' | 'NEXUS',
  role: UserRole,
  canAccess: (resource: string, action?: string) => boolean,
  canAccessLevel: (requiredRole: UserRole) => boolean,
  getVisualizationMode: (sensitivity: DataSensitivity) => VisualizationMode,
  shouldReveal: (sensitivity: DataSensitivity) => boolean,
  isExplorer: boolean,
  isOperator: boolean,
  isCommander: boolean,
  informationDensity: number // 0-100
}
```

### Data Sensitivity Levels

```typescript
type DataSensitivity =
  | 'PUBLIC'        // Everyone can see
  | 'INTERNAL'      // Operator+
  | 'CONFIDENTIAL'  // Commander only (Operator sees blurred)
  | 'CLASSIFIED'    // Commander only (Operator sees redacted)
```

### Visualization Modes

```typescript
type VisualizationMode =
  | 'FULL'      // Complete access
  | 'BLURRED'   // Blur effect with preview
  | 'REDACTED'  // Black bars (CIA-style)
  | 'HASHED'    // ***-***-1234
  | 'LOCKED'    // Complete block
```

---

## 🎨 STYLING

### Dimension-Specific CSS

The components automatically add classes based on current dimension:

```css
.dimension-nebula {
  /* Purple/blue cosmic theme */
}

.dimension-cortex {
  /* Cyan/amber tactical theme */
}

.dimension-nexus {
  /* Red/green matrix theme */
}
```

### Custom Styling

```tsx
<QuantumCard className="my-custom-class">
  {/* Your content */}
</QuantumCard>
```

---

## ⚠️ IMPORTANT NOTES

1. **Always wrap sensitive data** with `PermissionLayer`
2. **Use QuantumCard** for any content that should adapt to roles
3. **Commander actions** should always be audited
4. **Test with all three roles** during development

---

## 🐛 TROUBLESHOOTING

### Issue: Components not rendering

**Solution**: Ensure UserProvider and ShellProvider are wrapping your app:

```tsx
<UserProvider>
  <ShellProvider>
    <YourApp />
  </ShellProvider>
</UserProvider>
```

### Issue: Permission checks not working

**Solution**: Verify user has permissions array in UserContext:

```tsx
const MOCK_USER = {
  // ... other fields
  permissions: [
    { resource: 'documents', actions: ['read', 'write'] }
  ]
};
```

### Issue: Dimension transitions glitchy

**Solution**: Ensure framer-motion is installed:

```bash
npm install framer-motion
```

---

## 📊 PERFORMANCE TIPS

1. **Lazy load heavy components** in CommanderView
2. **Memoize** expensive calculations
3. **Use React.memo** for quantum card children
4. **Debounce** permission checks if used in loops

---

## 🚀 NEXT STEPS

1. **Test the AdaptiveDashboard**
   - Switch between user roles
   - Verify all three dimensions render correctly

2. **Start migrating existing views**
   - Begin with simple views (CasesView, DocumentsView)
   - Test thoroughly

3. **Add new dimensional views**
   - AI Council Chamber
   - Smart Insights panel

4. **Gather user feedback**
   - Test with real users
   - Iterate based on feedback

---

**Created**: 2026-01-06
**Version**: 1.0
**Status**: Phase 1 Complete ✅

**Ready for integration!** 🎉

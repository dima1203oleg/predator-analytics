import sys

with open('/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx', 'r') as f:
    lines = f.readlines()

# 1. Imports at line 18-19
imports = """import { OSINT_ENTITIES, OsintEntity } from '../osintData';
import { apiFetch } from '../api';
import OsintFiltersPanel from './OsintFiltersPanel';
import OsintResultsGrid from './OsintResultsGrid';
import OsintExportPanel from './OsintExportPanel';
"""

# 2. Filters Panel: lines 741 to 990 (0-indexed 740 to 989)
filters = """      {/* Top OSINT filter options */}
      <OsintFiltersPanel
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        riskLevelFilter={riskLevelFilter}
        setRiskLevelFilter={setRiskLevelFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        heatmapSensitivity={heatmapSensitivity}
        setHeatmapSensitivity={setHeatmapSensitivity}
        filteredEntities={filteredEntities}
        riskDistribution={riskDistribution}
      />
"""

# 3. Grid Panel: lines 1192 to 1501 (0-indexed 1191 to 1500)
grid = """            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <OsintResultsGrid
                filteredEntities={filteredEntities}
                activeEntity={activeEntity}
                selectedEntityIds={selectedEntityIds}
                toggleEntitySelection={toggleEntitySelection}
                toggleAllEntitiesSelection={toggleAllEntitiesSelection}
                onSelectEntityForInspector={onSelectEntityForInspector}
                setSimulateLargeDataset={setSimulateLargeDataset}
                simulateLargeDataset={simulateLargeDataset}
                getRiskTheme={getRiskTheme}
                getStatusBadgeShort={getStatusBadgeShort}
                handleCopyToClipboard={handleCopyToClipboard}
                copiedField={copiedField}
                resetFilters={() => {
                  setActiveFilter('all');
                  setCategoryFilter('all');
                  setRiskLevelFilter('all');
                  setSearchQuery('');
                  setStartDate('');
                  setEndDate('');
                }}
                isFiltersActive={
                  activeFilter !== 'all' ||
                  categoryFilter !== 'all' ||
                  riskLevelFilter !== 'all' ||
                  searchQuery !== '' ||
                  startDate !== '' ||
                  endDate !== ''
                }
                selectedEntitiesCount={selectedEntityIds.length}
              />
            </div>
"""

# 4. Modals Panel: lines 2491 to 3080 (0-indexed 2490 to 3079)
modals = """      {/* Export / Modals Panel */}
      <OsintExportPanel
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        showPreviewModal={showPreviewModal}
        setShowPreviewModal={setShowPreviewModal}
        showLargeExportConfirmation={showLargeExportConfirmation}
        setShowLargeExportConfirmation={setShowLargeExportConfirmation}
        pendingExportType={pendingExportType}
        setPendingExportType={setPendingExportType}
        selectedEntitiesForExport={selectedEntitiesForExport}
        activeFilter={activeFilter}
        categoryFilter={categoryFilter}
        riskLevelFilter={riskLevelFilter}
        searchQuery={searchQuery}
        filteredEntities={filteredEntities}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        isExporting={isExporting}
        downloadPDF={downloadPDF}
        handleCSVExport={handleCSVExport}
        handlePDFExport={handlePDFExport}
        confirmAndExecuteExport={confirmAndExecuteExport}
      />
"""

# Splicing
# Modals (2491-3080)
lines[2490:3080] = [modals]
# Grid (1192-1501)
lines[1191:1501] = [grid]
# Filters (741-990)
lines[740:990] = [filters]

# Imports (replace lines 18-19, indices 17-19)
lines[17:19] = [imports]

with open('/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx', 'w') as f:
    f.writelines(lines)

print("Done")

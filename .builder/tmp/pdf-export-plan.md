# Camp Plan PDF Export System - Implementation Plan

## Project Overview
Build a professional, multi-page PDF export feature for Scout-Connect Camp Plans that generates a print-ready A4 document from Supabase data.

## Current State
- ✅ jsPDF v2.5.2 already installed
- ✅ html2canvas available for future map rendering
- ✅ Camp Planner page has complete data structure
- ✅ All tab components load/manage required data
- ✅ CampPlanner.jsx maintains unified formData state

## Dependencies Analysis
- **jsPDF**: Already installed (v2.5.2) - core PDF generation
- **jspdf-autotable**: NOT installed - MUST ADD for table rendering
- **html2canvas**: Already installed - can use for campsite map snapshot

**Additional package needed:**
```
npm install jspdf-autotable@3.5.31
```

## Architecture

### 1. Create PDF Export Utility Module
**File:** `src/utils/campPdfExport.js`

This will be the core PDF generation engine with functions:
- `generateCampPlan(campData)` - main orchestrator
- `addCoverPage(pdf, campData)` - cover with logo, camp name, dates, location
- `addTableOfContents(pdf)` - auto-generated TOC
- `addOverviewSection(pdf, campData)` - Section 1: Camp details
- `addParticipantsSection(pdf, campData)` - Section 2: Participant roster
- `addScheduleSection(pdf, campData)` - Section 3: Daily schedule timetable
- `addTasksSection(pdf, campData)` - Section 4: Preparation tasks (separated by status)
- `addEquipmentSection(pdf, campData)` - Section 5: Equipment inventory (grouped by category)
- `addBudgetSection(pdf, campData)` - Section 6: Financial summary with tables
- `addRiskSection(pdf, campData)` - Section 7: Risk assessment matrix
- `addCampsiteMapSection(pdf, campData)` - Section 8: Campsite layout
- `addSignaturePage(pdf, campData)` - Final page: Approval signatures
- `addPageNumbers(pdf)` - Footer page numbering

Helper functions:
- `convertCampsiteLayoutToImage(layoutData)` - Render layout to canvas
- `formatDate(date)` - Consistent date formatting
- `formatCurrency(amount, currency)` - Budget formatting
- `getSafePageDimensions()` - A4 portrait margins and dimensions

### 2. Integration with CampPlanner Page
**File:** `src/pages/CampPlanner.jsx`

Add:
- PDF export button in header (next to Save button)
- Loading state during PDF generation
- Toast notification on export success/error
- Call to `generateCampPlan(formData)` when user clicks "Export to PDF"

### 3. Add Default Scout-Connect Branding
- Logo SVG/PNG reference for cover page
- Professional document header styling
- Footer format with page numbers
- Scouting-themed color scheme (if available from your design system)

## Data Flow

```
CampPlanner.jsx (formData)
    ↓
User clicks "Export PDF" button
    ↓
campPdfExport.js::generateCampPlan(formData)
    ↓
Generates PDF sections in order:
  1. Cover Page
  2. Table of Contents
  3. Overview (from formData: title, description, dates, location, leadership)
  4. Participants (from formData.participants[])
  5. Schedule (from formData.schedule[])
  6. Tasks (from formData.tasks[], separated by status)
  7. Equipment (from formData.equipment[], grouped by category)
  8. Budget (from formData.budget.items[] and budget.income[])
  9. Risks (from formData.risks[])
  10. Campsite Map (from formData.campsite_layout[])
  11. Signature Page
    ↓
jsPDF generates A4 portrait multi-page PDF
    ↓
Browser downloads: "CampPlan-[CampName]-[Date].pdf"
```

## Section-by-Section Data Mapping

### Cover Page
- Scout-Connect logo
- Camp title (formData.title)
- Camp theme/type (formData.camp_type)
- Dates (formData.start_date to formData.end_date)
- Location (formData.location)
- Camp director (formData.camp_director)
- Document date (today)

### Section 1: Camp Overview
- Camp name, type, description
- Dates and duration
- Location
- Participants count
- Camp director & emergency contact
- Camp objectives (derived from description + tasks + weather_notes)
- Camp reference number (ID or custom field)
- Camp contingency plan (formData.contingency_plan)

### Section 2: Participants Roster
- Participant table with columns:
  - Name (formData.participants[].name)
  - Age (formData.participants[].age)
  - Gender (formData.participants[].gender)
  - Patrol (formData.participants[].patrol)
  - Role (formData.participants[].role)
  - Emergency Contact (formData.participants[].emergency_contact)
  - Phone (formData.participants[].emergency_phone)
  - Medical Notes (formData.participants[].medical_notes)
- Subtotal: Total participants attending

### Section 3: Camp Schedule
- Chronological timetable by day
- Columns per day:
  - Time (formData.schedule[].activities[].time to end_time)
  - Activity (formData.schedule[].activities[].activity)
  - Location (formData.schedule[].activities[].location)
  - Responsible (formData.schedule[].activities[].responsible)
  - Notes (formData.schedule[].activities[].notes)
- Group activities by day

### Section 4: Preparation Tasks
- Two subsections:
  - **Completed Tasks** (status === 'done')
  - **Pending Tasks** (status !== 'done')
- Columns:
  - Title (formData.tasks[].title)
  - Category (formData.tasks[].category)
  - Assigned To (formData.tasks[].assigned_to)
  - Priority (formData.tasks[].priority)
  - Due Date (formData.tasks[].due_date)
  - Status (formData.tasks[].status)

### Section 5: Equipment Inventory
- Group equipment by category (formData.equipment[].category)
- Per category table with columns:
  - Item Name (formData.equipment[].name)
  - Quantity Needed (formData.equipment[].quantity_needed)
  - Quantity Available (formData.equipment[].quantity_available)
  - Status (formData.equipment[].status)
  - Assigned To (formData.equipment[].assigned_to)
  - Notes (formData.equipment[].notes)
- Flag missing/borrowed items

### Section 6: Budget & Financial Summary
- Summary metrics:
  - Total Income (formData.budget.income[].amount sum)
  - Total Expenses (formData.budget.items[].actual sum)
  - Remaining Balance
  - Cost Per Participant
- Income Table:
  - Source (formData.budget.income[].source)
  - Type (formData.budget.income[].type)
  - Amount (formData.budget.income[].amount)
  - Received Status (formData.budget.income[].received)
- Expenses Table (by category):
  - Item (formData.budget.items[].name)
  - Category (formData.budget.items[].category)
  - Estimated (formData.budget.items[].estimated)
  - Actual (formData.budget.items[].actual)
  - Variance (actual - estimated)
  - Notes (formData.budget.items[].notes)
- Currency display (formData.budget.currency)

### Section 7: Risk Assessment
- Risk Register Matrix (likelihood vs severity):
  - Hazard (formData.risks[].hazard)
  - Severity (formData.risks[].severity)
  - Likelihood (formData.risks[].likelihood)
  - Risk Level (computed: critical/high/medium/low)
  - Mitigation (formData.risks[].mitigation)
  - Responsible Person (formData.risks[].responsible)
  - Status (formData.risks[].status)
- Color-coded risk levels for visual impact

### Section 8: Campsite Map
- Render formData.campsite_layout[] as visual layout:
  - Convert coordinate data to visual representation
  - Use html2canvas to snapshot map from canvas/SVG
  - Include map legend
  - Show tent locations, kitchen, first aid, assembly areas, etc.

### Final Page: Approval Signatures
- Signature blocks for:
  - Camp Chief / Camp Director (formData.camp_director)
  - Unit Leader
  - District Commissioner
- Fields:
  - Name / Title
  - Signature (line for manual signature)
  - Date
- Official stamp area
- Document serial number (camp ID or timestamp)

## Implementation Steps

### Phase 1: Core Setup (files to create/modify)
1. **Create** `src/utils/campPdfExport.js` - Core PDF generation
2. **Modify** `package.json` - Add jspdf-autotable
3. **Modify** `src/pages/CampPlanner.jsx` - Add export button and handler

### Phase 2: Section Implementation (in campPdfExport.js)
1. Implement `generateCampPlan()` main orchestrator
2. Implement `addCoverPage()` - Title page
3. Implement `addTableOfContents()` - Auto TOC
4. Implement `addOverviewSection()` - Camp details
5. Implement `addParticipantsSection()` - Roster table
6. Implement `addScheduleSection()` - Timetable
7. Implement `addTasksSection()` - Task list (completed + pending)
8. Implement `addEquipmentSection()` - Equipment inventory by category
9. Implement `addBudgetSection()` - Financial tables
10. Implement `addRiskSection()` - Risk assessment matrix
11. Implement `addCampsiteMapSection()` - Layout visualization
12. Implement `addSignaturePage()` - Approval signatures
13. Implement `addPageNumbers()` - Footer numbering

### Phase 3: Helper Functions (in campPdfExport.js)
1. `convertCampsiteLayoutToImage()` - Render layout to canvas snapshot
2. `formatDate()` - Consistent formatting
3. `formatCurrency()` - Budget display
4. `getSafePageDimensions()` - A4 margin calculations
5. `getLevelColor()` - Risk level color mapping

### Phase 4: UI Integration (CampPlanner.jsx)
1. Add PDF export button to header
2. Add loading state management
3. Add error handling with user feedback
4. Add success toast notification
5. Format filename: `CampPlan-[CampName]-[Date].pdf`

### Phase 5: Testing & Refinement
1. Test with sample camp data
2. Verify page breaks occur at logical places
3. Test with edge cases:
   - Missing optional fields
   - Very long lists (many participants, many tasks)
   - Special characters in text
   - Large budget amounts
4. Verify print quality and margins
5. Test with different browsers

## Technical Considerations

### Page Dimensions
- A4 Portrait: 210mm × 297mm
- jsPDF default: 210mm width, 297mm height
- Margins: 15mm on all sides
- Usable area: ~180mm × ~267mm

### Table Rendering
- Use autoTable plugin for consistent table layouts
- Auto-adjust column widths based on content
- Handle overflow text with word wrapping
- Color alternate rows for readability

### Image Handling
- Scout-Connect logo: SVG/PNG reference
- Campsite map: html2canvas snapshot of layout visualization
- Store logo path in constants for easy updates

### Data Validation
- Handle missing optional fields gracefully
- Show "N/A" or skip sections if no data exists
- Validate date formats before display
- Handle empty arrays (no participants, no equipment, etc.)

### Browser Compatibility
- Download filename support varies by browser
- Use jsPDF's save() method for cross-browser support
- Test in Chrome, Firefox, Safari, Edge

### Performance
- PDF generation happens client-side (no server load)
- For large camps (1000+ participants), may take 2-3 seconds
- Show loading spinner during generation
- Don't block UI during generation (use setTimeout for chunking if needed)

## Success Criteria

✅ PDF generated from live Supabase data (not screenshots)
✅ All 8 sections present with complete data
✅ Professional A4 portrait format
✅ Automatic page numbering
✅ Table of Contents that links to sections
✅ Proper page breaks between major sections
✅ Financial data formatted with currency
✅ Tasks separated by completion status
✅ Equipment grouped by category
✅ Risk matrix color-coded by severity
✅ Campsite layout visualized
✅ Approval signature page included
✅ File downloaded with timestamp: `CampPlan-[CampName]-YYYY-MM-DD.pdf`
✅ Works for camps with no optional data (graceful degradation)
✅ Fast generation (< 5 seconds for average camp)

## Known Limitations & Future Enhancements

### Current Scope
- One-way export (PDF generation only)
- No PDF editing
- No digital signature capture
- Map as static image from layout data

### Future Enhancements
- Email PDF directly to camp director
- Store PDF copies in Supabase storage
- Add custom branding/logo upload
- Digital signature capture via canvas
- Multiple language support
- Export to other formats (DOCX, Excel)
- Template customization by scout unit

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/utils/campPdfExport.js` | Create | Core PDF generation engine |
| `src/pages/CampPlanner.jsx` | Modify | Add export button & handler |
| `package.json` | Modify | Add jspdf-autotable |
| `.gitignore` | No change | PDFs generated client-side, not stored |

## Estimated Implementation Time
- Phase 1 (Setup): 15 minutes
- Phase 2 (Sections): 2-3 hours
- Phase 3 (Helpers): 30 minutes
- Phase 4 (UI Integration): 20 minutes
- Phase 5 (Testing): 30 minutes
- **Total: ~4 hours**

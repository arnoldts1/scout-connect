import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PDF_WIDTH = 210;
const PDF_HEIGHT = 297;
const MARGIN_TOP = 15;
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const MARGIN_BOTTOM = 15;
const USABLE_WIDTH = PDF_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const USABLE_HEIGHT = PDF_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

const COLORS = {
  primary: '#1e40af',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  lightGray: '#f1f5f9',
  darkGray: '#334155',
  white: '#ffffff'
};

const RISK_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#f59e0b',
  low: '#10b981'
};

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export async function generateCampPlan(campData) {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Initialize page tracking
    pdf.pageCount = 0;
    
    // Add sections in order
    addCoverPage(pdf, campData);
    addTableOfContents(pdf, campData);
    addOverviewSection(pdf, campData);
    addParticipantsSection(pdf, campData);
    addScheduleSection(pdf, campData);
    addTasksSection(pdf, campData);
    addEquipmentSection(pdf, campData);
    addBudgetSection(pdf, campData);
    addRiskSection(pdf, campData);
    addCampsiteMapSection(pdf, campData);
    addSignaturePage(pdf, campData);
    addPageNumbers(pdf);
    
    // Generate filename
    const campName = (campData.title || 'CampPlan').replace(/[^\w\s-]/g, '').slice(0, 30);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `CampPlan-${campName}-${dateStr}.pdf`;
    
    // Download
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

// ============================================================================
// COVER PAGE
// ============================================================================

function addCoverPage(pdf, campData) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Background color
  pdf.setFillColor(30, 64, 175); // primary blue
  pdf.rect(0, 0, pageWidth, pageHeight * 0.4, 'F');
  
  // Logo / Title area
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Scout-Connect', pageWidth / 2, pageHeight * 0.15, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Camp Plan Document', pageWidth / 2, pageHeight * 0.25, { align: 'center' });
  
  // Main content (white area)
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text(campData.title || 'Untitled Camp', pageWidth / 2, pageHeight * 0.5, { align: 'center' });
  
  // Camp details
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  let yPos = pageHeight * 0.6;
  const spacing = 10;
  
  const campType = campData.camp_type ? formatCampType(campData.camp_type) : 'N/A';
  pdf.text(`Type: ${campType}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += spacing;
  const dateRange = `${formatDate(campData.start_date)} to ${formatDate(campData.end_date)}`;
  pdf.text(`Dates: ${dateRange}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += spacing;
  pdf.text(`Location: ${campData.location || 'TBD'}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += spacing;
  pdf.text(`Camp Director: ${campData.camp_director || 'TBD'}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Footer
  yPos = pageHeight - 40;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  pdf.text(`Document ID: ${campData.id?.slice(0, 8) || 'NEW'}`, pageWidth / 2, yPos + 7, { align: 'center' });
  
  pdf.addPage();
  pdf.pageCount = 2;
}

// ============================================================================
// TABLE OF CONTENTS
// ============================================================================

function addTableOfContents(pdf, campData) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = MARGIN_TOP + 10;
  
  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary);
  pdf.text('Table of Contents', MARGIN_LEFT, yPos);
  
  yPos += 15;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const sections = [
    { name: '1. Camp Overview', page: 3 },
    { name: '2. Participant Roster', page: 4 },
    { name: '3. Camp Schedule', page: 5 },
    { name: '4. Preparation Tasks', page: 6 },
    { name: '5. Equipment Inventory', page: 7 },
    { name: '6. Budget & Finances', page: 8 },
    { name: '7. Risk Assessment', page: 9 },
    { name: '8. Campsite Map', page: 10 },
    { name: '9. Approval Signatures', page: 11 }
  ];
  
  sections.forEach(section => {
    pdf.text(section.name, MARGIN_LEFT, yPos);
    pdf.text(section.page.toString(), pageWidth - MARGIN_RIGHT - 5, yPos, { align: 'right' });
    yPos += 8;
  });
  
  pdf.addPage();
  pdf.pageCount = 3;
}

// ============================================================================
// SECTION 1: CAMP OVERVIEW
// ============================================================================

function addOverviewSection(pdf, campData) {
  let yPos = MARGIN_TOP;
  
  // Section title
  addSectionTitle(pdf, '1. Camp Overview', yPos);
  yPos += 15;
  
  // Camp metadata
  const overview = [
    ['Field', 'Value'],
    ['Camp Name', campData.title || 'N/A'],
    ['Camp Type', formatCampType(campData.camp_type) || 'N/A'],
    ['Start Date', formatDate(campData.start_date) || 'N/A'],
    ['End Date', formatDate(campData.end_date) || 'N/A'],
    ['Duration', calculateDuration(campData.start_date, campData.end_date) + ' days'],
    ['Location', campData.location || 'N/A'],
    ['Expected Participants', campData.participants_count || 'N/A'],
    ['Camp Director', campData.camp_director || 'N/A'],
    ['Emergency Contact', campData.emergency_contact || 'N/A']
  ];
  
  autoTable(pdf, {
    startY: yPos,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    head: [overview[0]],
    body: overview.slice(1),
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
    bodyStyles: { textColor: COLORS.darkGray },
    alternateRowStyles: { fillColor: COLORS.lightGray },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: USABLE_WIDTH - 60 } },
    didDrawPage: function(data) {
      yPos = data.lastAutoTable.finalY + 10;
    }
  });
  
  yPos = pdf.lastAutoTable.finalY + 10;
  
  // Description
  if (campData.description) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Description:', MARGIN_LEFT, yPos);
    
    yPos += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const descLines = pdf.splitTextToSize(campData.description, USABLE_WIDTH);
    pdf.text(descLines, MARGIN_LEFT, yPos);
    yPos += descLines.length * 5 + 5;
  }
  
  // Contingency plan
  if (campData.contingency_plan) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Contingency Plan:', MARGIN_LEFT, yPos);
    
    yPos += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const contLines = pdf.splitTextToSize(campData.contingency_plan, USABLE_WIDTH);
    pdf.text(contLines, MARGIN_LEFT, yPos);
  }
  
  pdf.addPage();
  pdf.pageCount += 1;
}

// ============================================================================
// SECTION 2: PARTICIPANTS ROSTER
// ============================================================================

function addParticipantsSection(pdf, campData) {
  let yPos = MARGIN_TOP;
  
  addSectionTitle(pdf, '2. Participant Roster', yPos);
  yPos += 15;
  
  const participants = campData.participants || [];
  
  if (participants.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.text('No participants added yet.', MARGIN_LEFT, yPos);
    pdf.addPage();
    pdf.pageCount += 1;
    return;
  }
  
  const participantData = participants
    .filter(p => p.attending !== false)
    .map(p => [
      p.name || '',
      p.age || '',
      p.gender || '',
      p.patrol || '',
      p.role || '',
      p.emergency_contact || '',
      p.emergency_phone || '',
      p.medical_notes ? 'Yes' : 'No'
    ]);
  
  autoTable(pdf, {
    startY: yPos,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    head: [['Name', 'Age', 'Gender', 'Patrol', 'Role', 'Emergency Contact', 'Phone', 'Medical Info']],
    body: participantData,
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: COLORS.darkGray },
    alternateRowStyles: { fillColor: COLORS.lightGray },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 12 },
      2: { cellWidth: 15 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 30 },
      6: { cellWidth: 20 },
      7: { cellWidth: 15 }
    },
    didDrawPage: function(data) {
      if (data.pageNumber > 1) {
        pdf.pageCount += 1;
      }
    }
  });
  
  const footerY = pdf.lastAutoTable.finalY + 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Total Participants: ${participants.filter(p => p.attending !== false).length}`, MARGIN_LEFT, footerY);
  
  pdf.addPage();
  pdf.pageCount += 1;
}

// ============================================================================
// SECTION 3: CAMP SCHEDULE
// ============================================================================

function addScheduleSection(pdf, campData) {
  let yPos = MARGIN_TOP;
  
  addSectionTitle(pdf, '3. Camp Schedule', yPos);
  yPos += 15;
  
  const schedule = campData.schedule || [];
  
  if (schedule.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.text('No schedule activities added yet.', MARGIN_LEFT, yPos);
    pdf.addPage();
    pdf.pageCount += 1;
    return;
  }
  
  // Group by day
  schedule.forEach((day, dayIndex) => {
    const dayDate = day.date ? formatDate(day.date) : `Day ${day.day || dayIndex + 1}`;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(COLORS.primary);
    pdf.text(`${dayDate}`, MARGIN_LEFT, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 8;
    
    const activities = day.activities || [];
    
    if (activities.length === 0) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.text('No activities scheduled.', MARGIN_LEFT + 5, yPos);
      yPos += 6;
    } else {
      const activityData = activities.map(a => [
        `${a.time || ''} - ${a.end_time || ''}`.trim(),
        a.activity || '',
        a.location || '',
        a.responsible || '',
        a.notes || ''
      ]);
      
      autoTable(pdf, {
        startY: yPos,
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        head: [['Time', 'Activity', 'Location', 'Leader', 'Notes']],
        body: activityData,
        headStyles: { fillColor: COLORS.secondary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: COLORS.darkGray },
        alternateRowStyles: { fillColor: COLORS.lightGray },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 35 }
        },
        didDrawPage: function(data) {
          yPos = data.lastAutoTable.finalY + 5;
        }
      });
      
      yPos = pdf.lastAutoTable.finalY + 8;
    }
    
    // Check if we need a new page
    if (yPos > MARGIN_TOP + USABLE_HEIGHT - 30 && dayIndex < schedule.length - 1) {
      pdf.addPage();
      pdf.pageCount += 1;
      yPos = MARGIN_TOP;
    }
  });
  
  pdf.addPage();
  pdf.pageCount += 1;
}

// ============================================================================
// SECTION 4: PREPARATION TASKS
// ============================================================================

function addTasksSection(pdf, campData) {
  let yPos = MARGIN_TOP;
  
  addSectionTitle(pdf, '4. Preparation Tasks', yPos);
  yPos += 15;
  
  const tasks = campData.tasks || [];
  const completedTasks = tasks.filter(t => t.status === 'done');
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  
  // Pending tasks
  if (pendingTasks.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(COLORS.danger);
    pdf.text('Pending Tasks', MARGIN_LEFT, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 8;
    
    const pendingData = pendingTasks.map(t => [
      t.title || '',
      t.category || '',
      t.assigned_to || '',
      t.priority || '',
      formatDate(t.due_date) || 'N/A',
      t.status || ''
    ]);
    
    autoTable(pdf, {
      startY: yPos,
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      head: [['Task', 'Category', 'Assigned To', 'Priority', 'Due Date', 'Status']],
      body: pendingData,
      headStyles: { fillColor: COLORS.danger, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: COLORS.darkGray },
      alternateRowStyles: { fillColor: COLORS.lightGray },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 }
      },
      didDrawPage: function(data) {
        yPos = data.lastAutoTable.finalY + 10;
      }
    });
    
    yPos = pdf.lastAutoTable.finalY + 10;
  }
  
  // Completed tasks
  if (completedTasks.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(COLORS.success);
    pdf.text('Completed Tasks', MARGIN_LEFT, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 8;
    
    const completedData = completedTasks.map(t => [
      t.title || '',
      t.category || '',
      t.assigned_to || '',
      t.priority || '',
      formatDate(t.due_date) || 'N/A'
    ]);
    
    autoTable(pdf, {
      startY: yPos,
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      head: [['Task', 'Category', 'Assigned To', 'Priority', 'Due Date']],
      body: completedData,
      headStyles: { fillColor: COLORS.success, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: COLORS.darkGray },
      alternateRowStyles: { fillColor: COLORS.lightGray },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 }
      }
    });
    
    yPos = pdf.lastAutoTable.finalY + 10;
  }
  
  if (tasks.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.text('No tasks added yet.', MARGIN_LEFT, yPos);
  }
  
  pdf.addPage();
  pdf.pageCount += 1;
}

// ============================================================================
// SECTION 5: EQUIPMENT INVENTORY
// ============================================================================

function addEquipmentSection(pdf, campData) {
  let yPos = MARGIN_TOP;
  
  addSectionTitle(pdf, '5. Equipment Inventory', yPos);
  yPos += 15;
  
  const equipment = campData.equipment || [];
  
  if (equipment.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.text('No equipment added yet.', MARGIN_LEFT, yPos);
    pdf.addPage();
    pdf.pageCount += 1;
    return;
  }
  
  // Group by category
  const grouped = groupBy(equipment, 'category');
  const categories = Object.keys(grouped).sort();
  
  categories.forEach((category, catIndex) => {
    const items = grouped[category];
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(COLORS.primary);
    pdf.text(`${category || 'Other'}`, MARGIN_LEFT, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 8;
    
    const equipmentData = items.map(e => [
      e.name || '',
      e.quantity_needed ? e.quantity_needed.toString() : '0',
      e.quantity_available ? e.quantity_available.toString() : '0',
      e.status || 'available',
      e.assigned_to || '',
      e.notes || ''
    ]);
    
    autoTable(pdf, {
      startY: yPos,
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      head: [['Item', 'Needed', 'Available', 'Status', 'Assigned To', 'Notes']],
      body: equipmentData,
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: COLORS.darkGray },
      alternateRowStyles: { fillColor: COLORS.lightGray },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
        5: { cellWidth: 25 }
      },
      didDrawPage: function(data) {
        yPos = data.lastAutoTable.finalY + 8;
      }
    });
    
    yPos = pdf.lastAutoTable.finalY + 10;
    
    // Check if we need a new page
    if (yPos > MARGIN_TOP + USABLE_HEIGHT - 40 && catIndex < categories.length - 1) {
      pdf.addPage();
      pdf.pageCount += 1;
      yPos = MARGIN_TOP;
    }
  });
  
  pdf.addPage();
  pdf.pageCount += 1;
}

// ============================================================================
// SECTION 6: BUDGET & FINANCES
// ============================================================================

function addBudgetSection(pdf, campData) {
  let yPos = MARGIN_TOP;
  
  addSectionTitle(pdf, '6. Budget & Finances', yPos);
  yPos += 15;
  
  const budget = campData.budget || { items: [], income: [], currency: 'RWF' };
  const currency = budget.currency || 'RWF';
  
  // Calculate totals
  const totalIncome = (budget.income || []).reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = (budget.items || []).reduce((sum, i) => sum + (i.actual || i.estimated || 0), 0);
  const balance = totalIncome - totalExpenses;
  const costPerPerson = campData.participants_count ? (totalExpenses / campData.participants_count).toFixed(2) : 0;
  
  // Summary box
  const summaryData = [
    ['Total Income', `${formatCurrency(totalIncome, currency)}`],
    ['Total Expenses', `${formatCurrency(totalExpenses, currency)}`],
    ['Remaining Balance', `${formatCurrency(balance, currency)}`],
    ['Cost Per Participant', `${formatCurrency(costPerPerson, currency)}`]
  ];
  
  autoTable(pdf, {
    startY: yPos,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    body: summaryData,
    headStyles: { fillColor: COLORS.primary },
    bodyStyles: { fontSize: 10, textColor: COLORS.darkGray },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold', textColor: COLORS.primary },
      1: { cellWidth: USABLE_WIDTH - 60, fontStyle: 'bold', textColor: balance >= 0 ? COLORS.success : COLORS.danger }
    }
  });
  
  yPos = pdf.lastAutoTable.finalY + 12;
  
  // Income sources
  if (budget.income && budget.income.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Income Sources', MARGIN_LEFT, yPos);
    yPos += 8;
    
    const incomeData = budget.income.map(i => [
      i.source || '',
      i.type || '',
      formatCurrency(i.amount || 0, currency),
      i.received ? 'Received' : 'Pending'
    ]);
    
    autoTable(pdf, {
      startY: yPos,
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      head: [['Source', 'Type', 'Amount', 'Status']],
      body: incomeData,
      headStyles: { fillColor: COLORS.success, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: COLORS.darkGray },
      alternateRowStyles: { fillColor: COLORS.lightGray },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 30 }
      }
    });
    
    yPos = pdf.lastAutoTable.finalY + 12;
  }
  
  // Expenses
  if (budget.items && budget.items.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Expenses', MARGIN_LEFT, yPos);
    yPos += 8;
    
    const expenseData = budget.items.map(i => [
      i.name || '',
      i.category || '',
      formatCurrency(i.estimated || 0, currency),
      formatCurrency(i.actual || 0, currency),
      formatCurrency((i.actual || 0) - (i.estimated || 0), currency),
      i.notes || ''
    ]);
    
    autoTable(pdf, {
      startY: yPos,
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      head: [['Item', 'Category', 'Estimated', 'Actual', 'Variance', 'Notes']],
      body: expenseData,
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: COLORS.darkGray },
      alternateRowStyles: { fillColor: COLORS.lightGray },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 }
      }
    });
  }
  
  pdf.addPage();
  pdf.pageCount += 1;
}

// ============================================================================
// SECTION 7: RISK ASSESSMENT
// ============================================================================

function addRiskSection(pdf, campData) {
  let yPos = MARGIN_TOP;
  
  addSectionTitle(pdf, '7. Risk Assessment', yPos);
  yPos += 15;
  
  const risks = campData.risks || [];
  
  if (risks.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.text('No risks identified.', MARGIN_LEFT, yPos);
    pdf.addPage();
    pdf.pageCount += 1;
    return;
  }
  
  const riskData = risks.map(r => {
    const level = computeRiskLevel(r.likelihood, r.severity);
    return [
      r.hazard || '',
      r.severity || 'low',
      r.likelihood || 'low',
      level,
      r.mitigation || '',
      r.responsible || ''
    ];
  });
  
  autoTable(pdf, {
    startY: yPos,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    head: [['Hazard', 'Severity', 'Likelihood', 'Risk Level', 'Mitigation', 'Responsible']],
    body: riskData,
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: COLORS.darkGray },
    alternateRowStyles: { fillColor: COLORS.lightGray },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 40 },
      5: { cellWidth: 25 }
    },
    didDrawCell: function(data) {
      // Color code risk levels
      if (data.column.index === 3 && data.row.section === 'body') {
        const level = data.cell.text[0];
        let color = RISK_COLORS.low;
        if (level === 'CRITICAL') color = RISK_COLORS.critical;
        else if (level === 'HIGH') color = RISK_COLORS.high;
        else if (level === 'MEDIUM') color = RISK_COLORS.medium;
        
        data.cell.styles.fillColor = color;
        data.cell.styles.textColor = COLORS.white;
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  pdf.addPage();
  pdf.pageCount += 1;
}

// ============================================================================
// SECTION 8: CAMPSITE MAP
// ============================================================================

function addCampsiteMapSection(pdf, campData) {
  let yPos = MARGIN_TOP;
  
  addSectionTitle(pdf, '8. Campsite Map & Layout', yPos);
  yPos += 15;
  
  const layout = campData.campsite_layout || [];
  
  if (layout.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.text('No campsite layout defined yet.', MARGIN_LEFT, yPos);
    pdf.addPage();
    pdf.pageCount += 1;
    return;
  }
  
  // Create a simple text representation of the layout
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  const itemsByType = groupBy(layout, 'type');
  const types = Object.keys(itemsByType).sort();
  
  types.forEach(type => {
    const items = itemsByType[type];
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`${formatItemType(type)}:`, MARGIN_LEFT, yPos);
    yPos += 5;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    items.forEach(item => {
      const coords = item.x && item.y ? ` (${item.x}, ${item.y})` : '';
      const label = item.label ? ` - ${item.label}` : '';
      pdf.text(`  • ${label}${coords}`, MARGIN_LEFT + 5, yPos);
      yPos += 4;
      
      if (yPos > MARGIN_TOP + USABLE_HEIGHT - 20) {
        pdf.addPage();
        pdf.pageCount += 1;
        yPos = MARGIN_TOP;
      }
    });
    
    yPos += 3;
  });
  
  // Legend
  yPos += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Layout Legend:', MARGIN_LEFT, yPos);
  yPos += 5;
  
  const legend = [
    { icon: '⛺', label: 'Tent' },
    { icon: '🔥', label: 'Campfire' },
    { icon: '💧', label: 'Water Source' },
    { icon: '🌳', label: 'Tree' },
    { icon: '📍', label: 'Gathering Area' },
    { icon: '🔱', label: 'Fence' },
    { icon: '⚠️', label: 'Marker' }
  ];
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  legend.forEach(item => {
    pdf.text(`${item.icon} = ${item.label}`, MARGIN_LEFT + 5, yPos);
    yPos += 4;
  });
  
  pdf.addPage();
  pdf.pageCount += 1;
}

// ============================================================================
// SIGNATURE PAGE
// ============================================================================

function addSignaturePage(pdf, campData) {
  let yPos = MARGIN_TOP;
  
  addSectionTitle(pdf, '9. Approval & Signatures', yPos);
  yPos += 15;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  // Camp Chief
  pdf.setFont('helvetica', 'bold');
  pdf.text('Camp Chief / Camp Director:', MARGIN_LEFT, yPos);
  yPos += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.text(campData.camp_director || '_________________', MARGIN_LEFT + 5, yPos);
  yPos += 25;
  pdf.line(MARGIN_LEFT + 5, yPos - 8, MARGIN_LEFT + 50, yPos - 8);
  pdf.text('Signature', MARGIN_LEFT + 5, yPos);
  yPos += 15;
  
  // Unit Leader
  pdf.setFont('helvetica', 'bold');
  pdf.text('Unit Leader:', MARGIN_LEFT, yPos);
  yPos += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.text('_________________', MARGIN_LEFT + 5, yPos);
  yPos += 25;
  pdf.line(MARGIN_LEFT + 5, yPos - 8, MARGIN_LEFT + 50, yPos - 8);
  pdf.text('Signature', MARGIN_LEFT + 5, yPos);
  yPos += 15;
  
  // District Commissioner
  pdf.setFont('helvetica', 'bold');
  pdf.text('District Commissioner:', MARGIN_LEFT, yPos);
  yPos += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.text('_________________', MARGIN_LEFT + 5, yPos);
  yPos += 25;
  pdf.line(MARGIN_LEFT + 5, yPos - 8, MARGIN_LEFT + 50, yPos - 8);
  pdf.text('Signature', MARGIN_LEFT + 5, yPos);
  yPos += 15;
  
  // Date
  yPos += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date: _________________', MARGIN_LEFT, yPos);
  
  // Official stamp area
  yPos += 30;
  pdf.setFontSize(11);
  pdf.setTextColor(COLORS.primary);
  pdf.rect(MARGIN_LEFT, yPos, 60, 35);
  pdf.text('Official', MARGIN_LEFT + 20, yPos + 10, { align: 'center' });
  pdf.text('Stamp', MARGIN_LEFT + 20, yPos + 18, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  
  // Document info
  yPos = pdf.internal.pageSize.getHeight() - 30;
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Document ID: ${campData.id?.slice(0, 8) || 'NEW'}`, MARGIN_LEFT, yPos);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, MARGIN_LEFT, yPos + 5);
  pdf.text(`Status: ${campData.status || 'draft'}`, MARGIN_LEFT, yPos + 10);
}

// ============================================================================
// PAGE NUMBERING
// ============================================================================

function addPageNumbers(pdf) {
  const pageCount = pdf.getNumberOfPages();
  const pageSize = pdf.internal.pageSize;
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageSize.getWidth() / 2,
      pageSize.getHeight() - MARGIN_BOTTOM / 2,
      { align: 'center' }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function addSectionTitle(pdf, title, yPos) {
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(COLORS.primary);
  pdf.text(title, MARGIN_LEFT, yPos);
  pdf.setTextColor(0, 0, 0);
  
  // Underline
  const textWidth = pdf.getTextWidth(title);
  pdf.setDrawColor(COLORS.primary);
  pdf.line(MARGIN_LEFT, yPos + 2, MARGIN_LEFT + textWidth, yPos + 2);
  pdf.setDrawColor(0, 0, 0);
}

function formatDate(date) {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return date;
  }
}

function formatCampType(type) {
  if (!type) return 'General';
  const typeMap = {
    scouting: 'Scouting Camp',
    adventure: 'Adventure Camp',
    training: 'Training Camp',
    jamboree: 'Jamboree',
    summer: 'Summer Camp',
    winter: 'Winter Camp'
  };
  return typeMap[type] || type;
}

function formatCurrency(amount, currency = 'RWF') {
  const num = parseFloat(amount) || 0;
  const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${formatted} ${currency}`;
}

function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
  } catch {
    return 0;
  }
}

function computeRiskLevel(likelihood, severity) {
  const levels = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };
  
  const L = levels[likelihood?.toLowerCase()] || 1;
  const S = levels[severity?.toLowerCase()] || 1;
  const score = L * S;
  
  if (score >= 9) return 'CRITICAL';
  if (score >= 6) return 'HIGH';
  if (score >= 3) return 'MEDIUM';
  return 'LOW';
}

function groupBy(arr, key) {
  return arr.reduce((result, item) => {
    const group = item[key] || 'Other';
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
}

function formatItemType(type) {
  const typeMap = {
    tent: '⛺ Tents',
    campfire: '🔥 Campfires',
    water: '💧 Water Sources',
    tree: '🌳 Trees',
    gathering: '📍 Gathering Areas',
    fence: '🔱 Fences',
    marker: '⚠️ Markers',
    wind: '💨 Wind Indicators'
  };
  return typeMap[type] || type;
}

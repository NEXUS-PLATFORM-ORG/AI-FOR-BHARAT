// Appeals Service - Helper functions for appeal processing

// Calculate appeal deadline with weekend skip logic
export function calculateAppealDeadline(decisionDate, limitationDays) {
  if (!decisionDate || !limitationDays) return null;
  
  const date = new Date(decisionDate);
  date.setDate(date.getDate() + limitationDays);
  
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) date.setDate(date.getDate() - 2); // Sunday -> Friday
  if (dayOfWeek === 6) date.setDate(date.getDate() - 1); // Saturday -> Friday
  
  return date.toISOString().split('T')[0];
}

// Generate appeal checklist based on appeal type and court level
export function generateAppealChecklist(appealType, courtLevel, limitationDays, appealDeadline) {
  const items = [
    {
      item_title: 'Legal Cell review — identify grounds of appeal',
      item_description: 'Analyze judgment and identify strong legal grounds for appeal',
      assigned_to: 'Legal Cell',
      target_days: 3,
      is_mandatory: true
    },
    {
      item_title: 'Obtain certified copy of judgment',
      item_description: 'Request and collect certified copy from court registry',
      assigned_to: 'Filing Department',
      target_days: 5,
      is_mandatory: true
    },
    {
      item_title: 'Brief the Government Pleader / Advocate General',
      item_description: 'Prepare case brief and consult with legal counsel',
      assigned_to: 'Legal Department',
      target_days: 7,
      is_mandatory: true
    },
    {
      item_title: 'Draft appeal petition',
      item_description: 'Prepare complete appeal petition with grounds and prayers',
      assigned_to: 'Advocate / Legal',
      target_days: 20,
      is_mandatory: true
    },
    {
      item_title: 'HOD approval for filing appeal',
      item_description: 'Obtain departmental approval and authorization',
      assigned_to: 'HOD / Principal Secretary',
      target_days: 25,
      is_mandatory: true
    },
    {
      item_title: `FILE APPEAL — before ${appealDeadline || 'deadline'}`,
      item_description: 'File appeal petition in appellate court before limitation expires',
      assigned_to: 'Filing Department',
      target_days: limitationDays - 5,
      is_mandatory: true
    },
    {
      item_title: 'Apply for Stay of Original Order',
      item_description: 'File stay application if immediate execution is directed',
      assigned_to: 'Legal Cell',
      target_days: 3,
      is_mandatory: false
    }
  ];

  return items;
}

// Determine appeal type based on court level
export function determineAppealType(courtLevel) {
  if (!courtLevel) return 'regular_appeal';
  
  const court = courtLevel.toLowerCase();
  if (court.includes('supreme')) return 'review_petition';
  if (court.includes('high')) return 'regular_appeal';
  return 'regular_appeal';
}

// Get limitation days based on court level
export function getLimitationDays(courtLevel) {
  if (!courtLevel) return 90;
  
  const court = courtLevel.toLowerCase();
  if (court.includes('supreme')) return 30; // Review petition
  if (court.includes('high')) return 90; // Regular appeal
  return 90;
}

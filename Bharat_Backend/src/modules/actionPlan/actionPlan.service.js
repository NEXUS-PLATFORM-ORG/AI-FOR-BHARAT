/**
 * Evaluates the extracted data from the judgment and generates an action plan.
 * Follows rule-based mapping:
 * - Dismissal -> No Action
 * - Allowed / Directed -> Compliance Required (generates department tasks)
 * - Timeline extraction is used to establish priority.
 */
export const generateActionPlan = (extractedData) => {
  if (!extractedData) return null;

  const decision = String(extractedData.decision || '').toLowerCase();
  
  let result = {
    status: 'NO_ACTION',
    tasks: [],
    departments_involved: [],
    priority: 'Low',
    summary_directive: 'No mandatory compliance required based on current analysis.'
  };

  // Check if case was dismissed or disposed with no action
  if (decision.includes('dismiss') || decision.includes('no action')) {
    result.summary_directive = 'Case dismissed. Record keeping only.';
    result.tasks.push({
      step: 1,
      description: 'Log dismissal in registry.',
      assigned_to: 'Records Department',
      is_mandatory: false,
      deadline_offset_days: 2
    });
    return result;
  }

  // Check if case was allowed, directed, or compliance required
  if (decision.includes('allow') || decision.includes('directed') || decision.includes('compliance') || decision.includes('comply') || decision.includes('petition is disposed of with the direction')) {
    result.status = 'COMPLIANCE_REQUIRED';
    result.summary_directive = extractedData.required_action || 'Execute compliance steps as directed by the court.';
    
    // Attempt to parse departments based on mentions. (Default to generic if extraction failed).
    const deps = extractedData.departments || ['Legal', 'Administration'];
    result.departments_involved = deps;

    // Define priority based on timeline/deadline
    let days = extractedData.deadline_days || 30;
    if (days <= 14) result.priority = 'High';
    else if (days <= 30) result.priority = 'Medium';
    else result.priority = 'Low';

    result.tasks.push({
      step: 1,
      description: 'Initial review of order directives by Legal Cell.',
      assigned_to: 'Legal',
      is_mandatory: true,
      deadline_offset_days: Math.max(1, Math.floor(days * 0.1))
    });

    result.tasks.push({
      step: 2,
      description: `Draft compliance report for: ${result.summary_directive.substring(0, 50)}...`,
      assigned_to: deps[0] || 'Operations',
      is_mandatory: true,
      deadline_offset_days: Math.max(2, Math.floor(days * 0.5))
    });

    result.tasks.push({
      step: 3,
      description: 'Final submission to the court registry.',
      assigned_to: 'Filing Department',
      is_mandatory: true,
      deadline_offset_days: days
    });
  }

  return result;
};

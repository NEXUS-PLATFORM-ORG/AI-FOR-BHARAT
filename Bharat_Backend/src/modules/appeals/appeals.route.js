import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { 
  calculateAppealDeadline, 
  generateAppealChecklist, 
  determineAppealType,
  getLimitationDays 
} from './appeals.service.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─────────────────────────────────────────────────────────────
// GET /api/v1/appeals/:caseId
// Fetch appeal data for a case
// ─────────────────────────────────────────────────────────────
router.get('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;

    const [
      { data: caseData, error: caseErr },
      { data: actionPlan, error: apErr },
      { data: appeal, error: appealErr },
      { data: checklist, error: checkErr }
    ] = await Promise.all([
      supabase.from('cases').select('*').eq('id', caseId).single(),
      supabase.from('action_plans').select('*').eq('case_id', caseId).maybeSingle(),
      supabase.from('appeals').select('*').eq('case_id', caseId).maybeSingle(),
      supabase.from('appeal_checklist').select('*').eq('case_id', caseId).order('target_days', { ascending: true })
    ]);

    if (caseErr) throw caseErr;

    res.json({
      case: caseData,
      actionPlan: actionPlan || null,
      appeal: appeal || null,
      checklist: checklist || []
    });
  } catch (error) {
    console.error('Appeal Fetch Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/v1/appeals/:caseId/initiate
// Create new appeal record and generate checklist
// ─────────────────────────────────────────────────────────────
router.post('/:caseId/initiate', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { 
      officer, 
      department, 
      appealGrounds, 
      stayApplicationFiled, 
      notes, 
      userId,
      decisionDate,
      courtLevel
    } = req.body;

    if (!officer || !appealGrounds) {
      return res.status(400).json({ error: 'officer and appealGrounds are required' });
    }

    // Determine appeal type and limitation days
    const appealType = determineAppealType(courtLevel);
    const limitationDays = getLimitationDays(courtLevel);
    const calculatedDeadline = calculateAppealDeadline(decisionDate, limitationDays);

    // Create appeal record
    const { data: appealData, error: appealErr } = await supabase
      .from('appeals')
      .insert({
        case_id: caseId,
        appeal_type: appealType,
        appeal_status: 'pending',
        court_level: courtLevel,
        limitation_days: limitationDays,
        decision_date: decisionDate,
        calculated_deadline: calculatedDeadline,
        assigned_officer: officer,
        assigned_department: department,
        appeal_grounds: appealGrounds,
        stay_application_filed: stayApplicationFiled || false,
        notes: notes || null,
        created_by: userId || null
      })
      .select()
      .single();

    if (appealErr) throw appealErr;

    // Generate checklist items
    const checklistItems = generateAppealChecklist(
      appealType, 
      courtLevel, 
      limitationDays, 
      calculatedDeadline
    ).map(item => ({
      ...item,
      appeal_id: appealData.id,
      case_id: caseId,
      source: 'system_generated',
      is_completed: false,
      target_date: item.target_days ? new Date(Date.now() + item.target_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
    }));

    const { error: checkErr } = await supabase
      .from('appeal_checklist')
      .insert(checklistItems);

    if (checkErr) throw checkErr;

    // Audit log
    await supabase.from('appeal_audit_log').insert({
      appeal_id: appealData.id,
      case_id: caseId,
      action_type: 'appeal_initiated',
      performed_by: userId || null,
      new_value: { 
        appeal_type: appealType, 
        calculated_deadline: calculatedDeadline,
        limitation_days: limitationDays
      }
    });

    res.json({ 
      message: 'Appeal initiated successfully', 
      appeal: appealData,
      deadline: calculatedDeadline,
      daysRemaining: Math.ceil((new Date(calculatedDeadline) - new Date()) / (1000 * 60 * 60 * 24))
    });
  } catch (error) {
    console.error('Appeal Initiate Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/appeals/:appealId/status
// Update appeal status
// ─────────────────────────────────────────────────────────────
router.patch('/:appealId/status', async (req, res) => {
  try {
    const { appealId } = req.params;
    const { status, userId, filingDate } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const updateData = { appeal_status: status };
    if (filingDate) updateData.actual_filing_date = filingDate;

    const { error } = await supabase
      .from('appeals')
      .update(updateData)
      .eq('id', appealId);

    if (error) throw error;

    // Audit log
    await supabase.from('appeal_audit_log').insert({
      appeal_id: appealId,
      case_id: req.body.caseId,
      action_type: 'status_changed',
      performed_by: userId || null,
      new_value: { status, filing_date: filingDate }
    });

    res.json({ message: 'Appeal status updated' });
  } catch (error) {
    console.error('Appeal Status Update Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/appeals/checklist/:itemId/complete
// Mark checklist item as completed
// ─────────────────────────────────────────────────────────────
router.patch('/checklist/:itemId/complete', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { userId } = req.body;

    const { error } = await supabase
      .from('appeal_checklist')
      .update({
        is_completed: true,
        completed_by: userId || null,
        completed_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (error) throw error;

    res.json({ message: 'Item marked as completed' });
  } catch (error) {
    console.error('Checklist Update Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/v1/appeals/:appealId/checklist
// Add manual checklist item
// ─────────────────────────────────────────────────────────────
router.post('/:appealId/checklist', async (req, res) => {
  try {
    const { appealId } = req.params;
    const { caseId, title, assignedTo, targetDays } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const { error } = await supabase.from('appeal_checklist').insert({
      appeal_id: appealId,
      case_id: caseId,
      item_title: title,
      assigned_to: assignedTo || null,
      target_days: targetDays || null,
      source: 'manual',
      is_mandatory: false,
      is_completed: false
    });

    if (error) throw error;

    res.json({ message: 'Item added successfully' });
  } catch (error) {
    console.error('Add Item Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/v1/appeals/:appealId/stay
// Record stay application filing
// ─────────────────────────────────────────────────────────────
router.post('/:appealId/stay', async (req, res) => {
  try {
    const { appealId } = req.params;
    const { caseId, stayGranted, stayOrderDate, userId } = req.body;

    const { error } = await supabase
      .from('appeals')
      .update({
        stay_application_filed: true,
        stay_granted: stayGranted || false,
        stay_order_date: stayOrderDate || null
      })
      .eq('id', appealId);

    if (error) throw error;

    // Audit log
    await supabase.from('appeal_audit_log').insert({
      appeal_id: appealId,
      case_id: caseId,
      action_type: stayGranted ? 'stay_granted' : 'stay_filed',
      performed_by: userId || null,
      new_value: { stay_granted: stayGranted, stay_order_date: stayOrderDate }
    });

    res.json({ message: 'Stay application recorded' });
  } catch (error) {
    console.error('Stay Application Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

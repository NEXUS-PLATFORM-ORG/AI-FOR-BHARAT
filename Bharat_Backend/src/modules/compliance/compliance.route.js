import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─────────────────────────────────────────────────────────────
// GET /api/v1/compliance/:caseId
// Fetch case, action_plan, and checklist for a case
// ─────────────────────────────────────────────────────────────
router.get('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;

    const [{ data: caseData, error: caseErr }, { data: actionPlan, error: apErr }, { data: checklist, error: checkErr }] = await Promise.all([
      supabase.from('cases').select('*').eq('id', caseId).single(),
      supabase.from('action_plans').select('*').eq('case_id', caseId).maybeSingle(),
      supabase.from('compliance_checklist').select('*').eq('case_id', caseId).order('target_days', { ascending: true })
    ]);

    if (caseErr) throw caseErr;

    res.json({
      case: caseData,
      actionPlan: actionPlan || null,
      checklist: checklist || []
    });
  } catch (error) {
    console.error('Compliance Fetch Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/v1/compliance/:caseId/decision
// Submit compliance decision and generate checklist
// ─────────────────────────────────────────────────────────────
router.post('/:caseId/decision', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { decision, officer, deadline, notes, userId, checklistItems, appealDeadline, actionType } = req.body;

    if (!decision || !officer || !deadline) {
      return res.status(400).json({ error: 'decision, officer, and deadline are required' });
    }

    // Update cases table
    const { error: caseErr } = await supabase
      .from('cases')
      .update({
        compliance_decision: decision,
        compliance_status: 'in_progress',
        assigned_officer: officer,
        compliance_deadline: deadline,
        compliance_notes: notes || null,
        decided_by: userId || null,
        decided_at: new Date().toISOString()
      })
      .eq('id', caseId);

    if (caseErr) throw caseErr;

    // Insert checklist items
    if (checklistItems && checklistItems.length > 0) {
      const { error: checkErr } = await supabase
        .from('compliance_checklist')
        .insert(checklistItems);
      if (checkErr) throw checkErr;
    }

    // Insert audit log
    await supabase.from('compliance_audit_log').insert({
      case_id: caseId,
      action_type: actionType || 'decision_made',
      performed_by: userId || null,
      performed_at: new Date().toISOString(),
      new_value: decision === 'appeal' 
        ? { decision, officer, deadline, appeal_deadline: appealDeadline }
        : { decision, officer, deadline }
    });

    res.json({ message: 'Decision recorded successfully' });
  } catch (error) {
    console.error('Decision Submit Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/compliance/checklist/:itemId/complete
// Mark a checklist item as completed
// ─────────────────────────────────────────────────────────────
router.patch('/checklist/:itemId/complete', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { userId } = req.body;

    const { error } = await supabase
      .from('compliance_checklist')
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
// POST /api/v1/compliance/:caseId/checklist
// Add a manual checklist item
// ─────────────────────────────────────────────────────────────
router.post('/:caseId/checklist', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { title, assignedTo, targetDays } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const { error } = await supabase.from('compliance_checklist').insert({
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

export default router;

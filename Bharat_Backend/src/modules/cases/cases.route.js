import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { extractFromText } from '../../../aifeature/index.js';
import { generateActionPlan } from '../actionPlan/actionPlan.service.js';
import { notifyAllUsers } from '../notifications/notification.service.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParseLib = require('pdf-parse');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Use service role key so writes bypass RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = process.env.SUPABASE_BUCKET_NAME || 'uploads';

// ─────────────────────────────────────────────────────────────
// GET /api/v1/cases  —  fetch all cases from Supabase DB
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*, extractions(extracted_json)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map `extractions.extracted_json` back to `extracted_data` so frontend doesn't break
    const mappedCases = data.map(caseItem => ({
      ...caseItem,
      extracted_data: caseItem.extractions && caseItem.extractions.length > 0 
        ? caseItem.extractions[0].extracted_json 
        : caseItem.extracted_data
    }));

    const today = new Date();
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const todayStr = today.toISOString();
    const next7DaysStr = next7Days.toISOString();
    const next14DaysStr = next14Days.toISOString();

    const { data: next7DaysCases, error: next7DaysError } = await supabase
      .from('cases')
      .select('case_id, department, deadline')
      .gt('deadline', todayStr)
      .lte('deadline', next7DaysStr)
      .order('deadline', { ascending: true });

    if (next7DaysError) throw next7DaysError;

    const { data: next14DaysCases, error: next14DaysError } = await supabase
      .from('cases')
      .select('case_id, department, deadline')
      .gt('deadline', next7DaysStr)
      .lte('deadline', next14DaysStr)
      .order('deadline', { ascending: true });

    if (next14DaysError) throw next14DaysError;

    res.json({ 
      cases: mappedCases,
      next7Days: next7DaysCases || [],
      next14Days: next14DaysCases || []
    });
  } catch (error) {
    console.error('Fetch Cases Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/v1/cases/upload
//   1. Upload PDF to Supabase Storage
//   2. Insert a row into the `cases` table with file metadata
// ─────────────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Build a unique storage path
    const fileName = `${Date.now()}_${file.originalname}`;

    // 1️⃣  Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (storageError) throw storageError;

    // 2️⃣  Build the public / signed URL for reference
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    const fileUrl = urlData?.publicUrl || '';

    // 2.5️⃣ Extract text and process with AI
    let aiResult = {};
    try {
      if (file.mimetype === 'application/pdf') {
        let pdfText = '';
        
        if (typeof pdfParseLib === 'function') {
          const parsedPdf = await pdfParseLib(file.buffer);
          pdfText = parsedPdf.text;
        } else if (pdfParseLib && pdfParseLib.PDFParse) {
          const parser = new pdfParseLib.PDFParse({ data: file.buffer });
          const result = await parser.getText();
          pdfText = result.text;
        }

        aiResult = await extractFromText(pdfText) || {};
        
        const extractionPayload = aiResult.extracted_data || aiResult;
        
        // Generate Action Plan out of extracted data
        const actionPlan = generateActionPlan(extractionPayload);
        if (actionPlan) {
          if (aiResult.extracted_data) {
            aiResult.extracted_data.action_plan = actionPlan;
          } else {
            aiResult.action_plan = actionPlan;
          }
        }
      }
    } catch (aiError) {
      console.error('AI Extraction Error:', aiError);
      // Fallback to existing logic if AI fails
    }

    // 3️⃣  Pull optional metadata from request body
    const {
      case_id,
      case_number,
      department,
      court,
      judge,
      decision_date,
      deadline,
      petitioner,
      priority,
      status,
    } = req.body;

    // 4️⃣  Insert into `cases` table
    const { data: caseRow, error: dbError } = await supabase
      .from('cases')
      .insert([
        {
          case_id:       aiResult.case_id || case_id     || `CAS-${Date.now()}`,
          case_number:   aiResult.case_number || case_number || null,
          department:    aiResult.department || department  || 'General',
          court:         aiResult.court || court       || 'High Court',
          judge:         aiResult.judge || judge       || null,
          decision_date: aiResult.decision_date || decision_date || null,
          deadline:      aiResult.deadline || deadline    || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          petitioner:    aiResult.petitioner || petitioner  || null,
          priority:      aiResult.priority || priority    || 'Medium',
          status:        status      || 'PENDING REVIEW',
          file_path:     fileName,
          file_url:      fileUrl
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // 5️⃣  Insert into `extractions` table
    const { error: extractionError } = await supabase
      .from('extractions')
      .insert([
        {
          case_id: caseRow.id,
          extracted_json: aiResult
        }
      ]);

    if (extractionError) {
      console.error('Failed to save to extractions table:', extractionError);
    }

    // 6️⃣ Insert Action Plan into separate structured tables (if exists)
    const actionPlanData = aiResult?.extracted_data?.action_plan || aiResult?.action_plan;
    // Also pull AI-level fields for the new compliance columns
    const aiExtracted = aiResult?.extracted_data || {};
    if (actionPlanData) {
      const { data: apRow, error: apError } = await supabase
        .from('action_plans')
        .insert([{
          case_id: caseRow.id,
          // --- existing columns (keep as-is) ---
          status:               actionPlanData.status || 'NO_ACTION',
          priority:             actionPlanData.priority || 'Low',
          summary_directive:    actionPlanData.summary_directive || '',
          departments_involved: actionPlanData.departments_involved || [],
          // --- new columns for CompliancePage ---
          directive_summary:    actionPlanData.summary_directive || aiExtracted.primary_directive || '',
          system_decision:      aiExtracted.decision || actionPlanData.status || null,
          confidence_score:     aiExtracted.risk_score || null,
          limitation_days:      aiExtracted.deadline_days || null
        }])
        .select()
        .single();
        
      if (!apError && apRow && actionPlanData.tasks && actionPlanData.tasks.length > 0) {
        const tasksToInsert = actionPlanData.tasks.map(task => ({
          action_plan_id: apRow.id,
          step: task.step,
          description: task.description,
          assigned_to: task.assigned_to,
          is_mandatory: task.is_mandatory,
          deadline_offset_days: task.deadline_offset_days
        }));
        
        await supabase.from('action_plan_tasks').insert(tasksToInsert);
      }
    }

    // Attach to the response case row so frontend updates immediately
    caseRow.extracted_data = aiResult;

    // 🔔 Notify all reviewers and admins about the new case
    notifyAllUsers({
      title: 'New Case Uploaded',
      message: `Case ${caseRow.case_id} has been uploaded and is pending review.`,
      type: 'case_created',
      case_id: caseRow.id,
      role: ['reviewer', 'admin'],
    }).catch(err => console.error('Notification error:', err));

    res.status(200).json({
      message: 'Upload successful',
      fileName,
      case: caseRow,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/v1/cases/:id/signed-url
//   Returns a 1-hour signed URL for the PDF stored in Supabase Storage
// ─────────────────────────────────────────────────────────────
router.get('/:id/signed-url', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the case row to get file_path
    const { data: caseItem, error: fetchError } = await supabase
      .from('cases')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError || !caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (!caseItem.file_path) {
      return res.status(404).json({ error: 'No file attached to this case' });
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(caseItem.file_path, 60 * 60); // 1 hour

    if (error) throw error;

    res.json({ signedUrl: data.signedUrl });
  } catch (error) {
    console.error('Signed URL Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/cases/:id/status
// ─────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'status is required' });

    const { data, error } = await supabase
      .from('cases')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 🔔 Notify all reviewers and admins about the status change
    notifyAllUsers({
      title: `Case ${status}`,
      message: `Case has been ${status.toLowerCase()}. Status updated.`,
      type: 'status_change',
      case_id: id,
      role: ['reviewer', 'admin'],
    }).catch(err => console.error('Notification error:', err));

    res.json({ message: 'Status updated', case: data });
  } catch (error) {
    console.error('Status Update Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/cases/:id/action-plan
//   Upserts the action_plan and replaces action_plan_tasks
// ─────────────────────────────────────────────────────────────
router.patch('/:id/action-plan', async (req, res) => {
  try {
    const { id } = req.params;
    const { summary_directive, priority, status, departments_involved, tasks } = req.body;

    // 1. Upsert action_plan row for this case
    const { data: existingPlan } = await supabase
      .from('action_plans')
      .select('id')
      .eq('case_id', id)
      .maybeSingle();

    let planId;

    if (existingPlan) {
      const { data: updatedPlan, error: updateError } = await supabase
        .from('action_plans')
        .update({
          summary_directive,
          priority: priority || 'Low',
          status: status || 'COMPLIANCE_REQUIRED',
          departments_involved: departments_involved || [],
        })
        .eq('case_id', id)
        .select('id')
        .single();
      if (updateError) throw updateError;
      planId = updatedPlan.id;
    } else {
      const { data: newPlan, error: insertError } = await supabase
        .from('action_plans')
        .insert([{
          case_id: id,
          summary_directive,
          priority: priority || 'Low',
          status: status || 'COMPLIANCE_REQUIRED',
          departments_involved: departments_involved || [],
        }])
        .select('id')
        .single();
      if (insertError) throw insertError;
      planId = newPlan.id;
    }

    // 2. Replace tasks: delete old, insert new
    if (tasks && Array.isArray(tasks)) {
      await supabase.from('action_plan_tasks').delete().eq('action_plan_id', planId);
      if (tasks.length > 0) {
        const tasksToInsert = tasks.map((t, idx) => ({
          action_plan_id: planId,
          step: t.step || idx + 1,
          description: t.description,
          assigned_to: t.assigned_to,
          is_mandatory: t.is_mandatory !== undefined ? t.is_mandatory : true,
          deadline_offset_days: t.deadline_offset_days || 0,
        }));
        const { error: tasksError } = await supabase.from('action_plan_tasks').insert(tasksToInsert);
        if (tasksError) throw tasksError;
      }
    }

    res.json({ message: 'Action plan updated successfully' });
  } catch (error) {
    console.error('Action Plan Update Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

import supabase from '../../config/supabaseAdmin.js';
import { createRequire } from 'module';
import crypto from 'crypto';

const require = createRequire(import.meta.url);
let pdfParse;
try {
  const mod = require('pdf-parse');
  pdfParse = typeof mod === 'function' ? mod : mod.default;
} catch (e) {
  console.warn('pdf-parse not available, PDF text extraction will be skipped');
  pdfParse = null;
}

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'uploads';

// Ensure the bucket is public on startup
(async () => {
  try {
    const { error } = await supabase.storage.updateBucket(BUCKET_NAME, { public: true });
    if (error) console.warn('Bucket config warning:', error.message);
    else console.log(`Storage bucket "${BUCKET_NAME}" configured as public.`);
  } catch (e) {
    console.warn('Could not configure bucket:', e.message);
  }
})();

// ─── Heuristic PDF text extraction ──────────────────────────────
const extractDataFromText = (text) => {
  const data = {
    case_id: 'UNKNOWN',
    department: 'General',
    court: 'Unknown Court',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    priority: 'Medium',
    status: 'PENDING REVIEW',
    extracted_data: {}
  };

  const petitionMatch = text.match(/PETITION NO\.?\s*([A-Za-z0-9\/\- ]+)/i);
  if (petitionMatch) data.case_id = petitionMatch[1].trim();

  if (text.match(/High Court/i)) data.court = 'High Court';
  else if (text.match(/Supreme Court/i)) data.court = 'Supreme Court';
  else if (text.match(/District Court/i)) data.court = 'District Court';

  if (text.match(/Compliance/i) || text.match(/Audit/i)) data.department = 'Compliance & Digital Audit Bureau';
  else if (text.match(/Criminal/i)) data.department = 'Criminal';
  else if (text.match(/Civil/i)) data.department = 'Civil';

  if (text.match(/urgent/i) || text.match(/immediate/i)) data.priority = 'High';
  else if (text.match(/low priority/i)) data.priority = 'Low';

  const deadlineMatch = text.match(/DEADLINE FOR SUBMISSION:\s*(.+)/i) || text.match(/DEADLINE:\s*(.+)/i);
  if (deadlineMatch) {
    const parsedDate = new Date(deadlineMatch[1].trim());
    if (!isNaN(parsedDate)) data.deadline = parsedDate;
  }

  data.extracted_data.raw_text_snippet = text.substring(0, 1000);
  return data;
};

// ─── Upload, parse, save ────────────────────────────────────────
const processAndSaveCase = async (file) => {
  // 1. Upload to Supabase Storage
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  // 2. Get public URL
  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
  const fileUrl = publicUrlData.publicUrl;

  // 3. Extract text from PDF
  let text = '';
  if (pdfParse) {
    try {
      const pdfData = await pdfParse(file.buffer);
      text = pdfData.text;
    } catch (err) {
      console.error('PDF parsing error:', err.message);
    }
  }

  // 4. Run extraction heuristics
  const extracted = extractDataFromText(text);

  // 5. Insert into DB
  const { data: insertData, error: insertError } = await supabase
    .from('cases')
    .insert([{
      case_id: extracted.case_id,
      department: extracted.department,
      court: extracted.court,
      deadline: extracted.deadline,
      priority: extracted.priority,
      status: extracted.status,
      file_url: fileUrl,
      file_path: fileName,
      extracted_data: extracted.extracted_data
    }])
    .select()
    .single();

  if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);
  return insertData;
};

// ─── Get all cases ──────────────────────────────────────────────
const getAllCases = async () => {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch cases: ${error.message}`);
  return data;
};

// ─── Update case status ─────────────────────────────────────────
const updateCaseStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('cases')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update status: ${error.message}`);
  return data;
};

// ─── Get signed URL for PDF preview ─────────────────────────────
const getSignedUrl = async (filePath) => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 60 * 60);

  if (error) throw new Error(`Failed to generate signed URL: ${error.message}`);
  return data.signedUrl;
};

export default {
  processAndSaveCase,
  getAllCases,
  updateCaseStatus,
  getSignedUrl
};

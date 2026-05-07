import casesService from './cases.service.js';

const uploadCase = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are accepted.' });
    }
    const newCase = await casesService.processAndSaveCase(req.file);
    return res.status(201).json({ message: 'Case processed successfully', case: newCase });
  } catch (error) {
    console.error('Error in uploadCase:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

const getAllCases = async (req, res) => {
  try {
    const cases = await casesService.getAllCases();
    return res.status(200).json({ cases });
  } catch (error) {
    console.error('Error in getAllCases:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

const updateCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required.' });

    const validStatuses = ['PENDING REVIEW', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updatedCase = await casesService.updateCaseStatus(id, status);
    return res.status(200).json({ message: 'Status updated', case: updatedCase });
  } catch (error) {
    console.error('Error in updateCaseStatus:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

const getSignedUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const cases = await casesService.getAllCases();
    const c = cases.find(x => x.id === id);
    if (!c) return res.status(404).json({ error: 'Case not found.' });
    const signedUrl = await casesService.getSignedUrl(c.file_path);
    return res.status(200).json({ signedUrl });
  } catch (error) {
    console.error('Error in getSignedUrl:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  uploadCase,
  getAllCases,
  updateCaseStatus,
  getSignedUrl
};

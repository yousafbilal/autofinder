const express = require('express');
const router = express.Router();
const InspectionJob = require('../models/InspectionJob');
const InspectionChecklist = require('../models/InspectionChecklist');

// Middleware to check admin authentication (will be passed from main app)
// For now, we'll handle auth in the main app, but we can add it here if needed

// Create inspection request
router.post('/request', async (req, res) => {
  try {
    const { modelName, adId, sellerId } = req.body;
    if (!modelName || !adId) return res.status(400).json({ message: 'modelName and adId are required' });

    const job = await InspectionJob.create({
      adRef: { modelName, adId },
      sellerId: sellerId || undefined,
    });

    return res.status(201).json(job);
  } catch (e) {
    console.error('Create inspection request error:', e);
    return res.status(500).json({ message: 'Failed to create inspection request' });
  }
});

// List inspections with basic filters
router.get('/', async (req, res) => {
  try {
    const { status, modelName, page = 1, limit = 20 } = req.query;
    const q = {};
    if (status) q.status = status;
    if (modelName) q['adRef.modelName'] = modelName;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      InspectionJob.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      InspectionJob.countDocuments(q),
    ]);
    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) {
    console.error('List inspections error:', e);
    res.status(500).json({ message: 'Failed to list inspections' });
  }
});

// Submit inspection (approve for MVP)
router.post('/:jobId/approve', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { summary = {}, scores = {} } = req.body || {};
    const job = await InspectionJob.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    job.summary = {
      verdict: summary.verdict || job.summary?.verdict || '',
      highlights: summary.highlights || job.summary?.highlights || [],
      issues: summary.issues || job.summary?.issues || [],
    };
    job.scores = {
      byCategory: scores.byCategory || job.scores?.byCategory || {},
      overall: typeof scores.overall === 'number' ? scores.overall : job.scores?.overall || 0,
    };
    job.status = 'Approved';
    await job.save();
    return res.json(job);
  } catch (e) {
    console.error('Approve inspection error:', e);
    return res.status(500).json({ message: 'Failed to approve inspection' });
  }
});

// Latest checklist
router.get('/checklist/latest', async (_req, res) => {
  try {
    const latest = await InspectionChecklist.findOne({ active: true }).sort({ version: -1 });
    if (!latest) return res.status(404).json({ message: 'No checklist found' });
    res.json(latest);
  } catch (e) {
    console.error('Get checklist error:', e);
    res.status(500).json({ message: 'Failed to fetch checklist' });
  }
});

// Public summary by ad
router.get('/public', async (req, res) => {
  try {
    const { modelName, adId } = req.query;
    if (!modelName || !adId) return res.status(400).json({ message: 'modelName and adId are required' });

    const job = await InspectionJob.findOne({ 'adRef.modelName': modelName, 'adRef.adId': adId, status: 'Approved' })
      .select('scores summary pdf updatedAt');
    if (!job) return res.status(404).json({ message: 'No approved inspection found' });

    return res.json({
      score: job.scores?.overall || 0,
      verdict: job.summary?.verdict || 'N/A',
      updatedAt: job.updatedAt,
      pdfUrl: job.pdf?.url || '',
    });
  } catch (e) {
    console.error('Get public inspection error:', e);
    return res.status(500).json({ message: 'Failed to fetch inspection summary' });
  }
});

// Start inspection (inspector accepts)
router.post('/:inspectionId/start', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const job = await InspectionJob.findById(inspectionId);
    if (!job) return res.status(404).json({ message: 'Inspection not found' });
    
    job.status = 'in_progress';
    job.inspectedAt = new Date();
    await job.save();
    
    return res.json({ status: job.status });
  } catch (e) {
    console.error('Start inspection error:', e);
    return res.status(500).json({ message: 'Failed to start inspection' });
  }
});

// Submit inspection (submit filled checklist)
router.post('/:inspectionId/submit', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { checklist, photosMeta, signatureUrl, notes, inspectorId } = req.body;
    
    const job = await InspectionJob.findById(inspectionId);
    if (!job) return res.status(404).json({ message: 'Inspection not found' });
    
    // Update job with submitted data
    if (checklist) {
      job.detailed_checklist = checklist;
    }
    if (photosMeta && Array.isArray(photosMeta)) {
      job.photos = photosMeta.map(photo => ({
        url: photo.url,
        caption: photo.caption || '',
        geotag: photo.lat && photo.lon ? `${photo.lat},${photo.lon}` : '',
        timestamp: photo.timestamp ? new Date(photo.timestamp) : new Date()
      }));
    }
    if (signatureUrl) {
      job.signatureUrl = signatureUrl;
    }
    if (notes) {
      job.inspectorNotes = notes;
    }
    if (inspectorId) {
      job.inspectorId = inspectorId;
    }
    
    job.status = 'submitted';
    job.completedDate = new Date();
    await job.save();
    
    return res.json({ inspectionId: job._id.toString() });
  } catch (e) {
    console.error('Submit inspection error:', e);
    return res.status(500).json({ message: 'Failed to submit inspection' });
  }
});

// Get inspection by ID (public read if approved)
router.get('/:inspectionId', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const job = await InspectionJob.findById(inspectionId)
      .populate('inspectorId', 'name email phone')
      .populate('sellerId', 'name email phone')
      .lean();
    
    if (!job) return res.status(404).json({ message: 'Inspection not found' });
    
    // Only return approved inspections publicly
    if (job.status !== 'Approved' && job.status !== 'approved') {
      return res.status(403).json({ message: 'Inspection not approved yet' });
    }
    
    return res.json(job);
  } catch (e) {
    console.error('Get inspection error:', e);
    return res.status(500).json({ message: 'Failed to fetch inspection' });
  }
});

// Get upload URL (presigned URL for photos)
router.post('/:inspectionId/upload-url', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { filename, contentType } = req.body;
    
    if (!filename || !contentType) {
      return res.status(400).json({ message: 'filename and contentType are required' });
    }
    
    // For now, return a simple URL structure
    // In production, you'd generate a presigned URL from S3 or similar
    const fileUrl = `/uploads/inspections/${inspectionId}/${Date.now()}-${filename}`;
    const uploadUrl = fileUrl; // Same as fileUrl for now
    
    return res.json({ uploadUrl, fileUrl });
  } catch (e) {
    console.error('Get upload URL error:', e);
    return res.status(500).json({ message: 'Failed to generate upload URL' });
  }
});

// Confirm photo metadata
router.post('/:inspectionId/photos/confirm', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { url, itemId, lat, lon, timestamp, providedTimestamp } = req.body;
    
    const job = await InspectionJob.findById(inspectionId);
    if (!job) return res.status(404).json({ message: 'Inspection not found' });
    
    // Add photo metadata to job
    if (!job.photos) job.photos = [];
    job.photos.push({
      url: url,
      caption: itemId || '',
      geotag: lat && lon ? `${lat},${lon}` : '',
      timestamp: timestamp ? new Date(timestamp) : (providedTimestamp ? new Date(providedTimestamp) : new Date())
    });
    
    await job.save();
    
    return res.json({ ok: true });
  } catch (e) {
    console.error('Confirm photo metadata error:', e);
    return res.status(500).json({ message: 'Failed to confirm photo metadata' });
  }
});

module.exports = router;



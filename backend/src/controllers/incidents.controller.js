import Incident from '../models/Incident.js';

/**
 * List incidents for the authenticated user with filtering and pagination.
 */
export const listIncidents = async (req, res, next) => {
  try {
    const filter = { user: req.user.id };

    if (req.query.status && ['open', 'resolved'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (req.query.monitorId) {
      filter.monitor = req.query.monitorId;
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .populate('monitor', 'name url method')
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit),
      Incident.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        incidents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single incident by ID.
 */
export const getIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('monitor', 'name url method status');

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        incident
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually resolve an open incident.
 */
export const resolveIncidentManual = async (req, res, next) => {
  try {
    const incident = await Incident.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    if (incident.status === 'resolved') {
      return res.status(400).json({
        success: false,
        error: 'Incident is already resolved'
      });
    }

    const now = new Date();
    incident.status = 'resolved';
    incident.resolvedAt = now;
    incident.resolvedBy = 'manual';
    incident.duration = Math.max(0, now.getTime() - new Date(incident.startedAt).getTime());

    await incident.save();

    return res.status(200).json({
      success: true,
      message: 'Incident marked as resolved',
      data: {
        incident
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listIncidents,
  getIncident,
  resolveIncidentManual
};

// `incidentReports` collection model — see README section 4. Implemented in Phase 1
// (Database & Models).

const mongoose = require('mongoose');
const geoPointSchema = require('./shared/geoPoint');
const { SEVERITY, REPORT_STATUS } = require('../config/constants');

const incidentReportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: geoPointSchema, required: true },
    photoUrl: { type: String, required: true },
    capturedAt: { type: Date, required: true },
    aiCredibilityScore: { type: Number, min: 0, max: 100, default: null },
    aiSeverityEstimate: { type: String, enum: SEVERITY, default: null },
    status: { type: String, enum: REPORT_STATUS, default: 'PENDING' },
    finalSeverity: { type: String, enum: SEVERITY, default: null },
    assignedStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedPoliceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

incidentReportSchema.index({ location: '2dsphere' });
incidentReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('IncidentReport', incidentReportSchema);

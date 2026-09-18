// Reusable GeoJSON Point sub-schema — see README section 4.
// coordinates is [longitude, latitude], per the GeoJSON spec.

const { Schema } = require('mongoose');

const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false }
);

module.exports = geoPointSchema;

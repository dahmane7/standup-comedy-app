import mongoose, { Schema, Document, Types } from 'mongoose';
import { Location, EventRequirements } from '../types';

export interface EventDocument extends Document {
  title: string;
  description: string;
  date: Date;
  location: Location;
  organizer: Types.ObjectId;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  requirements: EventRequirements;
  applications: Types.ObjectId[];
  participants: Types.ObjectId[];
  startTime?: string;
  endTime?: string;
  modifiedByOrganizer?: boolean;
}

const locationSchema = new Schema<Location>({
  venue: { type: String, required: false },
  address: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true }
});

const requirementsSchema = new Schema<EventRequirements>({
  minExperience: { type: Number, required: true },
  maxPerformers: { type: Number, required: false },
  duration: { type: Number, required: true }
});

const eventSchema = new Schema<EventDocument>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: locationSchema,
    required: true
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  requirements: {
    type: requirementsSchema,
    required: true
  },
  applications: [{
    type: Schema.Types.ObjectId,
    ref: 'Application'
  }],
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  startTime: {
    type: String,
    required: false
  },
  endTime: {
    type: String,
    required: false
  },
  modifiedByOrganizer: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances des requêtes
eventSchema.index({ date: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1 });

export const EventModel = mongoose.model<EventDocument>('Event', eventSchema); 
import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import { connectMongo } from './mongodb';

declare global {
  var __CaseModel: Model<ICase> | null;
  var __AlertModel: Model<IAlert> | null;
  var __IocModel: Model<IIoc> | null;
  var __TimelineEventModel: Model<ITimelineEvent> | null;
  var __UebaEventModel: Model<IUebaEvent> | null;
}

export interface ICase extends Document {
  org_id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  description?: string;
  created_by?: string;
  assigned_to?: string;
  alert_ids?: string[];
  created_at: Date;
  updated_at: Date;
}

const caseSchema = new Schema<ICase>({
  org_id: { type: String, required: true, index: true },
  title: { type: String, required: true },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
  status: { type: String, enum: ['open', 'investigating', 'resolved', 'closed'], required: true },
  description: { type: String },
  created_by: { type: String },
  assigned_to: { type: String },
  alert_ids: [{ type: String }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

caseSchema.index({ org_id: 1, created_at: -1 });
caseSchema.index({ created_at: -1 });

export interface IAlert extends Document {
  org_id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'triaged' | 'escalated' | 'resolved';
  source?: string;
  raw_data?: Types.Buffer;
  mitre_tactics?: string[];
  created_at: Date;
}

const alertSchema = new Schema<IAlert>({
  org_id: { type: String, required: true, index: true },
  title: { type: String, required: true },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
  status: { type: String, enum: ['new', 'triaged', 'escalated', 'resolved'], required: true },
  source: { type: String },
  raw_data: { type: Schema.Types.Mixed },
  mitre_tactics: [{ type: String }],
  created_at: { type: Date, default: Date.now },
});

alertSchema.index({ org_id: 1, created_at: -1 });
alertSchema.index({ created_at: -1 });

export interface IIoc extends Document {
  org_id: string;
  type: 'ip' | 'domain' | 'hash' | 'email' | 'url';
  value: string;
  threat_level?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source?: string;
  flagged_by?: string;
  created_at: Date;
}

const iocSchema = new Schema<IIoc>({
  org_id: { type: String, required: true, index: true },
  type: { type: String, enum: ['ip', 'domain', 'hash', 'email', 'url'], required: true },
  value: { type: String, required: true },
  threat_level: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'] },
  source: { type: String },
  flagged_by: { type: String },
  created_at: { type: Date, default: Date.now },
});

iocSchema.index({ org_id: 1, created_at: -1 });
iocSchema.index({ created_at: -1 });
iocSchema.index({ value: 1, org_id: 1 }, { unique: true });

export interface ITimelineEvent extends Document {
  org_id: string;
  case_id: string;
  event_type: string;
  actor: string;
  description?: string;
  metadata?: Types.Buffer;
  created_at: Date;
}

const timelineEventSchema = new Schema<ITimelineEvent>({
  org_id: { type: String, required: true, index: true },
  case_id: { type: String, required: true, index: true },
  event_type: { type: String, required: true },
  actor: { type: String },
  description: { type: String },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
});

timelineEventSchema.index({ org_id: 1, created_at: -1 });
timelineEventSchema.index({ case_id: 1, created_at: -1 });
timelineEventSchema.index({ created_at: -1 });

export interface IUebaEvent extends Document {
  org_id: string;
  user_identity: string;
  event_type: string;
  risk_score: number;
  anomaly_flags?: string[];
  raw_event?: Types.Buffer;
  created_at: Date;
}

const uebaEventSchema = new Schema<IUebaEvent>({
  org_id: { type: String, required: true, index: true },
  user_identity: { type: String, required: true },
  event_type: { type: String, required: true },
  risk_score: { type: Number, min: 0, max: 100 },
  anomaly_flags: [{ type: String }],
  raw_event: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
});

uebaEventSchema.index({ org_id: 1, created_at: -1 });
uebaEventSchema.index({ created_at: -1 });

async function getModels() {
  const conn = await connectMongo();
  if (!conn) {
    return {
      CaseModel: null,
      AlertModel: null,
      IocModel: null,
      TimelineEventModel: null,
      UebaEventModel: null,
    };
  }

  if (!global.__CaseModel) {
    global.__CaseModel = conn.models.ICase || conn.model<ICase>('Case', caseSchema);
  }
  if (!global.__AlertModel) {
    global.__AlertModel = conn.models.IAlert || conn.model<IAlert>('Alert', alertSchema);
  }
  if (!global.__IocModel) {
    global.__IocModel = conn.models.IIoc || conn.model<IIoc>('IOC', iocSchema);
  }
  if (!global.__TimelineEventModel) {
    global.__TimelineEventModel = conn.models.ITimelineEvent || conn.model<ITimelineEvent>('TimelineEvent', timelineEventSchema);
  }
  if (!global.__UebaEventModel) {
    global.__UebaEventModel = conn.models.IUebaEvent || conn.model<IUebaEvent>('UebaEvent', uebaEventSchema);
  }

  return {
    CaseModel: global.__CaseModel,
    AlertModel: global.__AlertModel,
    IocModel: global.__IocModel,
    TimelineEventModel: global.__TimelineEventModel,
    UebaEventModel: global.__UebaEventModel,
  };
}

export async function getCases() {
  const { CaseModel } = await getModels();
  return CaseModel;
}

export async function getAlerts() {
  const { AlertModel } = await getModels();
  return AlertModel;
}

export async function getIocs() {
  const { IocModel } = await getModels();
  return IocModel;
}

export async function getTimelineEvents() {
  const { TimelineEventModel } = await getModels();
  return TimelineEventModel;
}

export async function getUebaEvents() {
  const { UebaEventModel } = await getModels();
  return UebaEventModel;
}
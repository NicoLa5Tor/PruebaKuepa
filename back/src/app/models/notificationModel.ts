import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

export type NotificationType = 'lead_created' | 'lead_again'

const NotificationSchema = new Schema({
  // Destinatario: el asesor dueño del lead
  adviser: { type: Schema.Types.ObjectId, ref: 'Third', required: true, index: true },
  type: {
    type: Schema.Types.String,
    enum: ['lead_created', 'lead_again'],
    required: true
  },
  title: { type: Schema.Types.String },
  body: { type: Schema.Types.String },
  _ref: {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' }
  },
  read_at: { type: Schema.Types.Date, default: null },
}, {
  collection: 'notifications', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

NotificationSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 


export const NotificationModel = mongoose.model<any, any>('Notification', NotificationSchema) 
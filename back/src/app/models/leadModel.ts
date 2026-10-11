import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

export interface ILead {
  incremental?: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_phone: string;
  interestProgram: mongoose.Types.ObjectId;
  contact?: mongoose.Types.ObjectId;
  adviser?: mongoose.Types.ObjectId;
  campaign?: mongoose.Types.ObjectId;
  adnetwork?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'grading' | 'sold' | 'dropped';
}

const LeadSchema = new Schema({
  incremental:{
    //numero unico de 4 digitos 
    type: Schema.Types.Number,
  },
  full_name: {type: Schema.Types.String},
  first_name: {type: Schema.Types.String},
  last_name: {type: Schema.Types.String},
  email: {type: Schema.Types.String},
  mobile_phone: {type: Schema.Types.String},
  interestProgram: {type: Schema.Types.ObjectId, ref: 'Program'},
  contact: {type: Schema.Types.ObjectId, ref: 'Third', index: true},
  adviser: {type: Schema.Types.ObjectId, ref: 'Third', index: true},
  campaign: {type: Schema.Types.ObjectId, ref: 'Campaign'},
  adnetwork: {type: Schema.Types.ObjectId, ref: 'Adnetwork'},
  status:{
    type: Schema.Types.String,
    enum: ['active', 'inactive', 'grading', 'sold', 'dropped'],
    default: 'active',
    index: true
  },
  trackings: [
    {
        tracking: {type: Schema.Types.ObjectId, ref: 'Tracking'},
        description: {type: Schema.Types.String},
    }
  ]
}, {
  collection: 'leads', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

LeadSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 


export const LeadModel = mongoose.model<ILead, any>('Lead', LeadSchema) 
import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

// Configuración global clave → valor: datos de negocio que muestra la app
const SettingSchema = new Schema({
  key: { type: Schema.Types.String, required: true, unique: true },
  value: { type: Schema.Types.Mixed },
  // Solo las públicas se sirven sin sesión (las usa el formulario de inscripción)
  public: { type: Schema.Types.Boolean, default: false },
  description: { type: Schema.Types.String },
}, {
  collection: 'settings', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

SettingSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 


export const SettingModel = mongoose.model<any, any>('Setting', SettingSchema) 
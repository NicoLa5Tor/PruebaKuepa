import { Adnetwork, Campaign, Program, Setting, Third, Tracking, User } from '@app/models'
import { IConsole } from '@client/client'

const programs = [
  { name: 'Técnico en Desarrollo de Software', description: 'Programación web y móvil' },
  { name: 'Técnico en Marketing Digital', description: 'Redes sociales, pauta y analítica' },
  { name: 'Técnico en Gestión Administrativa', description: 'Procesos administrativos y contables' },
  { name: 'Técnico en Diseño Gráfico', description: 'Diseño visual y multimedia' },
  { name: 'Bachillerato Acelerado', description: 'Termina el bachillerato en menos tiempo' },
]

// Datos que muestra la app (formulario y página de inscripción), servidos por /api/global/setting/:key
const settings = [
  {
    key: 'document_types',
    public: true,
    description: 'Tipos de documento del prospecto; el primero es el valor por defecto',
    value: [
      { value: 'cc', label: 'Cédula de ciudadanía' },
      { value: 'ti', label: 'Tarjeta de identidad' },
      { value: 'pp', label: 'Pasaporte' },
    ],
  },
  {
    key: 'inscription_page',
    public: true,
    description: 'Contenido de la página pública de inscripción',
    value: {
      heading: 'Da el siguiente paso en tu educación',
      description: 'Déjanos tus datos y un asesor te contactará.',
      benefits: [
        { icon: 'school', text: 'Programas técnicos y bachillerato con enfoque práctico' },
        { icon: 'clock', text: 'Estudia a tu ritmo, 100% virtual' },
        { icon: 'headset', text: 'Un asesor te acompaña en todo el proceso' },
      ],
    },
  },
]

// Idempotente: se puede correr varias veces con -f sin duplicar datos
const upsert = (model, where, data) => model.findOneAndUpdate(where, { $set: data }, { upsert: true, new: true, lean: true })

export const run = async(_params, console:IConsole) => {
  try{
    for (const setting of settings) {
      await upsert(Setting, { key: setting.key }, setting)
    }

    for (const program of programs) {
      await upsert(Program, { name: program.name }, { ...program, status: 'active' })
    }

    const user = await User.findOne({ username: 'useradminket' }).lean()
    if (!user) {
      console.log('Primero corre initSeeder: no existe useradminket')
      return false
    }

    // Asesor: el Third que representa al usuario dentro del CRM
    const adviser = await upsert(Third, { user: user._id }, {
      first_name: user.profile?.first_name || 'Kuepa',
      last_name: user.profile?.last_name || '',
      name: 'Asesor Kuepa',
      type: 'emp',
      status: 'active',
    })

    const organic = await upsert(Adnetwork, { 'defaults.organic': true }, {
      name: 'Formulario web',
      description: 'Leads que llegan desde el formulario público de inscripción',
      status: 'active',
    })
    const manual = await upsert(Adnetwork, { 'defaults.manual': true }, {
      name: 'Registro manual',
      description: 'Leads ingresados por un asesor desde el CRM',
      status: 'active',
    })

    await upsert(Campaign, { name: 'Campaña general' }, {
      description: 'Campaña por defecto para leads orgánicos y manuales',
      status: 'active',
      users: [{ third: adviser._id, adnetworks: [organic._id, manual._id] }],
    })

    await upsert(Tracking, { 'defaults.again': true }, {
      name: 'Nuevo registro',
      description: 'El prospecto volvió a registrarse',
    })
  } catch (error) {
    console.log('error', error)
    return false
  }
  return true
}

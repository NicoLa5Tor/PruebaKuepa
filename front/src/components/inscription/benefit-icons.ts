import { IconType } from 'react-icons'
import { TbCertificate, TbClock, TbDeviceLaptop, TbHeadset, TbSchool } from 'react-icons/tb'

// Lista blanca de íconos que puede nombrar la configuración inscription_page
export const BENEFIT_ICONS: Record<string, { icon: IconType, label: string }> = {
  school: { icon: TbSchool, label: 'Educación' },
  clock: { icon: TbClock, label: 'Horario' },
  headset: { icon: TbHeadset, label: 'Asesoría' },
  laptop: { icon: TbDeviceLaptop, label: 'Virtual' },
  certificate: { icon: TbCertificate, label: 'Certificación' },
}

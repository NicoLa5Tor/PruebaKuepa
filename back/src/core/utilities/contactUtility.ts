// Arma textos y links para contactar a una persona; no depende de ningún modelo
class ContactUtility {

  constructor () {}

  // Reemplaza {variable} por su valor; las variables desconocidas se dejan tal cual
  public fillTemplate (template: string, variables: Record<string, string>) {
    return `${template || ''}`.replace(/\{(\w+)\}/g, (match, key) => variables[key] ?? match)
  }

  // wa.me exige el número con indicativo y sin '+'
  public whatsappUrl (phone: string, country_code: string, text: string) {
    const number = phone.startsWith('+') ? phone.slice(1) : `${country_code}${phone}`
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
  }

  public emailUrl (email: string, subject: string, body: string) {
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
}

export const contactUtility = new ContactUtility()
export { ContactUtility }

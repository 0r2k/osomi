import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage,Contact } from '@/components/legal-page';
import { legal } from '@/lib/legal';
export const metadata: Metadata = { title: `Términos de servicio · ${legal.brand}`, description: `Condiciones de uso de ${legal.brand}.` };
export default function Page(){
 return <LegalPage title="Términos de servicio">
  <p>Al usar {legal.brand} o crear una cuenta aceptas estos términos. Si no estás de acuerdo, por favor no uses el servicio.</p>

  <h2>1. Qué es {legal.brand}</h2>
  <p>{legal.brand} es una experiencia editorial e interactiva de contenido documental y de reflexión. Está en <strong>fase piloto</strong>: puede cambiar, tener errores o interrumpirse sin previo aviso, y algunas funciones pueden modificarse o retirarse.</p>

  <h2>2. Tu cuenta</h2>
  <ul>
   <li>Puedes usar {legal.brand} sin cuenta; con cuenta puedes guardar tus favoritos.</li>
   <li>Debes dar un correo válido que puedas controlar, y mantener tu contraseña en secreto. Eres responsable de la actividad realizada con tu cuenta.</li>
   <li>Debes tener edad suficiente para aceptar estos términos según la ley de tu país, o contar con autorización de tu madre, padre o tutor.</li>
   <li>Puedes dejar de usar el servicio y pedir la eliminación de tu cuenta en cualquier momento escribiendo a <Contact/>.</li>
  </ul>

  <h2>3. Uso aceptable</h2>
  <p>Te comprometes a no:</p>
  <ul>
   <li>Intentar acceder sin autorización a cuentas, datos o sistemas, ni probar su seguridad sin nuestro permiso por escrito.</li>
   <li>Eludir los límites de uso, automatizar solicitudes de forma abusiva o sobrecargar el servicio.</li>
   <li>Usar el servicio para fines ilegales, para acosar a otras personas o para enviar contenido dañino.</li>
   <li>Copiar, redistribuir o extraer masivamente el contenido de {legal.brand} con fines comerciales sin autorización.</li>
  </ul>
  <p>Si incumples estas reglas podemos limitar o suspender tu acceso.</p>

  <h2>4. Contenido y propiedad</h2>
  <p>Los textos, diseños, ilustraciones, código y demás materiales de {legal.brand} pertenecen a {legal.responsible} o a sus licenciantes y están protegidos por la ley. Puedes verlos y compartir enlaces al sitio para uso personal y no comercial; cualquier otro uso requiere permiso. Las citas bíblicas se incluyen conforme a la licencia o dominio público de la versión indicada en cada caso.</p>
  <p>Lo que tú guardas en tu cuenta (como tus favoritos) es tuyo. Nos autorizas únicamente a almacenarlo y mostrártelo para prestar el servicio.</p>

  <h2>5. Naturaleza del contenido</h2>
  <p>El contenido tiene carácter informativo y de reflexión. <strong>No constituye asesoría médica, psicológica, legal ni profesional</strong>. Si tienes dudas sobre tu salud, incluido el sueño o el descanso, consulta a un profesional cualificado.</p>

  <h2>6. Disponibilidad y cambios</h2>
  <p>Ofrecemos el servicio «tal cual» y según disponibilidad. Podemos modificar, suspender o cerrar {legal.brand}, o cambiar estos términos. Publicaremos la versión vigente con su fecha; si sigues usando el servicio después del cambio, lo aceptas.</p>

  <h2>7. Limitación de responsabilidad</h2>
  <p>En la medida que permita la ley aplicable, {legal.responsible} no será responsable de daños indirectos ni de pérdidas derivadas del uso o la imposibilidad de uso del servicio, ni de la interrupción de contenidos o favoritos guardados. Nada de lo aquí dicho limita derechos irrenunciables que te otorgue la ley como consumidor.</p>

  <h2>8. Privacidad</h2>
  <p>El tratamiento de tus datos se describe en la <Link href="/privacidad">Política de privacidad</Link>.</p>

  <h2>9. Ley aplicable</h2>
  <p>Estos términos se rigen por las leyes de {legal.country}. Para cualquier controversia, y salvo que la ley imponga otro fuero, serán competentes los tribunales de ese país.</p>

  <h2>10. Contacto</h2>
  <p>Para cualquier duda sobre estos términos: <Contact/>.</p>
 </LegalPage>;
}

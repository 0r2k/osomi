import type { Metadata } from 'next';
import { LegalPage,Contact } from '@/components/legal-page';
import { legal } from '@/lib/legal';
export const metadata: Metadata = { title: `Política de privacidad · ${legal.brand}`, description: `Qué datos recoge ${legal.brand}, para qué los usa y cómo puedes ejercer tus derechos.` };
export default function Page(){
 return <LegalPage title="Política de privacidad">
  <p>Esta política explica qué datos personales trata {legal.brand}, con qué finalidad, con quién los comparte y qué derechos tienes. {legal.brand} es un proyecto en fase piloto: si añadimos funciones que cambien el tratamiento de datos, actualizaremos esta página antes de activarlas.</p>

  <h2>1. Responsable</h2>
  <p>El responsable del tratamiento es {legal.responsible}. Puedes escribirnos a <Contact/>.</p>

  <h2>2. Qué datos tratamos</h2>
  <h3>Si creas una cuenta</h3>
  <ul>
   <li><strong>Correo electrónico y contraseña.</strong> La contraseña la gestiona nuestro proveedor de autenticación y se almacena cifrada de forma irreversible (hash); nosotros no podemos verla.</li>
   <li><strong>Inicio de sesión con Google.</strong> Si eliges «Continuar con Google», recibimos de Google tu correo verificado y los datos básicos de perfil que Google comparta (por ejemplo, nombre). Solo solicitamos los permisos básicos de identidad (<code>openid</code>, <code>email</code> y <code>profile</code>); no accedemos a tu Gmail, contactos, calendario ni a otros datos de tu cuenta de Google.</li>
   <li><strong>Tus favoritos de tema</strong> («Me encanta este tema») y las preferencias asociadas a tu cuenta.</li>
  </ul>
  <h3>Si no creas una cuenta</h3>
  <ul>
   <li><strong>Identificador anónimo.</strong> Si marcas un tema como favorito sin cuenta, guardamos una cookie técnica (<code>lucarit_visitor</code>) con un identificador aleatorio y un secreto. En nuestra base de datos solo se conserva un identificador y una versión cifrada (hash) del secreto, sin nombre ni correo. Se usa únicamente para recordar tu favorito.</li>
   <li>Al crear una cuenta o iniciar sesión, ese favorito se transfiere a tu cuenta y la cookie anónima se elimina.</li>
  </ul>
  <h3>Datos técnicos</h3>
  <ul>
   <li><strong>Cookies de sesión</strong> de nuestro proveedor de autenticación, solo si inicias sesión, para mantenerte identificado.</li>
   <li><strong>Dirección IP.</strong> Se usa de forma momentánea para limitar intentos abusivos (por ejemplo, contraseñas repetidas). No guardamos tu IP: se convierte en una huella cifrada (hash) que se borra en pocos minutos.</li>
   <li><strong>Registros de servidor.</strong> Nuestro proveedor de alojamiento procesa datos como IP, navegador y páginas solicitadas para servir el sitio y mantener su seguridad.</li>
  </ul>
  <p>Hoy {legal.brand} <strong>no usa cookies de publicidad ni de seguimiento</strong>, y no vende ni cede tus datos para fines comerciales. Si en el futuro incorporamos analítica, te pediremos tu consentimiento antes.</p>
  <p>Algunos temas de {legal.brand} tratan cuestiones espirituales o de fe. No te pedimos datos sobre tus creencias, pero tus favoritos podrían sugerir intereses personales; por eso los tratamos como información privada: no se publican ni son visibles para otros usuarios.</p>

  <h2>3. Para qué los usamos</h2>
  <ul>
   <li>Crear y mantener tu cuenta, e iniciar sesión.</li>
   <li>Guardar tus favoritos y devolvértelos cuando vuelves.</li>
   <li>Enviarte correos necesarios del servicio (confirmar tu cuenta, recuperar tu contraseña).</li>
   <li>Proteger el servicio frente a abusos y fallos.</li>
   <li>Atender tus consultas y solicitudes sobre tus datos.</li>
  </ul>
  <p>Las bases que lo permiten son tu consentimiento o la ejecución del servicio que solicitas (cuenta y favoritos), y nuestro interés legítimo en la seguridad del sitio, siempre según la ley aplicable en {legal.country}, incluida la Ley Orgánica de Protección de Datos Personales.</p>

  <h2>4. Con quién los compartimos</h2>
  <p>Usamos proveedores que tratan datos por nuestra cuenta y solo para prestar el servicio:</p>
  <ul>
   <li><strong>Supabase</strong>: base de datos y autenticación.</li>
   <li><strong>Vercel</strong>: alojamiento del sitio.</li>
   <li><strong>Upstash</strong>: almacén temporal para limitar solicitudes abusivas.</li>
   <li><strong>Google</strong>: solo si eliges iniciar sesión con Google.</li>
  </ul>
  <p>Estos proveedores pueden operar servidores fuera de tu país, incluidos Estados Unidos y la Unión Europea, con las garantías contractuales que ofrecen. No compartimos tus datos con otros terceros salvo obligación legal.</p>
  <p>El uso que {legal.brand} hace de la información recibida de las API de Google cumple la Política de datos de usuario de los Servicios de API de Google, incluidos los requisitos de Uso Limitado.</p>

  <h2>5. Cuánto tiempo los conservamos</h2>
  <ul>
   <li><strong>Cuenta y favoritos:</strong> mientras mantengas tu cuenta. Si la eliminas, borramos tus datos asociados.</li>
   <li><strong>Identificador anónimo:</strong> la cookie y el registro asociado caducan a los 30 días.</li>
   <li><strong>Huella para limitar abusos:</strong> unos minutos.</li>
   <li><strong>Registros de proveedores:</strong> según sus propias políticas de retención.</li>
  </ul>

  <h2>6. Tus derechos</h2>
  <p>Puedes solicitar acceso a tus datos, su rectificación o supresión, limitar u oponerte a su tratamiento, retirar tu consentimiento y pedir una copia en formato portable, en la medida en que la ley aplicable lo reconozca. Escríbenos a <Contact/> desde el correo de tu cuenta y responderemos en un plazo razonable. También puedes presentar una reclamación ante la autoridad de protección de datos personales de Ecuador (Superintendencia de Protección de Datos Personales) o de tu país de residencia.</p>
  <p>Para eliminar tu cuenta y sus datos, envíanos la solicitud a ese mismo correo.</p>

  <h2>7. Cookies</h2>
  <p>Usamos únicamente cookies técnicas necesarias para el funcionamiento que solicitas: la sesión de tu cuenta y la cookie anónima de favoritos. Son de primera parte, no se usan para publicidad ni seguimiento y puedes borrarlas desde tu navegador, aunque entonces perderás el favorito anónimo o tendrás que iniciar sesión de nuevo.</p>

  <h2>8. Seguridad</h2>
  <p>Aplicamos medidas técnicas razonables: conexión cifrada (HTTPS), contraseñas con hash, cookies protegidas, control de acceso a nivel de fila en la base de datos y límites contra abuso. Ningún sistema es infalible; si detectamos una brecha que te afecte, te lo comunicaremos conforme a la ley.</p>

  <h2>9. Menores de edad</h2>
  <p>{legal.brand} no está dirigido a menores sin el consentimiento de su madre, padre o tutor. Si crees que un menor nos ha dado datos sin autorización, escríbenos y los eliminaremos.</p>

  <h2>10. Cambios</h2>
  <p>Podemos actualizar esta política. Publicaremos la versión vigente con su fecha y, si el cambio es importante, te avisaremos en el sitio o por correo.</p>

  <h2>11. Contacto</h2>
  <p>Consultas sobre privacidad: <Contact/>.</p>
 </LegalPage>;
}

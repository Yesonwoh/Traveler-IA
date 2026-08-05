import { LoginForm } from "./login-form";
import { rutaSegura } from "@/lib/auth-redirects";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  // signIn vuelve a filtrarlo antes de redirigir; aquí lo saneamos también para
  // que un ?next= ajeno ni siquiera llegue al campo oculto del formulario.
  return <LoginForm next={rutaSegura(params.next)} oauthError={params.error} />;
}

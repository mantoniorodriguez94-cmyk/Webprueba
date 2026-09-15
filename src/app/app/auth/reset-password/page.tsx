"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [sesionLista, setSesionLista] = useState(false);

  /* Canjear el enlace del correo por una sesión.
   *
   * Esto estaba roto y sólo desde el navegador se veía: el correo llegaba, el
   * enlace abría la página y ahí se acababa. El motivo es que el cliente se
   * crea con createBrowserClient de @supabase/ssr, que usa PKCE por defecto,
   * así que Supabase devuelve `?code=` — y esta página sólo buscaba un
   * `access_token` en el hash, que es el flujo antiguo. No encontraba nada,
   * no había sesión, y updateUser no tenía con qué trabajar.
   *
   * Ahora se canjea el código aquí mismo. El verificador PKCE lo guarda el
   * propio cliente del navegador, así que el canje funciona sin pasar por el
   * callback del servidor —que se deja en paz, porque es el de Google.
   *
   * El flujo antiguo sigue cubierto sin escribir nada: con detectSessionInUrl
   * (por defecto) la librería consume sola un `#access_token` al cargar, y
   * getSession lo encuentra.
   */
  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorDescripcion = params.get("error_description");

      if (errorDescripcion) {
        if (vivo) {
          setError(errorDescripcion);
          setVerificando(false);
        }
        return;
      }

      /* Dos formas de enlace, según la plantilla de correo de Supabase.

         `token_hash` va PRIMERO porque es el que funciona entre dispositivos:
         se verifica contra el servidor y no depende de nada guardado en el
         navegador. Hoy la plantilla por defecto no lo manda, pero en cuanto
         se cambie a {{ .TokenHash }} esto empieza a funcionar solo.

         `code` es PKCE y exige el verificador que guardó el navegador al
         pedir el enlace. Funciona perfecto en el mismo dispositivo y falla
         siempre si pides el correo en el ordenador y lo abres en el móvil
         —de ahí que el mensaje de error nombre ese caso en vez de decir
         sólo "caducó", que manda a la gente a repetir lo mismo. */
      const tokenHash = params.get("token_hash");

      if (tokenHash) {
        const { error: errorOtp } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        if (!vivo) return;
        if (errorOtp) {
          setError("Este enlace ya se usó o caducó. Pide uno nuevo más abajo.");
          setVerificando(false);
          return;
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (code) {
        const { error: errorCanje } = await supabase.auth.exchangeCodeForSession(code);
        if (!vivo) return;
        if (errorCanje) {
          setError(
            "Este enlace no se puede abrir en este navegador. Ábrelo en el mismo dispositivo donde pediste el cambio, o pide uno nuevo desde aquí."
          );
          setVerificando(false);
          return;
        }
        // Fuera el código de la barra de direcciones: ya está gastado.
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!vivo) return;

      setSesionLista(Boolean(session));
      if (!session) {
        setError(
          "Abre esta página desde el enlace que te llegó por correo. Si ya lo hiciste, es que caducó: pide uno nuevo."
        );
      }
      setVerificando(false);
      } catch (e: any) {
        if (!vivo) return;
        setError("No se pudo comprobar el enlace. Inténtalo de nuevo o pide uno nuevo.");
        setVerificando(false);
      }
    })();

    return () => {
      vivo = false;
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!password || !confirmPassword) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      // La sesión la dejó puesta el efecto de arriba al canjear el enlace.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(
          "El enlace ya no es válido. Pide uno nuevo desde «¿Olvidaste tu contraseña?»."
        );
      }

      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        // Errores comunes
        if (updateError.message.includes('session')) {
          throw new Error("Tu sesión ha expirado. Por favor solicita un nuevo enlace de recuperación.");
        }
        throw updateError;
      }

      setSuccess(true);
      
      // Cerrar sesión y redirigir al login después de 3 segundos
      await supabase.auth.signOut();
      
      setTimeout(() => {
        router.push("/app/auth/login");
      }, 3000);
    } catch (err: any) {
      console.error("Error al actualizar contraseña:", err);
      setError(err.message || "Error al actualizar la contraseña. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tarjeta de formulario */}
      <div className="surface-elevated rounded-3xl p-6 sm:p-8 lg:p-10">
          {!success ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-ink">
                  Nueva contraseña
                </h2>
                <p className="text-ink-2 mt-2 text-sm sm:text-base">
                  {verificando
                    ? "Comprobando tu enlace…"
                    : "Ingresa tu nueva contraseña a continuación"}
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl animate-shake">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Sin enlace válido no se ofrece el formulario: rellenar dos
                  campos para que al enviar te digan que no servía es peor que
                  decirlo antes, y la salida útil es pedir otro enlace. */}
              {!verificando && !sesionLista && (
                <Link
                  href="/app/auth/forgot-password"
                  className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white px-6 py-3.5 rounded-2xl transition-colors font-semibold"
                >
                  Pedir un enlace nuevo
                </Link>
              )}

              {/* Formulario */}
              <form
                onSubmit={handleResetPassword}
                className={`space-y-5 ${!verificando && !sesionLista ? "hidden" : ""}`}
              >
                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-ink">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 sm:py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 6 caracteres
                  </p>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-ink">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 sm:py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 sm:py-4 px-6 rounded-2xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Actualizando...
                    </span>
                  ) : (
                    "Restablecer contraseña"
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-ink mb-2">
                ¡Contraseña actualizada!
              </h3>
              <p className="text-ink-2 mb-6">
                Tu contraseña se ha restablecido exitosamente. Serás redirigido al inicio de sesión...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10"></div>
            </div>
          </div>

          {/* Links */}
          <div className="text-center space-y-3">
            <Link
              href="/app/auth/login"
              className="block text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline text-sm sm:text-base"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </>
  );
}


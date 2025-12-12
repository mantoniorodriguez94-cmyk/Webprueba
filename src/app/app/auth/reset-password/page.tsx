"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
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

  useEffect(() => {
    // Procesar el token de recuperación cuando la página carga
    let mounted = true;
    let subscription: any = null;
    
    const processRecoveryToken = async () => {
      try {
        // Verificar si hay un token en la URL (tanto en hash como en query params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const type = hashParams.get('type') || queryParams.get('type');
        
        console.log('🔍 Verificando token de recuperación...', {
          hasHash: !!window.location.hash,
          hasQuery: !!window.location.search,
          accessToken: !!accessToken,
          type
        });
        
        if (accessToken && type === 'recovery') {
          console.log('✅ Token de recuperación detectado, procesando...');
          
          // Escuchar cambios en el estado de autenticación
          subscription = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('📡 Auth state change:', event, session ? 'Sesión establecida' : 'Sin sesión');
            
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
              console.log('✅ Sesión establecida después de recuperación:', event);
              
              if (mounted && session) {
                // Limpiar la URL para ocultar el token
                window.history.replaceState({}, document.title, window.location.pathname);
                setError(""); // Limpiar cualquier error previo
              }
            }
          });
          
          // Esperar y verificar la sesión múltiples veces
          const checkSession = async (attempts = 0) => {
            if (!mounted || attempts >= 5) {
              if (attempts >= 5 && mounted) {
                console.error('❌ No se pudo establecer sesión después de varios intentos');
                setError("Error al procesar el enlace de recuperación. Por favor solicita uno nuevo.");
              }
              return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('❌ Error obteniendo sesión:', sessionError);
              if (mounted && attempts >= 3) {
                setError("Error al procesar el enlace de recuperación. Por favor solicita uno nuevo.");
              }
              return;
            }
            
            if (session) {
              console.log('✅ Sesión establecida correctamente');
              if (mounted) {
                window.history.replaceState({}, document.title, window.location.pathname);
                setError("");
              }
            } else {
              console.log(`⏳ Intento ${attempts + 1}: Esperando sesión...`);
              checkSession(attempts + 1);
            }
          };
          
          checkSession();
          
        } else if (!accessToken && !type) {
          // No hay token, verificar si hay una sesión existente
          const { data: { session } } = await supabase.auth.getSession();
          if (!session && mounted) {
            console.log('⚠️ No hay token ni sesión en la página de reset');
            // No mostramos error inmediatamente, puede que el usuario esté llegando directamente
          }
        } else if (accessToken && type !== 'recovery') {
          console.warn('⚠️ Token detectado pero tipo incorrecto:', type);
          if (mounted) {
            setError("Este enlace no es válido para recuperar contraseña. Por favor solicita uno nuevo.");
          }
        }
      } catch (err) {
        console.error('❌ Error procesando token de recuperación:', err);
        if (mounted) {
          setError("Error al procesar el enlace de recuperación. Por favor intenta de nuevo.");
        }
      }
    };

    processRecoveryToken();
    
    return () => {
      mounted = false;
      if (subscription) {
        subscription.data.subscription.unsubscribe();
      }
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
      // Verificar que el usuario tenga una sesión válida (requerido para cambiar contraseña)
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Si no hay sesión, verificar si hay un token en la URL y procesarlo
      if (!session) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const type = hashParams.get('type') || queryParams.get('type');
        
        if (accessToken && type === 'recovery') {
          // Esperar un momento más para que Supabase procese el token
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Intentar obtener la sesión nuevamente
          const sessionResult = await supabase.auth.getSession();
          session = sessionResult.data.session;
          sessionError = sessionResult.error;
          
          if (sessionError) {
            throw new Error("Error al procesar el enlace de recuperación. Por favor solicita uno nuevo.");
          }
        }
      }
      
      if (sessionError) {
        throw new Error("No hay una sesión válida. Por favor, usa el enlace del correo electrónico.");
      }

      if (!session) {
        throw new Error("No hay una sesión válida. Por favor, usa el enlace del correo electrónico para restablecer tu contraseña.");
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo y Marca */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3 group">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 transition-transform group-hover:scale-105">
              <Image 
                src="/assets/logotipo.png" 
                alt="Logo Encuentra" 
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0288D1] transition-colors group-hover:text-[#0277BD]">
              Encuentra
            </h1>
          </Link>
          <p className="text-gray-300 mt-3 text-sm sm:text-base">
            Restablece tu contraseña
          </p>
        </div>

        {/* Tarjeta de formulario */}
        <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20 p-6 sm:p-8 lg:p-10">
          {!success ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-300">
                  Nueva contraseña
                </h2>
                <p className="text-gray-300 mt-2 text-sm sm:text-base">
                  Ingresa tu nueva contraseña a continuación
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

              {/* Formulario */}
              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-300">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 sm:py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
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
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 sm:py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-800 placeholder-gray-400 text-sm sm:text-base"
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
                  className="w-full bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white font-semibold py-3 sm:py-4 px-6 rounded-2xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
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
              <h3 className="text-2xl font-bold text-white mb-2">
                ¡Contraseña actualizada!
              </h3>
              <p className="text-gray-300 mb-6">
                Tu contraseña se ha restablecido exitosamente. Serás redirigido al inicio de sesión...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0288D1]"></div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
          </div>

          {/* Links */}
          <div className="text-center space-y-3">
            <Link 
              href="/app/auth/login" 
              className="block text-[#0288D1] hover:text-[#0277BD] font-semibold transition-colors hover:underline text-sm sm:text-base"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}


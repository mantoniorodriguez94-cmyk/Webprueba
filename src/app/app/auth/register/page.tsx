"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref'); // Capturar parámetro ref
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("person");

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Update password strength
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
  
    // Validación
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Por favor completa todos los campos");
      return;
    }
  
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
  
    if (!isPasswordValid) {
      setError("La contraseña no cumple con los requisitos de seguridad");
      return;
    }
  
    setLoading(true);
  
    try {
      // 1. Crear usuario en Supabase Auth con metadata
      // Las personas (person) no pueden crear negocios (allowed_businesses = 0)
      // Las empresas (company) pueden crear hasta 5 negocios por defecto
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            allowed_businesses: role === "person" ? 0 : 5,
          },
        },
      });
  
      if (authError) {
        setError(authError.message);
        return;
      }
  
      if (!data.user) {
        setError("Error al crear usuario");
        return;
      }

      // Verificar que el perfil se haya creado correctamente
      // Esperar un momento para que el trigger se ejecute
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("id", data.user.id)
        .single();

      // Registrar referencia si existe
      if (refParam && data.user) {
        try {
          // Verificar que el inviter existe
          const { data: inviterCheck } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", refParam)
            .single();

          if (inviterCheck) {
            // Buscar si ya existe un referral con este email (creado antes del registro)
            const { data: existingRef } = await supabase
              .from("referrals")
              .select("id")
              .eq("inviter_id", refParam)
              .eq("invited_email", email)
              .single();

            if (existingRef) {
              // Actualizar el referral existente con el invited_id
              await supabase
                .from("referrals")
                .update({ invited_id: data.user.id })
                .eq("id", existingRef.id);
            } else {
              // Crear nuevo referral
              await supabase
                .from("referrals")
                .insert({
                  inviter_id: refParam,
                  invited_email: email,
                  invited_id: data.user.id
                });
            }
          }
        } catch (refError) {
          // Silenciar errores de referral para no interrumpir el registro
          console.warn("Error registrando referral:", refError);
        }
      }

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn("Advertencia: No se pudo verificar el perfil:", profileError);
        // No bloqueamos el registro si el perfil no se encuentra inmediatamente
        // El trigger debería crearlo automáticamente
      } else if (profile) {
        console.log("✅ Perfil creado correctamente:", profile);
      }
  
      // 2. Si hay sesión activa, redirigir inmediatamente
      if (data.session) {
        // Usuario registrado exitosamente con sesión activa
        router.push("/app/dashboard");
        return;
      }
  
      // 3. Si no hay sesión, significa que necesita confirmar email
      setSuccessMessage("¡Cuenta creada! Revisa tu correo para confirmar tu cuenta y luego inicia sesión.");
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Error en registro:", err);
      setError(err.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  // Redirigir al login automáticamente después de mostrar la ventana de éxito
  useEffect(() => {
    if (!showSuccessModal) return;
    const timer = setTimeout(() => {
      router.push("/app/auth/login?registered=1");
    }, 3000);
    return () => clearTimeout(timer);
  }, [showSuccessModal, router]);
  

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Contenedor principal con animación */}
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
            Únete a nuestra comunidad
          </p>
        </div>

        {/* Tarjeta de formulario */}
        <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20 p-6 sm:p-8 lg:p-10">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Crear cuenta
            </h2>
            <p className="text-gray-300 mt-2 text-sm sm:text-base">
              Empieza tu viaje con Encuentra
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
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name Input */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-semibold text-white">
                Nombre completo
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-800 placeholder-gray-500 text-sm sm:text-base"
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-white">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-800 placeholder-gray-500 text-sm sm:text-base"
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-white">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-800 placeholder-gray-500text-gray-800 placeholder-gray-500 text-sm sm:text-base"
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

              {/* Password strength indicators */}
              {password && (
                <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-800 mb-2">Requisitos de contraseña:</p>
                  <PasswordRequirement met={passwordStrength.hasMinLength} text="Mínimo 8 caracteres" />
                  <PasswordRequirement met={passwordStrength.hasUpperCase} text="Una letra mayúscula" />
                  <PasswordRequirement met={passwordStrength.hasLowerCase} text="Una letra minúscula" />
                  <PasswordRequirement met={passwordStrength.hasNumber} text="Un número" />
                  <PasswordRequirement met={passwordStrength.hasSpecialChar} text="Un carácter especial (!@#$%)" />
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 sm:py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-300 text-gray-800 placeholder-gray-500 text-sm sm:text-base ${
                    confirmPassword && password !== confirmPassword
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : confirmPassword && password === confirmPassword
                      ? "border-green-300 focus:border-green-500 focus:ring-green-100"
                      : "border-gray-200 focus:border-[#0288D1] focus:ring-[#E3F2FD]"
                  }`}
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
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Las contraseñas no coinciden
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Las contraseñas coinciden
                </p>
              )}
            </div>

            {/* Selector de tipo de usuario */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white">
                ¿Cómo te quieres registrar?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción Persona */}
                <button
                  type="button"
                  onClick={() => setRole("person")}
                  className={`p-4 border-2 rounded-2xl transition-all duration-300 text-left ${
                    role === "person"
                      ? "border-[#0288D1] bg-[#E3F2FD] shadow-md scale-[1.02]"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  disabled={loading}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${role === "person" ? "text-[#0288D1]" : "text-gray-400"}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-sm ${role === "person" ? "text-[#0288D1]" : "text-white"}`}>
                        Persona
                      </h3>
                      <p className="text-xs text-gray-300 mt-1">
                        Explora y descubre negocios
                      </p>
                    </div>
                    {role === "person" && (
                      <div className="text-[#0288D1]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>

                {/* Opción Empresa */}
                <button
                  type="button"
                  onClick={() => setRole("company")}
                  className={`p-4 border-2 rounded-2xl transition-all duration-300 text-left ${
                    role === "company"
                      ? "border-[#0288D1] bg-[#E3F2FD] shadow-md scale-[1.02]"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  disabled={loading}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${role === "company" ? "text-[#0288D1]" : "text-gray-400"}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-sm ${role === "company" ? "text-[#0288D1]" : "text-white"}`}>
                        Empresa
                      </h3>
                      <p className="text-xs text-gray-300 mt-1">
                        Crea y gestiona negocios
                      </p>
                    </div>
                    {role === "company" && (
                      <div className="text-[#0288D1]">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white font-semibold py-3 sm:py-4 px-6 rounded-2xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full margin-top-10 p-4 border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white font-medium">
                ¿Ya tienes cuenta?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-300 text-sm sm:text-base">
              <Link 
                href="/app/auth/login" 
                className="text-[#0288D1] hover:text-[#0277BD] font-semibold transition-colors hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </p>
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

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-700 font-semibold">Registro exitoso</p>
            </div>
            <p className="text-gray-700">{successMessage}</p>
            <p className="text-sm text-gray-500">Te redirigiremos al inicio de sesión en unos segundos.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/app/auth/login?registered=1")}
                className="w-full sm:w-auto bg-[#0288D1] text-white px-4 py-2 rounded-xl hover:bg-[#0277BD] transition-colors"
              >
                Ir al inicio de sesión
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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

// Componente auxiliar para los requisitos de contraseña
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )}
      <span className={`text-xs ${met ? "text-green-700 font-medium" : "text-gray-300"}`}>
        {text}
      </span>
    </div>
  );
}

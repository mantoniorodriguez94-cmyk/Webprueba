"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Estamos verificando tu correo...");

  useEffect(() => {
    const code = searchParams.get("code");
    const type = searchParams.get("type");
    const errorDescription = searchParams.get("error_description");

    if (errorDescription) {
      setStatus("error");
      setMessage(errorDescription);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("Enlace inválido o expirado. Solicita un nuevo correo de confirmación.");
      return;
    }

    const confirmEmail = async () => {
      try {
        // Solo procesamos enlaces de registro/confirmación
        if (type && type !== "signup" && type !== "email_change") {
          setStatus("error");
          setMessage("El enlace recibido no es válido para confirmar tu correo.");
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          throw error;
        }

        setStatus("success");
        setMessage("¡Correo confirmado! Ya puedes iniciar sesión.");

        // Cerramos cualquier sesión temporal y redirigimos al login con mensaje
        await supabase.auth.signOut();
        setTimeout(() => {
          router.replace("/app/auth/login?verified=1");
        }, 2000);
      } catch (err: any) {
        console.error("Error confirmando correo:", err);
        setStatus("error");
        setMessage(err?.message || "No pudimos confirmar tu correo. Solicita un nuevo enlace.");
      }
    };

    confirmEmail();
  }, [router, searchParams]);

  const isLoading = status === "loading";
  const isError = status === "error";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#0B1220] to-[#0F172A] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-4">
        <div className={`flex items-center justify-center gap-3 ${isError ? "text-red-600" : "text-green-600"}`}>
          {isLoading ? (
            <svg className="w-6 h-6 animate-spin text-[#0288D1]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isError ? (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <h1 className="text-xl font-semibold text-gray-900">
            {isLoading ? "Confirmando correo..." : isError ? "No se pudo confirmar" : "Correo confirmado"}
          </h1>
        </div>

        <p className="text-gray-700">{message}</p>

        {isError && (
          <div className="space-y-3">
            <Link
              href="/app/auth/login"
              className="block w-full bg-[#0288D1] text-white rounded-xl py-3 font-semibold hover:bg-[#0277BD] transition-colors"
            >
              Ir al inicio de sesión
            </Link>
            <p className="text-sm text-gray-500">
              Si el enlace expiró, solicita uno nuevo registrándote o pidiendo otro correo de confirmación.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}















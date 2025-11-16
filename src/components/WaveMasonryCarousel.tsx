"use client";
import { useRef, useEffect } from "react";
import Image from "next/image";

export default function WaveMasonryCarousel() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isHovering = useRef(false);
  const pauseTimeout = useRef<any>(null);

  const cards = [
    { img: "/assets/ejemplo1.jpg", h: 260 },
    { img: "/assets/yuly.jpeg", h: 320 },
    { img: "/assets/ejemplo2.jpg", h: 280 },
    { img: "/assets/freddy.jpeg", h: 340 },
    { img: "/assets/ejemplo1.jpg", h: 300 },
    { img: "/assets/yuly.jpeg", h: 260 },
    { img: "/assets/ejemplo2.jpg", h: 330 }
  ];

  // Auto-scroll animación (lee isHovering para pausar)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId: number;
    function animate() {
      if (!isHovering.current) {
        if (track) {
          (track as HTMLElement).scrollLeft += 0.4;
        }
        // loop infinito
        if (track && (track as HTMLElement).scrollLeft >= (track as HTMLElement).scrollWidth - (track as HTMLElement).clientWidth - 2) {
          track.scrollLeft = 0;
        }
      }
      rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Drag con mouse (mantengo igual)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const mouseDown = (e: MouseEvent) => {
      isDown = true;
      isHovering.current = true; // pausa autoscroll mientras arrastra
      track.classList.add("cursor-grabbing");
      startX = e.pageX - (track?.offsetLeft ?? 0);
      scrollLeft = track.scrollLeft;
      // clear any pending resume
      if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
    };

    const mouseUp = () => {
      isDown = false;
      track.classList.remove("cursor-grabbing");
      // reanudar autoscroll tras breve demora
      if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
      pauseTimeout.current = setTimeout(() => (isHovering.current = false), 900);
    };

    const mouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - (track?.offsetLeft ?? 0);
      const walk = (x - startX) * 1.4;
      track.scrollLeft = scrollLeft - walk;
    };

    track.addEventListener("mousedown", mouseDown);
    track.addEventListener("mouseleave", mouseUp);
    track.addEventListener("mouseup", mouseUp);
    track.addEventListener("mousemove", mouseMove);

    return () => {
      track.removeEventListener("mousedown", mouseDown);
      track.removeEventListener("mouseleave", mouseUp);
      track.removeEventListener("mouseup", mouseUp);
      track.removeEventListener("mousemove", mouseMove);
      if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
    };
  }, []);

  // Handler que mueve el carrusel y pausa autoscroll temporalmente
  const scrollByAmount = (amount: number) => {
    const track = trackRef.current;
    if (!track) return;

    // Pausar auto-scroll
    isHovering.current = true;
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);

    // Ejecutar el scroll suave
    try {
      track.scrollBy({ left: amount, behavior: "smooth" });
    } catch (e) {
      // Algunos navegadores antiguos no soportan behavior: "smooth" en scrollBy, fallback:
      track.scrollLeft = track.scrollLeft + amount;
    }

    // Reanudar después de 1.1s
    pauseTimeout.current = setTimeout(() => {
      isHovering.current = false;
    }, 1100);
  };

  return (
    <div className="w-full py-16 overflow-hidden select-none relative">
      {/* Botón izquierda */}
      <button
        onClick={() => scrollByAmount(-360)}
        aria-label="Mover a la izquierda"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-700 shadow-lg rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-md"
      >
        ‹
      </button>

      {/* Botón derecha */}
      <button
        onClick={() => scrollByAmount(360)}
        aria-label="Mover a la derecha"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-700 shadow-lg rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-md"
      >
        ›
      </button>

      {/* TRACK HORIZONTAL */}
      <div
        ref={trackRef}
        onMouseEnter={() => (isHovering.current = true)}
        onMouseLeave={() => (isHovering.current = false)}
        className="flex gap-8 px-8 overflow-x-scroll scrollbar-none cursor-grab active:cursor-grabbing"
      >
        {[...cards, ...cards].map((card, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[28px] shadow-lg shrink-0 bg-white border border-gray-200 hover:shadow-2xl transition-all duration-500"
            style={{
              width: "260px",
              height: `${card.h}px`,
              animation: `floatWave 4s ease-in-out ${index * 0.15}s infinite`,
            }}
          >
            <Image
              src={card.img}
              alt="Imagen negocio"
              width={500}
              height={500}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

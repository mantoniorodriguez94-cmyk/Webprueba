"use client";
import { useRef, useEffect } from "react";
import Image from "next/image";

export default function MasonryHorizontalCarousel() {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let start = performance.now();

    function animate(time: number) {
      if (track) {
        (track as HTMLElement).scrollLeft += 0.6;

        if ((track as HTMLElement).scrollLeft >= (track as HTMLElement).scrollWidth - (track as HTMLElement).clientWidth - 2) {
          (track as HTMLElement).scrollLeft = 0;
        }
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, []);

  const cards = [
    "/assets/restaurante.jpg",
    "/assets/yuly.jpeg",
    "/assets/tienda.jpg",
    "/assets/freddy.jpeg",
    "/assets/restaurante.jpg",
    "/assets/yuly.jpeg",
    "/assets/ejemplo2.jpg",
  ];

  return (
    <div className="relative w-full py-12 overflow-hidden">
      <div
        ref={trackRef}
        className="
          flex items-start gap-6 px-6
          overflow-x-scroll whitespace-nowrap
          scrollbar-none cursor-grab active:cursor-grabbing
        "
      >
        {cards.map((src, i) => (
          <div
            key={i}
            className={`
              relative shrink-0 w-[230px] h-[330px]
              rounded-[28px] overflow-hidden shadow-lg bg-white
              transition-transform duration-700
              ${i % 2 === 0 ? "mt-0" : "mt-8"}
              hover:scale-[1.04]
            `}
            style={{
              animation: `floatY 4s ease-in-out ${i * 0.25}s infinite`,
            }}
          >
            <Image
              src={src}
              alt="Imagen negocio"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
}

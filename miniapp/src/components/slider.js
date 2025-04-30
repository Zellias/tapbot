"use client";

import { useState, useEffect, useRef } from 'react';

const Slider = ({ slides, autoplayInterval = 5000 }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [startX, setStartX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sliderRef = useRef(null);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setDragOffset(0);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setDragOffset(0);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isDragging) {
        nextSlide();
      }
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [isDragging]);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleMouseDown = (e) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!startX) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setDragOffset(diff);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    if (Math.abs(dragOffset) > 50) {
      if (dragOffset > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    
    setStartX(null);
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <div className="relative mt-8 overflow-hidden">
      <div 
        ref={sliderRef}
        className="flex transition-transform duration-300 ease-in-out"
        style={{ 
          transform: `translateX(${dragOffset - (currentSlide * 100)}%)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {slides.map((slide, index) => (
          <div 
            key={index}
            className="w-full flex-shrink-0 flex flex-row-reverse items-center gap-4 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end gap-2">
                <h3 className="text-white font-medium">{slide.title}</h3>
                {slide.icon}
              </div>
              <p className="text-sm text-zinc-400">{slide.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentSlide === index ? 'bg-white' : 'bg-white/30'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;

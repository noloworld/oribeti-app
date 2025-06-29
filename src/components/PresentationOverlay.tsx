'use client';

import React, { useEffect, useState } from 'react';
import { usePresentation } from './PresentationContext';
import { FaPlay, FaPause, FaStop, FaChevronLeft, FaChevronRight, FaExpand, FaCompress } from 'react-icons/fa';

export default function PresentationOverlay() {
  const {
    isPresenting,
    currentStep,
    steps,
    currentStepData,
    nextStep,
    previousStep,
    stopPresentation,
    isAutoPlaying,
    toggleAutoPlay,
  } = usePresentation();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPresenting || !currentStepData) return;

    const duration = currentStepData.duration || 3000;
    const interval = 50;
    const steps = duration / interval;
    let currentProgress = 0;

    const timer = setInterval(() => {
      currentProgress += 1;
      setProgress((currentProgress / steps) * 100);
      
      if (currentProgress >= steps) {
        setProgress(0);
        clearInterval(timer);
      }
    }, interval);

    return () => {
      clearInterval(timer);
      setProgress(0);
    };
  }, [currentStep, isPresenting, currentStepData]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (!isPresenting || !currentStepData) return null;

  const getPositionClasses = () => {
    switch (currentStepData.position) {
      case 'top':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'left-4 top-1/2 transform -translate-y-1/2';
      case 'right':
        return 'right-4 top-1/2 transform -translate-y-1/2';
      case 'center':
      default:
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    }
  };

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] pointer-events-none" />
      
      {/* Main presentation card */}
      <div className={`fixed ${getPositionClasses()} z-[10000] pointer-events-auto`}>
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-1 rounded-2xl shadow-2xl animate-pulse">
          <div className="bg-white rounded-xl p-6 max-w-md min-w-80">
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step counter */}
            <div className="text-xs text-gray-500 mb-2 text-center">
              Passo {currentStep + 1} de {steps.length}
            </div>

            {/* Title with animation */}
            <h3 className="text-xl font-bold text-gray-800 mb-3 text-center animate-bounce">
              {currentStepData.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-6 text-center leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Controls */}
            <div className="flex justify-between items-center">
              <button
                onClick={previousStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg transition-all"
              >
                <FaChevronLeft className="w-3 h-3" />
                Anterior
              </button>

              <div className="flex gap-2">
                <button
                  onClick={toggleAutoPlay}
                  className={`p-2 rounded-lg transition-all ${
                    isAutoPlaying 
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-600' 
                      : 'bg-green-100 hover:bg-green-200 text-green-600'
                  }`}
                  title={isAutoPlaying ? 'Pausar' : 'Reproduzir'}
                >
                  {isAutoPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all"
                  title="Ecrã completo"
                >
                  {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
                </button>

                <button
                  onClick={stopPresentation}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                  title="Parar apresentação"
                >
                  <FaStop className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg transition-all"
              >
                Próximo
                <FaChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spotlight effect for highlighted elements */}
      {currentStepData.element && (
        <style jsx global>{`
          ${currentStepData.element} {
            position: relative;
            z-index: 10001;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 
                        0 0 30px rgba(59, 130, 246, 0.8),
                        inset 0 0 30px rgba(59, 130, 246, 0.3);
            border-radius: 8px;
            animation: spotlightPulse 2s infinite;
          }
          
          @keyframes spotlightPulse {
            0%, 100% { 
              box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 
                          0 0 30px rgba(59, 130, 246, 0.8),
                          inset 0 0 30px rgba(59, 130, 246, 0.3);
            }
            50% { 
              box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 
                          0 0 50px rgba(59, 130, 246, 1),
                          inset 0 0 50px rgba(59, 130, 246, 0.5);
            }
          }
        `}</style>
      )}

      {/* Floating particles animation */}
      <div className="fixed inset-0 pointer-events-none z-[9998]">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 1;
          }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </>
  );
} 
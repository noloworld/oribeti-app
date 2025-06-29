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

  return (
    <>
      {/* Top presentation bar - non-intrusive */}
      <div className="fixed top-0 left-0 right-0 z-[10000] pointer-events-auto">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 shadow-2xl">
          <div className="px-6 py-4">
            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-1 mb-3">
              <div 
                className="bg-white h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-white">
              {/* Left: Step info */}
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium opacity-90">
                  Passo {currentStep + 1} de {steps.length}
                </div>
                <div className="text-lg font-bold">
                  {currentStepData.title}
                </div>
              </div>

              {/* Center: Description */}
              <div className="flex-1 mx-8 text-center">
                <p className="text-white/90 font-medium">
                  {currentStepData.description}
                </p>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 rounded-lg transition-all"
                  title="Anterior"
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleAutoPlay}
                  className={`p-2 rounded-lg transition-all ${
                    isAutoPlaying 
                      ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-200' 
                      : 'bg-green-500/20 hover:bg-green-500/30 text-green-200'
                  }`}
                  title={isAutoPlaying ? 'Pausar' : 'Reproduzir'}
                >
                  {isAutoPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />}
                </button>

                <button
                  onClick={stopPresentation}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-all"
                  title="Parar apresentação"
                >
                  <FaStop className="w-4 h-4" />
                </button>

                <button
                  onClick={nextStep}
                  disabled={currentStep === steps.length - 1}
                  className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 rounded-lg transition-all"
                  title="Próximo"
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle background overlay */}
      <div className="fixed inset-0 bg-blue-900/10 backdrop-blur-[1px] z-[9999] pointer-events-none" />

      {/* Floating arrow pointing to highlighted element */}
      {currentStepData.element && (
        <div className="fixed z-[10001] pointer-events-none">
          <div className="animate-bounce">
            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
              👆 Veja aqui!
            </div>
          </div>
        </div>
      )}

      {/* Elegant floating particles */}
      <div className="fixed inset-0 pointer-events-none z-[9998]">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full opacity-30 animate-float ${
              i % 3 === 0 ? 'w-3 h-3 bg-blue-300' :
              i % 3 === 1 ? 'w-2 h-2 bg-purple-300' :
              'w-4 h-4 bg-indigo-200'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* All custom styles in one block */}
      <style jsx global>{`
        /* Add padding to body when presentation is active */
        body {
          padding-top: 80px !important;
        }

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

        @keyframes spotlightPulse {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
            border: 3px solid rgba(59, 130, 246, 0.6);
          }
          50% { 
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
            border: 3px solid rgba(59, 130, 246, 0.9);
          }
        }

        ${currentStepData?.element ? `
          ${currentStepData.element} {
            position: relative;
            z-index: 10001;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
            border: 3px solid rgba(59, 130, 246, 0.6) !important;
            border-radius: 12px !important;
            animation: spotlightPulse 3s ease-in-out infinite !important;
          }
        ` : ''}
      `}</style>
    </>
  );
} 
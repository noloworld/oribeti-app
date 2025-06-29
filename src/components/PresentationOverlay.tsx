'use client';

import React, { useEffect, useState } from 'react';
import { usePresentation } from './PresentationContext';
import { FaPlay, FaPause, FaStop, FaChevronLeft, FaChevronRight, FaExpand, FaCompress } from 'react-icons/fa';

// Hollywood Intro Component
function HollywoodIntro({ onSkip }: { onSkip: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const phases = [
      { delay: 0, duration: 1500 }, // Logo aparecer
      { delay: 1500, duration: 2000 }, // Texto principal
      { delay: 3500, duration: 2000 }, // Efeitos especiais
      { delay: 5500, duration: 2500 }, // Final épico
    ];

    phases.forEach((phaseConfig, index) => {
      setTimeout(() => {
        setPhase(index + 1);
      }, phaseConfig.delay);
    });

    // Auto skip after 8 seconds
    setTimeout(() => {
      onSkip();
    }, 8000);
  }, [onSkip]);

  return (
    <div className="fixed inset-0 z-[20000] bg-black overflow-hidden">
      {/* Starfield Background */}
      <div className="absolute inset-0">
        {[...Array(200)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Shooting Stars/Meteors */}
      {phase >= 2 && (
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-20 bg-gradient-to-b from-white via-blue-300 to-transparent animate-meteor"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-100px',
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${2 + Math.random()}s`,
                transform: `rotate(${45 + Math.random() * 20}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Cinematic Bars */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-black z-10 animate-slideDown"></div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-black z-10 animate-slideUp"></div>

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-white">
        
        {/* Phase 1: Logo Epic Entrance */}
        {phase >= 1 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-logoEntrance">
              <div className="text-8xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                ORIBETI
              </div>
              <div className="w-64 h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-expand"></div>
            </div>
          </div>
        )}

        {/* Phase 2: Epic Text Reveal */}
        {phase >= 2 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-textReveal">
              <div className="text-6xl font-bold mb-8 animate-glow">
                APRESENTAÇÃO
              </div>
              <div className="text-3xl font-light tracking-widest animate-typewriter">
                ESPETACULAR
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Particle Explosion */}
        {phase >= 3 && (
          <>
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full animate-explode"
                style={{
                  left: '50%',
                  top: '50%',
                  animationDelay: `${i * 20}ms`,
                  '--random-x': `${(Math.random() - 0.5) * 1000}px`,
                  '--random-y': `${(Math.random() - 0.5) * 1000}px`,
                } as any}
              />
            ))}
          </>
        )}

        {/* Phase 4: Final Epic Text */}
        {phase >= 4 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-finalReveal">
              <div className="text-7xl font-black mb-6 bg-gradient-to-r from-yellow-300 via-red-500 to-purple-600 bg-clip-text text-transparent animate-rainbow">
                PREPARE-SE
              </div>
              <div className="text-4xl font-bold text-white animate-bounce">
                PARA O FUTURO!
              </div>
              {/* Epic Shockwave */}
              <div className="absolute inset-0 border-4 border-white rounded-full animate-shockwave"></div>
              <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-shockwave2"></div>
            </div>
          </div>
        )}

        {/* Lightning Effects */}
        {phase >= 3 && (
          <>
            <div className="absolute inset-0 bg-white opacity-20 animate-lightning"></div>
            <div className="absolute inset-0 bg-blue-500 opacity-10 animate-lightning2"></div>
          </>
        )}

        {/* Visual Equalizer */}
        {phase >= 2 && (
          <div className="absolute bottom-20 left-8 flex items-end gap-1 animate-fadeIn" style={{ animationDelay: '3s' }}>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="bg-gradient-to-t from-blue-500 to-purple-500 w-2 animate-equalizer"
                style={{
                  height: `${20 + Math.random() * 40}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              />
            ))}
            <span className="ml-3 text-white/70 text-sm">♪ EPIC SOUNDTRACK ♪</span>
          </div>
        )}

        {/* Skip Button */}
        <button
          onClick={onSkip}
          className="absolute bottom-8 right-8 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all duration-300 animate-fadeIn"
          style={{ animationDelay: '2s' }}
        >
          Pular Intro →
        </button>
      </div>

      {/* Epic Styles */}
      <style jsx>{`
        @keyframes logoEntrance {
          0% { 
            transform: scale(0) rotate(180deg); 
            opacity: 0; 
          }
          50% { 
            transform: scale(1.2) rotate(0deg); 
            opacity: 1; 
          }
          100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 1; 
          }
        }

        @keyframes textReveal {
          0% { 
            transform: translateY(100px) rotateX(90deg); 
            opacity: 0; 
          }
          100% { 
            transform: translateY(0) rotateX(0deg); 
            opacity: 1; 
          }
        }

        @keyframes explode {
          0% { 
            transform: translate(0, 0) scale(0); 
            opacity: 1; 
          }
          100% { 
            transform: translate(var(--random-x), var(--random-y)) scale(1); 
            opacity: 0; 
          }
        }

        @keyframes finalReveal {
          0% { 
            transform: scale(0.5) rotateY(180deg); 
            opacity: 0; 
          }
          50% { 
            transform: scale(1.1) rotateY(0deg); 
            opacity: 1; 
          }
          100% { 
            transform: scale(1) rotateY(0deg); 
            opacity: 1; 
          }
        }

        @keyframes glow {
          0%, 100% { 
            text-shadow: 0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3); 
          }
          50% { 
            text-shadow: 0 0 40px rgba(255,255,255,0.8), 0 0 80px rgba(255,255,255,0.6); 
          }
        }

        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes lightning {
          0%, 90%, 100% { opacity: 0; }
          5%, 10% { opacity: 0.3; }
        }

        @keyframes lightning2 {
          0%, 85%, 100% { opacity: 0; }
          15%, 20% { opacity: 0.2; }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }

        @keyframes slideDown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(0); }
        }

        @keyframes slideUp {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }

        @keyframes expand {
          0% { width: 0; }
          100% { width: 16rem; }
        }

        @keyframes typewriter {
          0% { width: 0; }
          100% { width: 100%; }
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes shockwave {
          0% { 
            transform: scale(0); 
            opacity: 1; 
          }
          100% { 
            transform: scale(4); 
            opacity: 0; 
          }
        }

        @keyframes shockwave2 {
          0% { 
            transform: scale(0); 
            opacity: 1; 
          }
          100% { 
            transform: scale(6); 
            opacity: 0; 
          }
        }

        @keyframes meteor {
          0% { 
            transform: translateY(-100vh) translateX(-50px) rotate(45deg); 
            opacity: 0; 
          }
          10% { 
            opacity: 1; 
          }
          90% { 
            opacity: 1; 
          }
          100% { 
            transform: translateY(100vh) translateX(50px) rotate(45deg); 
            opacity: 0; 
          }
        }

        @keyframes equalizer {
          0%, 100% { 
            transform: scaleY(0.3); 
          }
          50% { 
            transform: scaleY(1); 
          }
        }

        .animate-logoEntrance { animation: logoEntrance 1.5s ease-out forwards; }
        .animate-textReveal { animation: textReveal 1s ease-out 0.5s forwards; opacity: 0; }
        .animate-explode { animation: explode 1.5s ease-out forwards; }
        .animate-finalReveal { animation: finalReveal 1.2s ease-out forwards; opacity: 0; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .animate-rainbow { 
          background-size: 200% 200%; 
          animation: rainbow 3s ease-in-out infinite; 
        }
        .animate-lightning { animation: lightning 0.1s infinite; }
        .animate-lightning2 { animation: lightning2 0.15s infinite; }
        .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
        .animate-slideDown { animation: slideDown 0.8s ease-out; }
        .animate-slideUp { animation: slideUp 0.8s ease-out; }
        .animate-expand { animation: expand 1s ease-out 0.5s forwards; width: 0; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
        .animate-shockwave { animation: shockwave 2s ease-out infinite; }
        .animate-shockwave2 { animation: shockwave2 2.5s ease-out infinite 0.5s; }
        .animate-meteor { animation: meteor 2s linear infinite; }
        .animate-equalizer { animation: equalizer 0.5s ease-in-out infinite alternate; transform-origin: bottom; }
      `}</style>
    </div>
  );
}

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
    isIntroPlaying,
    skipIntro,
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

  if (!isPresenting) return null;

  // Show intro if intro is playing
  if (isIntroPlaying) {
    return <HollywoodIntro onSkip={skipIntro} />;
  }

  // Show main presentation if not intro and has step data
  if (!currentStepData) return null;

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
      {currentStepData.highlightSelector && (
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

        ${currentStepData?.highlightSelector ? `
          ${currentStepData.highlightSelector} {
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
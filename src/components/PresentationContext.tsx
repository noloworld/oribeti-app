'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PresentationStep {
  id: string;
  title: string;
  description: string;
  page: string;
  duration?: number;
}

interface PresentationContextType {
  isPresenting: boolean;
  currentStep: number;
  steps: PresentationStep[];
  startPresentation: () => void;
  stopPresentation: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  currentStepData: PresentationStep | null;
  isAutoPlaying: boolean;
  toggleAutoPlay: () => void;
  isIntroPlaying: boolean;
  skipIntro: () => void;
}

const PresentationContext = createContext<PresentationContextType | null>(null);

const PRESENTATION_STEPS: PresentationStep[] = [
  {
    id: 'welcome',
    title: '🎉 Bem-vindo ao Oribeti',
    description: 'Sistema de gestão para o meu mini negócio',
    page: '/dashboard',
    duration: 8000
  },
  {
    id: 'dashboard-overview',
    title: '📊 Dashboard - Centro de Controlo',
    description: 'Visão geral completa do meu negócio em tempo real',
    page: '/dashboard',
    duration: 12000
  },
  {
    id: 'vendas-system',
    title: '💰 Sistema de Vendas',
    description: 'Gerencia todas as tuas vendas e pagamentos de forma inteligente',
    page: '/dashboard/vendas',
    duration: 15000
  },
  {
    id: 'devedores-control',
    title: '⚠️ Devedores',
    description: 'Acompanha clientes em dívida e gerencia cobranças automaticamente quando te pagam',
    page: '/dashboard/devedores',
    duration: 12000
  },
  {
    id: 'chat-system',
    title: '💬 Chat em Tempo Real',
    description: 'Comunicação instantânea com a equipa em tempo real',
    page: '/dashboard/chat',
    duration: 10000
  },
  {
    id: 'sorteios-engagement',
    title: '🎲 Sorteios',
    description: 'Cria sorteios de natal, páscoa, etc...',
    page: '/dashboard/sorteios',
    duration: 12000
  },
  {
    id: 'notifications-smart',
    title: '🔔 Notificações Inteligentes',
    description: 'Sistema de notificações inteligente integrado com o chat e os devedores',
    page: '/dashboard',
    duration: 10000
  },
  {
    id: 'conclusion',
    title: '🚀 Oribeti - O Futuro da Gestão!',
    description: 'Sistema criado por Manolo - Vendo Systems',
    page: '/dashboard',
    duration: 8000
  }
];

export function PresentationProvider({ children }: { children: React.ReactNode }) {
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isIntroPlaying, setIsIntroPlaying] = useState(false);
  const router = useRouter();

  const startPresentation = () => {
    setIsPresenting(true);
    setIsIntroPlaying(true);
    setCurrentStep(0);
    setIsAutoPlaying(true);
  };

  const skipIntro = () => {
    setIsIntroPlaying(false);
  };

  const stopPresentation = () => {
    setIsPresenting(false);
    setIsIntroPlaying(false);
    setCurrentStep(0);
    setIsAutoPlaying(false);
  };

  const nextStep = () => {
    if (currentStep < PRESENTATION_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      stopPresentation();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < PRESENTATION_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const currentStepData = isPresenting ? PRESENTATION_STEPS[currentStep] : null;

  // Auto-advance and navigation
  useEffect(() => {
    if (!isPresenting || !currentStepData || isIntroPlaying) return;

    // Navigate immediately to the page for this step
    if (currentStepData.page) {
      console.log(`🚀 Navegando para: ${currentStepData.page}`);
      router.push(currentStepData.page);
    }

    // Auto advance only if autoplay is enabled
    if (isAutoPlaying && currentStepData.duration) {
      const timer = setTimeout(() => {
        console.log(`⏭️ Avançando para próximo passo após ${currentStepData.duration}ms`);
        nextStep();
      }, currentStepData.duration);

      return () => clearTimeout(timer);
    }
  }, [currentStep, isPresenting, isAutoPlaying, currentStepData, router, isIntroPlaying]);

  const value: PresentationContextType = {
    isPresenting,
    currentStep,
    steps: PRESENTATION_STEPS,
    startPresentation,
    stopPresentation,
    nextStep,
    previousStep,
    goToStep,
    currentStepData,
    isAutoPlaying,
    toggleAutoPlay,
    isIntroPlaying,
    skipIntro,
  };

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentation() {
  const context = useContext(PresentationContext);
  if (!context) {
    throw new Error('usePresentation must be used within a PresentationProvider');
  }
  return context;
} 
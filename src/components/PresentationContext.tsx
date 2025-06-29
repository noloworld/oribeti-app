'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PresentationStep {
  id: string;
  title: string;
  description: string;
  page: string;
  element?: string;
  action?: 'click' | 'scroll' | 'highlight' | 'navigate';
  duration?: number;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightSelector?: string | null;
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
    description: 'Sistema de gestão completo para o seu negócio',
    page: '/dashboard',
    highlightSelector: null,
    duration: 15000
  },
  {
    id: 'dashboard-overview',
    title: '📊 Dashboard - Centro de Controlo',
    description: 'Visão geral completa do seu negócio em tempo real',
    page: '/dashboard',
    highlightSelector: '.grid.grid-cols-1.md\\:grid-cols-5.gap-6.mb-8',
    duration: 15000
  },
  {
    id: 'vendas-system',
    title: '💰 Sistema de Vendas Inteligente',
    description: 'Clique em "Adicionar Venda" para registrar uma nova venda. Abaixo vê todas as vendas por cliente organizadas',
    page: '/dashboard/vendas',
    highlightSelector: 'button:contains("Adicionar Venda"), .bg-gray-800.rounded-lg.p-6',
    duration: 15000
  },
  {
    id: 'devedores-control',
    title: '⚠️ Controlo Automático de Devedores',
    description: 'Vê detalhadamente cada cliente que te deve dinheiro, clicando no cliente',
    page: '/dashboard/devedores',
    highlightSelector: '.space-y-4',
    duration: 15000
  },
  {
    id: 'chat-system',
    title: '💬 Chat em Tempo Real',
    description: 'Um chat para comunicação de problemas no site',
    page: '/dashboard/chat',
    highlightSelector: '.flex.flex-col.h-\\[600px\\]',
    duration: 15000
  },
  {
    id: 'sorteios-engagement',
    title: '🎲 Sorteios para Engajamento',
    description: 'Funcionalidade exclusiva! Crie sorteios, adicione prémios e aumente o envolvimento dos clientes',
    page: '/dashboard/sorteios',
    highlightSelector: '.bg-blue-600',
    duration: 15000
  },
  {
    id: 'notifications-smart',
    title: '🔔 Notificações Inteligentes',
    description: 'Sistema completo, moderno e intuitivo. Transforme o seu negócio com tecnologia de ponta!',
    page: '/dashboard',
    highlightSelector: '.relative button[aria-label*="notificações"], .bg-red-500',
    duration: 15000
  },
  {
    id: 'conclusion',
    title: '🚀 Oribeti - O Futuro da Gestão!',
    description: 'Sistema criado por Manolo - vendo systems',
    page: '/dashboard',
    highlightSelector: null,
    duration: 15000
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
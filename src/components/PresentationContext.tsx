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
}

const PresentationContext = createContext<PresentationContextType | null>(null);

const PRESENTATION_STEPS: PresentationStep[] = [
  {
    id: 'welcome',
    title: '🎉 Bem-vindo ao Oribeti!',
    description: 'Sistema completo de gestão para revendedores. Vamos explorar as funcionalidades principais!',
    page: '/dashboard',
    duration: 15000,
    position: 'center'
  },
  {
    id: 'dashboard-overview',
    title: '📊 Dashboard - Centro de Controlo',
    description: 'Visão completa do seu negócio: vendas totais, lucros, devedores e muito mais. Tudo numa só tela!',
    page: '/dashboard',
    element: '.grid',
    duration: 15000,
    position: 'top'
  },
  {
    id: 'vendas-system',
    title: '💰 Sistema de Vendas Inteligente',
    description: 'Registe vendas, gerencie pagamentos parciais, e controle automaticamente os valores em dívida.',
    page: '/dashboard/vendas',
    action: 'navigate',
    duration: 15000,
    position: 'center'
  },
  {
    id: 'devedores-control',
    title: '⚠️ Controlo Automático de Devedores',
    description: 'Sistema único que distribui pagamentos entre várias vendas automaticamente. Nunca mais perca dinheiro!',
    page: '/dashboard/devedores',
    action: 'navigate',
    duration: 15000,
    position: 'center'
  },
  {
    id: 'chat-system',
    title: '💬 Chat em Tempo Real',
    description: 'Comunicação instantânea com a equipa, notificações inteligentes e indicador de escrita.',
    page: '/dashboard/chat',
    action: 'navigate',
    duration: 15000,
    position: 'center'
  },
  {
    id: 'sorteios-engagement',
    title: '🎲 Sorteios para Engajamento',
    description: 'Funcionalidade exclusiva! Crie sorteios, adicione prémios e aumente o envolvimento dos clientes.',
    page: '/dashboard/sorteios',
    action: 'navigate',
    duration: 15000,
    position: 'center'
  },
  {
    id: 'notifications-smart',
    title: '🔔 Notificações Inteligentes',
    description: 'Sistema avançado que alerta sobre vendas pendentes há mais de 2 meses e novas mensagens.',
    page: '/dashboard',
    action: 'navigate',
    element: '[data-notification-widget]',
    duration: 15000,
    position: 'left'
  },
  {
    id: 'conclusion',
    title: '🚀 Oribeti - O Futuro da Gestão!',
    description: 'Sistema completo, moderno e intuitivo. Transforme o seu negócio com tecnologia de ponta!',
    page: '/dashboard',
    duration: 15000,
    position: 'center'
  }
];

export function PresentationProvider({ children }: { children: React.ReactNode }) {
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const router = useRouter();

  const startPresentation = () => {
    setIsPresenting(true);
    setCurrentStep(0);
    setIsAutoPlaying(true);
  };

  const stopPresentation = () => {
    setIsPresenting(false);
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
    if (!isPresenting || !isAutoPlaying || !currentStepData) return;

    const timer = setTimeout(() => {
      // Navigate if needed
      if (currentStepData.action === 'navigate' && currentStepData.page) {
        router.push(currentStepData.page);
      }

      // Auto advance after duration
      if (currentStepData.duration) {
        setTimeout(() => {
          nextStep();
        }, 1000); // Small delay after navigation
      }
    }, currentStepData.duration || 3000);

    return () => clearTimeout(timer);
  }, [currentStep, isPresenting, isAutoPlaying, currentStepData, router]);

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
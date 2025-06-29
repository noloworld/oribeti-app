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
    description: 'Vou guiá-lo numa apresentação completa do sistema de gestão mais avançado para revendedores!',
    page: '/dashboard',
    duration: 4000,
    position: 'center'
  },
  {
    id: 'dashboard-overview',
    title: '📊 Dashboard Principal',
    description: 'Este é o centro de controlo! Aqui vê todas as estatísticas importantes do seu negócio em tempo real.',
    page: '/dashboard',
    element: '.grid',
    duration: 5000,
    position: 'top'
  },
  {
    id: 'vendas-navigation',
    title: '💰 Gestão de Vendas',
    description: 'Vamos ver como gerir as suas vendas de forma inteligente!',
    page: '/dashboard/vendas',
    action: 'navigate',
    duration: 3000,
    position: 'center'
  },
  {
    id: 'vendas-overview',
    title: '📈 Painel de Vendas',
    description: 'Aqui pode ver todas as vendas, clientes devedores, e gerir pagamentos de forma automática!',
    page: '/dashboard/vendas',
    element: '.grid',
    duration: 6000,
    position: 'top'
  },
  {
    id: 'add-venda-demo',
    title: '➕ Adicionar Nova Venda',
    description: 'Vou mostrar como é fácil adicionar uma nova venda!',
    page: '/dashboard/vendas',
    element: 'button:contains("Adicionar Venda")',
    action: 'highlight',
    duration: 4000,
    position: 'bottom'
  },
  {
    id: 'clientes-navigation',
    title: '👥 Gestão de Clientes',
    description: 'Agora vamos ver a gestão completa de clientes!',
    page: '/dashboard/clientes',
    action: 'navigate',
    duration: 3000,
    position: 'center'
  },
  {
    id: 'clientes-overview',
    title: '📋 Base de Clientes',
    description: 'Mantenha todos os dados dos seus clientes organizados e acessíveis!',
    page: '/dashboard/clientes',
    duration: 5000,
    position: 'center'
  },
  {
    id: 'devedores-navigation',
    title: '⚠️ Gestão de Devedores',
    description: 'Uma funcionalidade poderosa para controlar quem deve dinheiro!',
    page: '/dashboard/devedores',
    action: 'navigate',
    duration: 3000,
    position: 'center'
  },
  {
    id: 'devedores-overview',
    title: '💳 Controlo de Dívidas',
    description: 'Veja quem deve, quanto deve, e abata dívidas automaticamente distribuindo entre várias vendas!',
    page: '/dashboard/devedores',
    duration: 6000,
    position: 'center'
  },
  {
    id: 'sorteios-navigation',
    title: '🎲 Sistema de Sorteios',
    description: 'Funcionalidade única para criar sorteios e engajar clientes!',
    page: '/dashboard/sorteios',
    action: 'navigate',
    duration: 3000,
    position: 'center'
  },
  {
    id: 'sorteios-overview',
    title: '🏆 Sorteios Interativos',
    description: 'Crie sorteios, adicione prémios, e faça os seus clientes participarem!',
    page: '/dashboard/sorteios',
    duration: 5000,
    position: 'center'
  },
  {
    id: 'chat-navigation',
    title: '💬 Chat Interno',
    description: 'Sistema de comunicação em tempo real para a sua equipa!',
    page: '/dashboard/chat',
    action: 'navigate',
    duration: 3000,
    position: 'center'
  },
  {
    id: 'chat-overview',
    title: '🗨️ Comunicação em Tempo Real',
    description: 'Chat moderno com notificações, indicador de escrita, e histórico completo!',
    page: '/dashboard/chat',
    duration: 5000,
    position: 'center'
  },
  {
    id: 'despesas-navigation',
    title: '💸 Controlo de Despesas',
    description: 'Gerencie todas as despesas do seu negócio!',
    page: '/dashboard/despesas',
    action: 'navigate',
    duration: 3000,
    position: 'center'
  },
  {
    id: 'despesas-overview',
    title: '📊 Gestão Financeira',
    description: 'Mantenha controlo total sobre todas as despesas e custos!',
    page: '/dashboard/despesas',
    duration: 5000,
    position: 'center'
  },
  {
    id: 'notifications-demo',
    title: '🔔 Sistema de Notificações',
    description: 'Repare no sistema inteligente de notificações no canto superior direito!',
    page: '/dashboard',
    action: 'navigate',
    element: '[data-notification-widget]',
    duration: 4000,
    position: 'left'
  },
  {
    id: 'mobile-responsive',
    title: '📱 Design Responsivo',
    description: 'Todo o sistema é completamente responsivo e funciona perfeitamente em dispositivos móveis!',
    page: '/dashboard',
    duration: 4000,
    position: 'center'
  },
  {
    id: 'conclusion',
    title: '🎊 Apresentação Concluída!',
    description: 'Parabéns! Viu todas as funcionalidades incríveis do Oribeti. Este é o futuro da gestão de revendas!',
    page: '/dashboard',
    duration: 5000,
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
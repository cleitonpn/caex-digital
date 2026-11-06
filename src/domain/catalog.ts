import type { ServiceCategoryId } from './types';

export interface ServiceCategory {
  id: ServiceCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  riskWeight: number;
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'carpentry',
    label: 'Marcenaria',
    shortLabel: 'Marcenaria',
    description: 'Estruturas, painéis, balcões, portas e acabamentos em madeira.',
    riskWeight: 12,
  },
  {
    id: 'electrical',
    label: 'Elétrica',
    shortLabel: 'Elétrica',
    description: 'Energia, iluminação, tomadas, cabeamento e risco elétrico.',
    riskWeight: 30,
  },
  {
    id: 'upholstery',
    label: 'Tapeçaria',
    shortLabel: 'Tapeçaria',
    description: 'Forração de paredes, carpetes, tecidos e acabamentos.',
    riskWeight: 9,
  },
  {
    id: 'visual_communication',
    label: 'Comunicação visual',
    shortLabel: 'Com. visual',
    description: 'Logos, lonas, adesivos, testeiras e artes instaladas.',
    riskWeight: 10,
  },
  {
    id: 'cleaning',
    label: 'Limpeza',
    shortLabel: 'Limpeza',
    description: 'Limpeza de montagem ou limpeza contratada durante o evento.',
    riskWeight: 8,
  },
  {
    id: 'furniture',
    label: 'Mobiliário',
    shortLabel: 'Mobiliário',
    description: 'Mesas, cadeiras, balcões, armários e móveis locados.',
    riskWeight: 7,
  },
  {
    id: 'landscaping',
    label: 'Paisagismo',
    shortLabel: 'Paisagismo',
    description: 'Plantas, vasos, jardins e elementos naturais.',
    riskWeight: 5,
  },
  {
    id: 'av',
    label: 'Áudio e vídeo',
    shortLabel: 'A/V',
    description: 'TVs, painéis de LED, áudio, vídeo e equipamentos relacionados.',
    riskWeight: 15,
  },
  {
    id: 'ab',
    label: 'A/B',
    shortLabel: 'A/B',
    description: 'Atendimento da equipe A/B conforme o escopo contratado.',
    riskWeight: 6,
  },
];

export const categoryById = Object.fromEntries(
  serviceCategories.map((category) => [category.id, category]),
) as Record<ServiceCategoryId, ServiceCategory>;

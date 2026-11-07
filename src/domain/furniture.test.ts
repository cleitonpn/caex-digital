import { describe, expect, it } from 'vitest';
import { formatFurnitureList, parseFurnitureList } from './furniture';

describe('mobiliário da importação', () => {
  it('separa itens por barra e extrai a quantidade inicial', () => {
    expect(parseFurnitureList('3 cadeiras dkr / 1 mesa dkr / 1 lixeira / 1 tv de 43pol')).toEqual([
      { quantity: 3, type: 'cadeiras dkr' },
      { quantity: 1, type: 'mesa dkr' },
      { quantity: 1, type: 'lixeira' },
      { quantity: 1, type: 'tv de 43pol' },
    ]);
  });

  it('aceita vírgulas, x após a quantidade e assume uma unidade sem número', () => {
    expect(parseFurnitureList('2x banquetas, balcão de atendimento, 4 mesas')).toEqual([
      { quantity: 2, type: 'banquetas' },
      { quantity: 1, type: 'balcão de atendimento' },
      { quantity: 4, type: 'mesas' },
    ]);
  });

  it('formata os itens para edição e exportação', () => {
    expect(formatFurnitureList([{ quantity: 3, type: 'cadeiras' }, { quantity: 1, type: 'mesa' }])).toBe('3 cadeiras / 1 mesa');
  });
});

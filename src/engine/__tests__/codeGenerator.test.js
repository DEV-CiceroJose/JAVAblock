import { describe, it, expect } from 'vitest';
import { generateJava } from '../codeGenerator.js';

const inst = (blockId, fields = {}, children = []) =>
  ({ instanceId: blockId + '-1', blockId, fields, children });

describe('generateJava', () => {
  it('envolve em class Main + main', () => {
    const { code } = generateJava([]);
    expect(code).toContain('public class Main');
    expect(code).toContain('public static void main(String[] args)');
  });

  it('gera bloco simples substituindo campos', () => {
    const { code } = generateJava([inst('print', { text: '"Oi"' })]);
    expect(code).toContain('System.out.println("Oi");');
  });

  it('container vazio recebe marcador de falta', () => {
    const { code } = generateJava([inst('try', {}, [])]);
    expect(code).toContain('try {');
    expect(code).toContain('// Falta completar aqui');
    expect(code).toContain('}');
  });

  it('container com filhos indenta os filhos', () => {
    const { code } = generateJava([
      inst('try', {}, [inst('print', { text: '"x"' })])
    ]);
    const linhas = code.split('\n');
    const idxPrint = linhas.findIndex((l) => l.includes('println'));
    expect(linhas[idxPrint].startsWith('      ')).toBe(true); // indentado dentro de main+try
  });

  it('cada linha de conteúdo mapeia para seu instanceId', () => {
    const { lines } = generateJava([inst('print', { text: '"Oi"' })]);
    const linha = lines.find((l) => l.text.includes('println'));
    expect(linha.instanceId).toBe('print-1');
  });
});

import { getBlock } from '../data/blocks.js';

export function flatten(instances) {
  const out = [];
  for (const node of instances || []) {
    out.push(node.blockId);
    if (node.children && node.children.length) out.push(...flatten(node.children));
  }
  return out;
}

function rotulo(id) {
  const b = getBlock(id);
  return b ? b.label : id;
}

export function validate(instances, challenge) {
  const { obrigatorios = [], proibidos = [], ordem = [], quantidadeMinima = 0 } = challenge.regras || {};
  const seq = flatten(instances);

  // 1. Blocos proibidos
  for (const id of proibidos) {
    if (seq.includes(id)) {
      return { ok: false, mensagem:
        `O bloco "${rotulo(id)}" não deve ser usado neste desafio. Tente resolver de outra forma.` };
    }
  }

  // 2. Blocos obrigatórios ausentes (check before quantidadeMinima for specific messages)
  for (const id of obrigatorios) {
    if (!seq.includes(id)) {
      // mensagem especial para try/catch
      if (id === 'catch' && seq.includes('try')) {
        return { ok: false, mensagem:
          'O bloco try está no lugar certo. Lembre-se de que todo try precisa de pelo menos um catch para tratar o erro.' };
      }
      return { ok: false, mensagem:
        `Ainda falta usar o bloco "${rotulo(id)}". Ele é necessário para uma das etapas do desafio.` };
    }
  }

  // 3. Quantidade mínima
  if (seq.length < quantidadeMinima) {
    return { ok: false, mensagem:
      `Seu programa ainda está pequeno para resolver o problema. Faltam blocos para completar todas as etapas do desafio.` };
  }

  // 4. Ordem (pares "A antes de B")
  for (const [a, b] of ordem) {
    const ia = seq.indexOf(a);
    const ib = seq.indexOf(b);
    if (ia === -1 || ib === -1) continue; // ausência já tratada acima
    if (ia > ib) {
      return { ok: false, mensagem:
        `Você está no caminho certo, mas a ordem precisa de ajuste: o bloco "${rotulo(a)}" deve vir antes de "${rotulo(b)}".` };
    }
  }

  return { ok: true, mensagem: 'Parabéns! Você concluiu este desafio.' };
}

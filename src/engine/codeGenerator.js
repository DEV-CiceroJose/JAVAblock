import { getBlock } from '../data/blocks.js';

const INDENT = '  ';

function fillTemplate(template, fields = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    fields[k] !== undefined && fields[k] !== '' ? fields[k] : `/*${k}*/`
  );
}

// Devolve array de { text, instanceId }
function emit(instances, depth) {
  const pad = INDENT.repeat(depth);
  const out = [];
  for (const node of instances) {
    const def = getBlock(node.blockId);
    if (!def) continue;
    if (def.container) {
      out.push({ text: pad + fillTemplate(def.template, node.fields), instanceId: node.instanceId });
      if (!node.children || node.children.length === 0) {
        out.push({ text: pad + INDENT + '// Falta completar aqui', instanceId: node.instanceId });
      } else {
        out.push(...emit(node.children, depth + 1));
      }
      out.push({ text: pad + '}', instanceId: node.instanceId });
    } else {
      out.push({ text: pad + fillTemplate(def.template, node.fields), instanceId: node.instanceId });
    }
  }
  return out;
}

export function generateJava(instances) {
  const header = [
    { text: 'public class Main {', instanceId: null },
    { text: INDENT + 'public static void main(String[] args) {', instanceId: null }
  ];
  const body = emit(instances || [], 2);
  const footer = [
    { text: INDENT + '}', instanceId: null },
    { text: '}', instanceId: null }
  ];
  const lines = [...header, ...body, ...footer];
  return { code: lines.map((l) => l.text).join('\n'), lines };
}

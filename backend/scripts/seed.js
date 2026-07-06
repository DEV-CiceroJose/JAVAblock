import { initFirestore } from '../src/config/firebase.js';
import { createFirestoreRepo } from '../src/repository/firestoreRepo.js';

const DESAFIOS = [
  { id: 'cadastro-seguro', modulo: 1, ordem: 1, titulo: 'Cadastro Seguro de Alunos',
    descricao: 'A secretaria da escola precisa de um programa que guarde o nome de alguns alunos e salve essa lista em um arquivo. Como a pessoa pode digitar algo errado, o programa não pode quebrar: use try, catch e finally para proteger. Crie uma lista com ArrayList, adicione alguns nomes e, por fim, escreva a lista no arquivo alunos.txt usando FileWriter e BufferedWriter.',
    objetivoPedagogico: 'Integrar Collections (ArrayList), Tratamento de Exceções e escrita de Arquivos.',
    blocosPermitidos: ['var_string','print','arraylist_criar','arraylist_add','arraylist_mostrar','try','catch','finally','throw','filewriter','bufferedwriter','escrever_arquivo','fechar_arquivo','hashset_criar'],
    regras: { obrigatorios: ['arraylist_criar','arraylist_add','try','catch','filewriter','escrever_arquivo'], proibidos: [], ordem: [['arraylist_criar','arraylist_add'],['try','catch'],['filewriter','escrever_arquivo']], quantidadeMinima: 6 },
    dicas: ['Pense em três etapas: guardar os nomes, proteger contra erros e salvar em arquivo.','Você provavelmente vai usar: Criar Lista, Adicionar Elemento, try, catch, FileWriter e Escrever Arquivo.','A ordem costuma ser: criar a lista → adicionar nomes → abrir o try → escrever no arquivo dentro do try → catch para tratar o erro.'] },
  { id: 'relatorio-notas', modulo: 1, ordem: 2, titulo: 'Relatório de Notas',
    descricao: 'O professor guardou as notas dos alunos em um arquivo chamado notas.txt. Monte um programa que leia esse arquivo com BufferedReader (protegido por try e catch, porque o arquivo pode não existir), guarde cada aluno e sua nota em um HashMap e, no final, mostre o mapa completo na tela com System.out.println().',
    objetivoPedagogico: 'Integrar leitura de Arquivos, Tratamento de Exceções e Collections (HashMap).',
    blocosPermitidos: ['var_string','print','filereader','bufferedreader','ler_linha','try','catch','finally','hashmap_criar','hashmap_add','hashmap_buscar','hashmap_mostrar','fechar_arquivo','arraylist_criar'],
    regras: { obrigatorios: ['try','catch','bufferedreader','ler_linha','hashmap_criar','hashmap_add','hashmap_mostrar'], proibidos: [], ordem: [['try','catch'],['bufferedreader','ler_linha'],['hashmap_criar','hashmap_add'],['hashmap_add','hashmap_mostrar']], quantidadeMinima: 6 },
    dicas: ['Você precisa ler de um arquivo, guardar pares nome→nota e mostrar tudo no final.','Blocos prováveis: try, catch, BufferedReader, Ler Linha, Criar Mapa, Adicionar Chave/Valor e Mostrar Mapa.','Ordem comum: criar o mapa → abrir try → BufferedReader → Ler Linha → adicionar no mapa → catch → mostrar o mapa.'] }
];
const CONFIG = { maxDicas: 3, penalidadePorDica: 15, tempoEntreDicasSeg: 15, xpBase: 100, bonusPrimeira: 30, bonusSemDicas: 20, penalidadeErro: 10, penalidadeProibido: 20 };
const GRUPOS = ['ByteMasters', 'Java Warriors', 'NullPointer', 'Compiladores'];

async function seed() {
  const db = initFirestore();
  if (!db) { console.error('Sem credenciais Firebase. Configure o .env antes de semear.'); process.exit(1); }
  const repo = createFirestoreRepo(db);
  for (const d of DESAFIOS) await repo.createChallenge(d);
  await repo.setConfig(CONFIG);
  for (const nome of GRUPOS) await repo.incrementGroupXp(nome, 0);
  console.log('Seed concluído: desafios, config e grupos.');
  process.exit(0);
}
seed();

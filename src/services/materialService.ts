import { ReadingMaterial, ReadingMaterialType } from '../types/database';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const STORAGE_KEY = 'fluenciedu_materials_v2';
const COLLECTION_NAME = 'reading_materials';

export interface CreateMaterialDTO {
  titulo: string;
  tipo: ReadingMaterialType;
  ano_escolar: string;
  conteudo: string;
  descricao?: string;
}

const DEFAULT_MATERIALS: ReadingMaterial[] = [
  {
    id: 'mat-palavras-1',
    titulo: 'Lista de Palavras Frequentes (1º e 2º Ano)',
    tipo: 'palavras',
    ano_escolar: '1º e 2º Ano',
    conteudo: 'bola casa pato sapo gato copo vaca mato pipa fogo fita mesa roda mala bico dado leão suco lua café uva faca sino rato doce navio peixe livro amigos escola jardim',
    descricao: 'Material de prática para reconhecimento rápido de palavras regulares comuns dos anos iniciais. (Não oficial CAEd)',
    is_exemplo: true,
    created_at: new Date('2026-03-01T10:00:00Z').toISOString(),
  },
  {
    id: 'mat-pseudopalavras-1',
    titulo: 'Lista de Pseudopalavras — Decodificação (2º e 3º Ano)',
    tipo: 'pseudopalavras',
    ano_escolar: '2º e 3º Ano',
    conteudo: 'mita lepo fadu gorpe blico dinso tralha carpo vusto penro janto zebo cufi dalo feco ribo tosa vepa xalu ziro plota crenu dralo smite frasco',
    descricao: 'Palavras inventadas para avaliar rota fonológica pura e decodificação sem apoio semântico. (Não oficial CAEd)',
    is_exemplo: true,
    created_at: new Date('2026-03-01T10:30:00Z').toISOString(),
  },
  {
    id: 'mat-texto-1',
    titulo: 'Texto Curto — O Pássaro e o Sol (2º e 3º Ano)',
    tipo: 'texto_curto',
    ano_escolar: '2º e 3º Ano',
    conteudo: 'Caco é um passarinho muito esperto que mora no alto de uma grande árvore na beira da mata. Todas as manhãs, ele acorda cedo e canta alegremente ao ver o sol nascer sobre as montanhas. Seus amigos pássaros acordam com sua bela canção e voam juntos à procura de sementes e frutas frescas pelo bosque ensolarado.',
    descricao: 'Narrativa curta com vocabulário acessível para verificação de ritmo e prosódia em leitura contínua. (Não oficial CAEd)',
    is_exemplo: true,
    created_at: new Date('2026-03-01T11:00:00Z').toISOString(),
  },
  {
    id: 'mat-texto-2',
    titulo: 'Texto Curto — O Rio Teles Pires e a Floresta (4º e 5º Ano)',
    tipo: 'texto_curto',
    ano_escolar: '4º e 5º Ano',
    conteudo: 'Nas margens do rio que corre calmo pela região norte do estado, as garças brancas descansam sob a sombra dos ipês coloridos. O barulho suave da correnteza acalma os animais da mata, enquanto a brisa fresca sopra entre as copas das árvores centenárias. Observar a natureza ao redor nos ensina a respeitar e proteger cada pedacinho da nossa terra com dedicação.',
    descricao: 'Texto contextualizado com vocabulário mais complexo e pontuação variada para os anos finais do ciclo inicial. (Não oficial CAEd)',
    is_exemplo: true,
    created_at: new Date('2026-03-01T11:30:00Z').toISOString(),
  },
];

function getLocalMaterials(): ReadingMaterial[] {
  if (typeof window === 'undefined') return DEFAULT_MATERIALS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MATERIALS));
    return DEFAULT_MATERIALS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MATERIALS;
  }
}

function saveLocalMaterials(materials: ReadingMaterial[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
}

export const materialService = {
  async list(): Promise<ReadingMaterial[]> {
    // Tentar Firestore
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        const remote = snap.docs.map((d) => d.data() as ReadingMaterial);
        saveLocalMaterials(remote);
        return remote.sort((a, b) => a.titulo.localeCompare(b.titulo));
      } else {
        // Inicializar com padrões
        const local = getLocalMaterials();
        for (const item of local) {
          try {
            await setDoc(doc(db, COLLECTION_NAME, item.id), item);
          } catch {
            // Firestore rules ou erro de rede não interrompe o retorno
          }
        }
        return local;
      }
    } catch {
      // Fallback local
    }
    return getLocalMaterials().sort((a, b) => a.titulo.localeCompare(b.titulo));
  },

  async getById(id: string): Promise<ReadingMaterial | null> {
    const list = await this.list();
    return list.find((m) => m.id === id) || null;
  },

  async create(payload: CreateMaterialDTO): Promise<ReadingMaterial> {
    const id = `mat-${Date.now()}`;
    const newMaterial: ReadingMaterial = {
      id,
      titulo: payload.titulo.trim(),
      tipo: payload.tipo,
      ano_escolar: payload.ano_escolar.trim(),
      conteudo: payload.conteudo.trim(),
      descricao: payload.descricao?.trim(),
      is_exemplo: false,
      created_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), newMaterial);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    }

    const current = getLocalMaterials();
    current.push(newMaterial);
    saveLocalMaterials(current);
    return newMaterial;
  },

  async update(id: string, payload: Partial<CreateMaterialDTO>): Promise<ReadingMaterial> {
    const current = getLocalMaterials();
    const index = current.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Material de leitura não encontrado.');

    const updated: ReadingMaterial = {
      ...current[index],
      ...payload,
      updated_at: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...payload,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }

    current[index] = updated;
    saveLocalMaterials(current);
    return updated;
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }

    const current = getLocalMaterials().filter((m) => m.id !== id);
    saveLocalMaterials(current);
  },
};

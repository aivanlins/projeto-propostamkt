import React, { useState } from 'react';
import { 
  Palette, Upload, Check, AlertTriangle, Shield, Building, 
  Phone, Mail, MapPin, FileText, CreditCard, RefreshCw, Sparkles, 
  ArrowUp, ArrowDown, Eye, EyeOff, GripVertical, Plus, Trash2, 
  Award, Users, Layers, ExternalLink, Settings, Image as ImageIcon,
  Type, AlignLeft, List, MousePointerClick, Columns, Rows, Edit3, X,
  Sliders, CheckCircle2, Bookmark, FolderDown, Maximize2, Minimize2,
  Paintbrush, Minus, SplitSquareVertical, ArrowRight, Table as TableIcon,
  Box as BoxIcon
} from 'lucide-react';
import { 
  ConfiguracaoFixa, 
  SecaoConfiguravel, 
  LinhaSecao, 
  ColunaSecao, 
  WidgetItem, 
  TipoWidget,
  ClienteLogoItem,
  PopupFeedback,
  ModeloSecoesSalvo,
  Proposta,
  CelulaTabela
} from '../../types';
import { CONFIGURACAO_FIXA_INICIAL } from '../../mockData';
import { validarUploadImagem, sanitizarTexto } from '../../utils/security';
import { FeedbackPopup } from '../Common/FeedbackPopup';
import { ClientProposalView } from '../ClientView/ClientProposalView';

interface CmsConfigEditorProps {
  config: ConfiguracaoFixa;
  onSalvarConfig: (novaConfig: ConfiguracaoFixa) => void;
  propostas?: Proposta[];
  onAtualizarPropostaEspecifica?: (propostaAtualizada: Proposta) => void;
}

export const CmsConfigEditor: React.FC<CmsConfigEditorProps> = ({
  config,
  onSalvarConfig,
  propostas = [],
  onAtualizarPropostaEspecifica,
}) => {
  const [formData, setFormData] = useState<ConfiguracaoFixa>(() => ({
    ...CONFIGURACAO_FIXA_INICIAL,
    ...config,
    secoesOrdem: (config?.secoesOrdem && Array.isArray(config.secoesOrdem) && config.secoesOrdem.length > 0)
      ? config.secoesOrdem
      : CONFIGURACAO_FIXA_INICIAL.secoesOrdem,
    fundadores: { ...CONFIGURACAO_FIXA_INICIAL.fundadores, ...(config?.fundadores || {}) },
    premiacao: { ...CONFIGURACAO_FIXA_INICIAL.premiacao, ...(config?.premiacao || {}) },
    time: { ...CONFIGURACAO_FIXA_INICIAL.time, ...(config?.time || {}) },
    servicosInstitucionais: config?.servicosInstitucionais || CONFIGURACAO_FIXA_INICIAL.servicosInstitucionais,
    clientesApresentados: config?.clientesApresentados || CONFIGURACAO_FIXA_INICIAL.clientesApresentados,
    capa: {
      ...CONFIGURACAO_FIXA_INICIAL.capa,
      ...(config?.capa || {}),
      itensRodape: config?.capa?.itensRodape || CONFIGURACAO_FIXA_INICIAL.capa.itensRodape,
    },
    modelosSecoes: config?.modelosSecoes || [
      {
        id: 'mod_padrao_completo',
        nome: 'Modelo Padrão Completo (18 Seções)',
        descricao: 'Estrutura institucional completa com todos os módulos de tráfego e fechamento',
        criadoEm: '2026-10-21',
        secoes: CONFIGURACAO_FIXA_INICIAL.secoesOrdem,
      },
    ],
  }));

  // Alvo de aplicação das alterações: 'global' ou id de uma proposta específica
  const [alvoAplicacao, setAlvoAplicacao] = useState<string>('global');

  // Seções atualmente ativas em edição (se for proposta específica, edita as seções dela)
  const [secoesAtivas, setSecoesAtivas] = useState<SecaoConfiguravel[]>(() => {
    return formData.secoesOrdem;
  });

  // Modal de Prévia em Tempo Real
  const [previaAberta, setPreviaAberta] = useState(false);

  // Modal de Salvar Modelo
  const [modalSalvarModeloAberto, setModalSalvarModeloAberto] = useState(false);
  const [nomeNovoModelo, setNomeNovoModelo] = useState('');
  const [descricaoNovoModelo, setDescricaoNovoModelo] = useState('');

  // Modal de Edição de Fundo da Seção
  const [secaoEditandoFundo, setSecaoEditandoFundo] = useState<SecaoConfiguravel | null>(null);

  // Modal de Edição de Seção Customizada (Construtor Visual)
  const [secaoEmEdicao, setSecaoEmEdicao] = useState<SecaoConfiguravel | null>(null);

  const [feedback, setFeedback] = useState<PopupFeedback>({
    tipo: 'sucesso',
    titulo: '',
    mensagem: '',
    aberto: false,
  });

  // Vertical Menu Active Item
  const [menuAtivo, setMenuAtivo] = useState<
    'ordem' | 'capa' | 'servicos_clientes' | 'institucional' | 'fundadores' | 'premiacao' | 'cores_logo' | 'termos_pix'
  >('ordem');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Manipulação de mudança de Alvo de Aplicação
  const handleMudarAlvo = (novoAlvo: string) => {
    setAlvoAplicacao(novoAlvo);
    if (novoAlvo === 'global') {
      setSecoesAtivas(formData.secoesOrdem);
    } else {
      const prop = propostas.find(p => p.id === novoAlvo);
      if (prop) {
        setSecoesAtivas(
          prop.secoesPersonalizadas && prop.secoesPersonalizadas.length > 0
            ? prop.secoesPersonalizadas
            : formData.secoesOrdem
        );
      }
    }
  };

  // Funções de reordenação das seções
  const moverSecao = (index: number, direcao: 'cima' | 'baixo') => {
    const novasSecoes = [...secoesAtivas];
    const targetIndex = direcao === 'cima' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= novasSecoes.length) return;

    const temp = novasSecoes[index];
    novasSecoes[index] = novasSecoes[targetIndex];
    novasSecoes[targetIndex] = temp;

    setSecoesAtivas(novasSecoes);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: novasSecoes }));
    }
  };

  const alternarVisibilidadeSecao = (id: string) => {
    const novasSecoes = secoesAtivas.map(s => {
      if (s.id === id) {
        return { ...s, ativo: !s.ativo };
      }
      return s;
    });
    setSecoesAtivas(novasSecoes);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: novasSecoes }));
    }
  };

  const alternarPermissaoEdicaoSecao = (id: string) => {
    const novasSecoes = secoesAtivas.map(s => {
      if (s.id === id) {
        return { ...s, podeEditar: !(s.podeEditar ?? true) };
      }
      return s;
    });
    setSecoesAtivas(novasSecoes);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: novasSecoes }));
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const novas = [...secoesAtivas];
    const itemMovido = novas.splice(draggedIndex, 1)[0];
    novas.splice(index, 0, itemMovido);
    setSecoesAtivas(novas);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: novas }));
    }
    setDraggedIndex(null);
  };

  // Criar Nova Seção Customizada
  const handleCriarNovaSecaoCustomizada = () => {
    const novaId = `sec_custom_${Date.now()}`;
    const novaSecao: SecaoConfiguravel = {
      id: novaId,
      titulo: 'Nova Seção Personalizada',
      descricao: 'Seção customizada com colunas e widgets flexíveis',
      ativo: true,
      tipo: 'customizada',
      podeEditar: true,
      estilo: {
        corFundo: '#ffffff',
        corTexto: '#18181b',
        paddingY: 'md',
      },
      linhas: [
        {
          id: `row_${Date.now()}_1`,
          qtdColunas: 2,
          colunas: [
            {
              id: `col_${Date.now()}_1`,
              larguraSpan: 6,
              widgets: [
                {
                  id: `w_${Date.now()}_1`,
                  tipo: 'titulo',
                  conteudo: {
                    texto: 'Título de Destaque',
                    tamanho: 'xl',
                    alinhamento: 'left',
                    cor: formData.corPrimaria || '#5A0072',
                  },
                },
                {
                  id: `w_${Date.now()}_2`,
                  tipo: 'texto',
                  conteudo: {
                    texto: 'Insira aqui a descrição detalhada para contextualizar sua proposta comercial.',
                    alinhamento: 'left',
                    corTexto: '#3f3f46',
                  },
                },
              ],
            },
            {
              id: `col_${Date.now()}_2`,
              larguraSpan: 6,
              widgets: [
                {
                  id: `w_${Date.now()}_3`,
                  tipo: 'imagem',
                  conteudo: {
                    urlImagem: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
                    altImagem: 'Exemplo de Imagem',
                    alturaImagemPx: 260,
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const atualizadas = [...secoesAtivas, novaSecao];
    setSecoesAtivas(atualizadas);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: atualizadas }));
    }
    setSecaoEmEdicao(novaSecao);
  };

  // Excluir Seção (CORRIGIDO: SEM BLOQUEIO DE IFRAME E COM PERSISTÊNCIA IMEDIATA)
  const handleExcluirSecao = (id: string) => {
    const secaoAlvo = secoesAtivas.find(s => s.id === id);
    const tituloSecao = secaoAlvo?.titulo || 'Seção';
    const filtradas = secoesAtivas.filter(s => s.id !== id);
    setSecoesAtivas(filtradas);

    if (alvoAplicacao === 'global') {
      const novaConfig = {
        ...formData,
        secoesOrdem: filtradas,
      };
      setFormData(novaConfig);
      onSalvarConfig(novaConfig);
    } else {
      const prop = propostas.find(p => p.id === alvoAplicacao);
      if (prop && onAtualizarPropostaEspecifica) {
        onAtualizarPropostaEspecifica({
          ...prop,
          secoesPersonalizadas: filtradas,
        });
      }
    }

    if (secaoEmEdicao?.id === id) setSecaoEmEdicao(null);
    if (secaoEditandoFundo?.id === id) setSecaoEditandoFundo(null);

    setFeedback({
      tipo: 'sucesso',
      titulo: 'Seção Excluída',
      mensagem: `A seção "${tituloSecao}" foi removida com sucesso.`,
      aberto: true,
    });
  };

  // Alternar se a seção deve aparecer ou não no menu lateral flutuante (quadradinhos)
  const alternarMenuFlutuante = (id: string) => {
    const atualizadas = secoesAtivas.map(s => {
      if (s.id === id) {
        return {
          ...s,
          mostrarNoMenuFlutuante: !(s.mostrarNoMenuFlutuante !== false),
        };
      }
      return s;
    });

    setSecoesAtivas(atualizadas);
    if (alvoAplicacao === 'global') {
      const novaConfig = { ...formData, secoesOrdem: atualizadas };
      setFormData(novaConfig);
      onSalvarConfig(novaConfig);
    } else {
      const prop = propostas.find(p => p.id === alvoAplicacao);
      if (prop && onAtualizarPropostaEspecifica) {
        onAtualizarPropostaEspecifica({
          ...prop,
          secoesPersonalizadas: atualizadas,
        });
      }
    }
  };

  // Atualizar Estilo de Fundo de Qualquer Seção
  const handleSalvarFundoSecao = (secaoId: string, novoEstilo: SecaoConfiguravel['estilo']) => {
    const atualizadas = secoesAtivas.map(s => {
      if (s.id === secaoId) {
        return {
          ...s,
          estilo: {
            ...s.estilo,
            ...novoEstilo,
          },
        };
      }
      return s;
    });

    setSecoesAtivas(atualizadas);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: atualizadas }));
    }
    setSecaoEditandoFundo(null);
    setFeedback({
      tipo: 'sucesso',
      titulo: 'Fundo da Seção Atualizado',
      mensagem: 'As propriedades visuais de cor e imagem de cobertura foram aplicadas.',
      aberto: true,
    });
  };

  // Salvar Novo Modelo de Seções (Preset)
  const handleSalvarComoModelo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeNovoModelo.trim()) return;

    const novoModelo: ModeloSecoesSalvo = {
      id: `mod_${Date.now()}`,
      nome: nomeNovoModelo.trim(),
      descricao: descricaoNovoModelo.trim(),
      criadoEm: new Date().toISOString().split('T')[0],
      secoes: secoesAtivas,
    };

    const modelosAtualizados = [...(formData.modelosSecoes || []), novoModelo];
    setFormData(prev => ({ ...prev, modelosSecoes: modelosAtualizados }));
    setNomeNovoModelo('');
    setDescricaoNovoModelo('');
    setModalSalvarModeloAberto(false);
    setFeedback({
      tipo: 'sucesso',
      titulo: 'Modelo Salvo com Sucesso!',
      mensagem: `O modelo "${novoModelo.nome}" foi gravado e pode ser aplicado em qualquer proposta.`,
      aberto: true,
    });
  };

  // Carregar Modelo Salvo
  const handleCarregarModelo = (modeloId: string) => {
    const modelo = (formData.modelosSecoes || []).find(m => m.id === modeloId);
    if (modelo) {
      if (confirm(`Carregar o modelo "${modelo.nome}"? As seções atuais serão substituídas pelas do modelo.`)) {
        setSecoesAtivas(modelo.secoes);
        if (alvoAplicacao === 'global') {
          setFormData(prev => ({ ...prev, secoesOrdem: modelo.secoes }));
        }
        setFeedback({
          tipo: 'sucesso',
          titulo: 'Modelo Aplicado',
          mensagem: `Estrutura de seções atualizada com base no modelo "${modelo.nome}".`,
          aberto: true,
        });
      }
    }
  };

  // Abertura do construtor de conteúdo e fundo para qualquer seção clicada
  const handleEditarSecaoClicada = (secao: SecaoConfiguravel) => {
    setSecaoEmEdicao(secao);
  };

  // ==========================================
  // ELEMENTOR BUILDER: LINHAS, COLUNAS & WIDGETS
  // ==========================================
  const handleAdicionarLinha = (qtdColunas: number) => {
    if (!secaoEmEdicao) return;
    const colunas: ColunaSecao[] = Array.from({ length: qtdColunas }).map((_, i) => ({
      id: `col_${Date.now()}_${i}`,
      larguraSpan: 12 / qtdColunas,
      direcao: 'vertical',
      widgets: [],
    }));

    const novaLinha: LinhaSecao = {
      id: `row_${Date.now()}`,
      qtdColunas,
      colunas,
    };

    const secaoAtualizada: SecaoConfiguravel = {
      ...secaoEmEdicao,
      linhas: [...(secaoEmEdicao.linhas || []), novaLinha],
    };

    setSecaoEmEdicao(secaoAtualizada);
    const novasSecoes = secoesAtivas.map(s => s.id === secaoAtualizada.id ? secaoAtualizada : s);
    setSecoesAtivas(novasSecoes);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: novasSecoes }));
    }
  };

  const handleRemoverLinha = (linhaId: string) => {
    if (!secaoEmEdicao) return;
    const secaoAtualizada: SecaoConfiguravel = {
      ...secaoEmEdicao,
      linhas: (secaoEmEdicao.linhas || []).filter(l => l.id !== linhaId),
    };
    setSecaoEmEdicao(secaoAtualizada);
    const novasSecoes = secoesAtivas.map(s => s.id === secaoAtualizada.id ? secaoAtualizada : s);
    setSecoesAtivas(novasSecoes);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: novasSecoes }));
    }
  };

  const handleAdicionarWidget = (linhaId: string, colId: string, tipo: TipoWidget) => {
    if (!secaoEmEdicao) return;

    let conteudoInicial: any = {};
    if (tipo === 'titulo') {
      conteudoInicial = { 
        texto: 'Novo Título de Impacto', 
        tamanho: 'lg', 
        alinhamento: 'left', 
        cor: formData.corPrimaria || '#5A0072' 
      };
    } else if (tipo === 'texto') {
      conteudoInicial = { 
        texto: 'Texto descritivo com formatação clara e atraente para o cliente.', 
        alinhamento: 'left',
        corTexto: '#3f3f46'
      };
    } else if (tipo === 'imagem') {
      conteudoInicial = {
        urlImagem: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
        alturaImagemPx: 220,
        altImagem: 'Gráfico e Resultados',
      };
    } else if (tipo === 'lista') {
      conteudoInicial = {
        orientacaoLista: 'vertical',
        itensLista: [
          'Estratégia personalizada de posicionamento',
          'Gestão contínua de campanhas e conversão',
          'Relatórios de desempenho semanais'
        ],
      };
    } else if (tipo === 'divisor') {
      conteudoInicial = {
        orientacaoDivisor: 'horizontal',
        espessuraDivisorPx: 1,
        corDivisor: '#e4e4e7',
      };
    } else if (tipo === 'botao') {
      conteudoInicial = {
        textoBotao: 'Falar com Especialista',
        urlBotao: 'https://wa.me/5512981019913',
      };
    } else if (tipo === 'box') {
      conteudoInicial = {
        tituloBox: 'Novo Box de Serviço / Destaque',
        tagDestaque: 'Exclusivo',
        textoBox: 'Descreva aqui os entregáveis, benefícios e diferenciais estratégicos deste card.',
        corFundoBox: '#f8fafc',
        corBordaBox: '#e2e8f0',
        corTextoBox: '#18181b',
      };
    } else if (tipo === 'tabela') {
      conteudoInicial = {
        linhasTabela: 2,
        colunasTabela: 2,
        espessuraBorda: 1, // 0 = sem borda, 1 = 1px, 2 = 2px, etc.
        corBorda: '#e4e4e7',
        celulasTabela: [
          { linha: 0, coluna: 0, tipo: 'texto', texto: 'Entregável' },
          { linha: 0, coluna: 1, tipo: 'texto', texto: 'Frequência' },
          { linha: 1, coluna: 0, tipo: 'texto', texto: 'Gestão de Campanhas' },
          { linha: 1, coluna: 1, tipo: 'texto', texto: 'Otimização Contínua' },
        ],
      };
    }

    const novoWidget: WidgetItem = {
      id: `w_${Date.now()}`,
      tipo,
      conteudo: conteudoInicial,
    };

    const secaoAtualizada: SecaoConfiguravel = {
      ...secaoEmEdicao,
      linhas: (secaoEmEdicao.linhas || []).map(linha => {
        if (linha.id === linhaId) {
          return {
            ...linha,
            colunas: linha.colunas.map(col => {
              if (col.id === colId) {
                return { ...col, widgets: [...col.widgets, novoWidget] };
              }
              return col;
            }),
          };
        }
        return linha;
      }),
    };

    setSecaoEmEdicao(secaoAtualizada);
    const novasSecoes = secoesAtivas.map(s => s.id === secaoAtualizada.id ? secaoAtualizada : s);
    setSecoesAtivas(novasSecoes);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: novasSecoes }));
    }
  };

  const handleRemoverWidget = (linhaId: string, colId: string, widgetId: string) => {
    if (!secaoEmEdicao) return;
    const secaoAtualizada: SecaoConfiguravel = {
      ...secaoEmEdicao,
      linhas: (secaoEmEdicao.linhas || []).map(linha => {
        if (linha.id === linhaId) {
          return {
            ...linha,
            colunas: linha.colunas.map(col => {
              if (col.id === colId) {
                return { ...col, widgets: col.widgets.filter(w => w.id !== widgetId) };
              }
              return col;
            }),
          };
        }
        return linha;
      }),
    };
    setSecaoEmEdicao(secaoAtualizada);
    const novasSecoes = secoesAtivas.map(s => s.id === secaoAtualizada.id ? secaoAtualizada : s);
    setSecoesAtivas(novasSecoes);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: novasSecoes }));
    }
  };

  const handleAtualizarWidget = (linhaId: string, colId: string, widgetId: string, novoConteudo: any) => {
    if (!secaoEmEdicao) return;
    const secaoAtualizada: SecaoConfiguravel = {
      ...secaoEmEdicao,
      linhas: (secaoEmEdicao.linhas || []).map(linha => {
        if (linha.id === linhaId) {
          return {
            ...linha,
            colunas: linha.colunas.map(col => {
              if (col.id === colId) {
                return {
                  ...col,
                  widgets: col.widgets.map(w => w.id === widgetId ? { ...w, conteudo: { ...w.conteudo, ...novoConteudo } } : w),
                };
              }
              return col;
            }),
          };
        }
        return linha;
      }),
    };
    setSecaoEmEdicao(secaoAtualizada);
    const novasSecoes = secoesAtivas.map(s => s.id === secaoAtualizada.id ? secaoAtualizada : s);
    setSecoesAtivas(novasSecoes);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: novasSecoes }));
    }
  };

  // Alterar orientação de uma coluna específica: Vertical (empilhado) ou Horizontal (lado a lado)
  const handleMudarDirecaoColuna = (linhaId: string, colId: string, direcao: 'vertical' | 'horizontal') => {
    if (!secaoEmEdicao) return;
    const secaoAtualizada: SecaoConfiguravel = {
      ...secaoEmEdicao,
      linhas: (secaoEmEdicao.linhas || []).map(linha => {
        if (linha.id === linhaId) {
          return {
            ...linha,
            colunas: linha.colunas.map(col => {
              if (col.id === colId) {
                return { ...col, direcao };
              }
              return col;
            }),
          };
        }
        return linha;
      }),
    };
    setSecaoEmEdicao(secaoAtualizada);
    const novasSecoes = secoesAtivas.map(s => s.id === secaoAtualizada.id ? secaoAtualizada : s);
    setSecoesAtivas(novasSecoes);
    if (alvoAplicacao === 'global') {
      setFormData(prev => ({ ...prev, secoesOrdem: novasSecoes }));
    }
  };

  // Atualizar célula individual de um widget do tipo tabela
  const handleAtualizarCelulaTabela = (
    linhaId: string,
    colId: string,
    widgetId: string,
    r: number,
    c: number,
    updates: Partial<CelulaTabela>
  ) => {
    const linha = (secaoEmEdicao?.linhas || []).find(l => l.id === linhaId);
    const coluna = linha?.colunas.find(col => col.id === colId);
    const widget = coluna?.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const celulas = [...(widget.conteudo.celulasTabela || [])];
    const idx = celulas.findIndex(cell => cell.linha === r && cell.coluna === c);
    if (idx >= 0) {
      celulas[idx] = { ...celulas[idx], ...updates };
    } else {
      celulas.push({ linha: r, coluna: c, tipo: 'texto', ...updates });
    }
    handleAtualizarWidget(linhaId, colId, widgetId, { celulasTabela: celulas });
  };

  // Upload genérico seguro com validação estrita de MIME
  const handleUploadGenerico = (
    e: React.ChangeEvent<HTMLInputElement>,
    onSucesso: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validacao = validarUploadImagem(file);
    if (!validacao.valido) {
      setFeedback({
        tipo: 'erro',
        titulo: 'Arquivo Rejeitado',
        mensagem: validacao.mensagemErro || 'Formato de imagem inválido. Use JPG, PNG ou WebP até 5MB.',
        aberto: true,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onSucesso(reader.result as string);
      setFeedback({
        tipo: 'sucesso',
        titulo: 'Upload Concluído',
        mensagem: `Arquivo validado e salvo com sucesso! MIME: ${validacao.mimeTypeDetectado}.`,
        aberto: true,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (alvoAplicacao === 'global') {
      const configSanitizada: ConfiguracaoFixa = {
        ...formData,
        secoesOrdem: secoesAtivas,
        nomeAgencia: sanitizarTexto(formData.nomeAgencia),
        slogan: sanitizarTexto(formData.slogan),
        cnpj: sanitizarTexto(formData.cnpj),
        emailContato: sanitizarTexto(formData.emailContato),
        telefoneWhatsapp: sanitizarTexto(formData.telefoneWhatsapp),
        endereco: sanitizarTexto(formData.endereco),
        sobreAgencia: sanitizarTexto(formData.sobreAgencia),
        termosGarantia: sanitizarTexto(formData.termosGarantia),
        dadosBancariosPix: sanitizarTexto(formData.dadosBancariosPix),
        textoRodape: sanitizarTexto(formData.textoRodape),
        atualizadoEm: new Date().toISOString(),
      };

      onSalvarConfig(configSanitizada);
      setFeedback({
        tipo: 'sucesso',
        titulo: 'Configurações Globais Salvas',
        mensagem: 'As seções padrão da agência e todos os menus foram salvos no banco de dados.',
        aberto: true,
      });
    } else {
      // Salva especificamente na proposta selecionada
      const propostaAlvo = propostas.find(p => p.id === alvoAplicacao);
      if (propostaAlvo && onAtualizarPropostaEspecifica) {
        const atualizada: Proposta = {
          ...propostaAlvo,
          secoesPersonalizadas: secoesAtivas,
          atualizadoEm: new Date().toISOString(),
        };
        onAtualizarPropostaEspecifica(atualizada);
        setFeedback({
          tipo: 'sucesso',
          titulo: 'Estrutura da Proposta Salva!',
          mensagem: `As seções e ordem foram aplicadas exclusivamente para a proposta "${propostaAlvo.titulo}" (${propostaAlvo.clienteEmpresa}). As demais propostas continuam inalteradas.`,
          aberto: true,
        });
      }
    }
  };

  // Proposta simulada para a Pré-visualização
  const propostaParaPrevia: Proposta = propostas.length > 0 ? {
    ...propostas[0],
    secoesPersonalizadas: secoesAtivas,
  } : {
    id: 'prop_preview',
    token: 'preview_token',
    titulo: 'Posicionamento Estratégico & Gestão de Performance',
    clienteNome: 'Cliente Exemplo',
    clienteEmpresa: 'Empresa Demonstração',
    clienteEmail: 'contato@cliente.com.br',
    clienteTelefone: '+55 12 98101-9913',
    clienteDocumento: '12.345.678/0001-90',
    projetoTexto: 'Estratégia completa de posicionamento e vendas.',
    precoDe: 2500,
    precoPor: 1500,
    apresentacao: 'Apresentação comercial.',
    objetivos: [],
    entregaveis: [],
    valorTotal: 1500,
    descontoAplicado: 1000,
    condicoesPagamento: 'Mensal',
    parcelamentoMax: 12,
    dataEmissao: new Date().toISOString(),
    dataValidade: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'ativo',
    visualizacoes: 1,
    criadoPor: 'Consultor Comercial',
    criadoPorId: 'usr_admin',
    criadoPorWhatsapp: '',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    secoesPersonalizadas: secoesAtivas,
  };

  // RENDERIZADOR EMBUTIDO DO CONSTRUTOR DE COLUNAS E WIDGETS PARA MENUS 2 A 8
  const renderBlocoConstrutorSecao = (secaoId: string, rotuloSecao: string) => {
    const secao = secoesAtivas.find(s => s.id === secaoId);
    if (!secao) return null;

    return (
      <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Columns className="w-4 h-4 text-purple-600" />
              Colunas & Widgets Customizados • {rotuloSecao}
            </h4>
            <p className="text-[11px] text-zinc-500">
              Adicione linhas com colunas, textos com cores individuais, listas, títulos e divisores nesta seção.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSecaoEmEdicao(secao)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 font-bold text-xs cursor-pointer transition-colors shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Widgets e Fundo Completo</span>
          </button>
        </div>

        {/* Inserção rápida de linhas */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            + Adicionar Linha de Colunas:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { cols: 1, label: '1 Coluna (100%)' },
              { cols: 2, label: '2 Colunas (50%/50%)' },
              { cols: 3, label: '3 Colunas (33%)' },
              { cols: 4, label: '4 Colunas (25%)' },
            ].map(c => (
              <button
                key={c.cols}
                type="button"
                onClick={() => {
                  const colunas: ColunaSecao[] = Array.from({ length: c.cols }).map((_, i) => ({
                    id: `col_${Date.now()}_${i}`,
                    larguraSpan: Math.floor(12 / c.cols),
                    widgets: [
                      {
                        id: `w_${Date.now()}_${i}`,
                        tipo: 'texto',
                        conteudo: { texto: `Item complementar coluna ${i + 1}`, corTexto: '#3f3f46' }
                      }
                    ],
                  }));
                  const novaLinha: LinhaSecao = { id: `row_${Date.now()}`, qtdColunas: c.cols, colunas };
                  const atualizada: SecaoConfiguravel = {
                    ...secao,
                    linhas: [...(secao.linhas || []), novaLinha]
                  };
                  const novas = secoesAtivas.map(s => s.id === secao.id ? atualizada : s);
                  setSecoesAtivas(novas);
                  if (alvoAplicacao === 'global') {
                    const novaConfig = { ...formData, secoesOrdem: novas };
                    setFormData(novaConfig);
                    onSalvarConfig(novaConfig);
                  }
                  setFeedback({
                    tipo: 'sucesso',
                    titulo: 'Linha Adicionada',
                    mensagem: `Linha de ${c.cols} coluna(s) adicionada com sucesso na seção.`,
                    aberto: true,
                  });
                }}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 cursor-pointer shadow-xs"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Linhas ativas com botões de ação */}
        {(secao.linhas || []).length > 0 && (
          <div className="space-y-2">
            {(secao.linhas || []).map((linha, lIdx) => (
              <div key={linha.id} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Linha {lIdx + 1}: {linha.qtdColunas} coluna(s) • {linha.colunas.reduce((acc, c) => acc + c.widgets.length, 0)} widget(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSecaoEmEdicao(secao)}
                    className="text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                  >
                    Editar Widgets
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const atualizada = {
                        ...secao,
                        linhas: (secao.linhas || []).filter(l => l.id !== linha.id)
                      };
                      const novas = secoesAtivas.map(s => s.id === secao.id ? atualizada : s);
                      setSecoesAtivas(novas);
                      if (alvoAplicacao === 'global') {
                        const novaConfig = { ...formData, secoesOrdem: novas };
                        setFormData(novaConfig);
                        onSalvarConfig(novaConfig);
                      }
                    }}
                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    title="Remover Linha"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* CABEÇALHO DO CMS COM SELEÇÃO DE ESCOPO E BOTÕES DE AÇÃO */}
      <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              CMS • Gestão e Customizador de Seções
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Personalize o layout visual, fundo por seção, widgets e decida se as alterações são globais ou de uma proposta específica.
          </p>
        </div>

        {/* CONTROLES: SELETOR DE ESCOPO + PREVIEW + SALVAR MODELO + SALVAR */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Escopo: Global vs Proposta Específica */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <Sliders className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 hidden sm:inline">Aplicar em:</span>
            <select
              value={alvoAplicacao}
              onChange={e => handleMudarAlvo(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="global">★ Modelo Padrão Global (Agência)</option>
              {propostas.map(p => (
                <option key={p.id} value={p.id}>
                  Proposta: {p.clienteEmpresa}
                </option>
              ))}
            </select>
          </div>

          {/* Botão de Visualizar Prévia */}
          <button
            type="button"
            onClick={() => setPreviaAberta(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all cursor-pointer shadow-xs"
            title="Visualizar a página da proposta antes de salvar"
          >
            <Eye className="w-4 h-4" />
            <span>Visualizar Prévia</span>
          </button>

          {/* Botão Salvar como Modelo */}
          <button
            type="button"
            onClick={() => setModalSalvarModeloAberto(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
            title="Salvar esta estrutura de seções como um modelo reaproveitável"
          >
            <Bookmark className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Salvar Modelo</span>
          </button>

          {/* Botão Salvar Definitivo */}
          <button
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all cursor-pointer"
            style={{ backgroundColor: formData.corPrimaria || '#5A0072' }}
          >
            <Check className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* AVISO QUANDO EDITANDO PROPOSTA ESPECÍFICA */}
      {alvoAplicacao !== 'global' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Personalização Específica Ativa:</strong> As alterações na ordem, visibilidade e widgets serão gravadas <strong>somente na proposta selecionada</strong>. As demais propostas continuam com o modelo padrão.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleMudarAlvo('global')}
            className="px-3 py-1 rounded-xl bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold cursor-pointer hover:opacity-90"
          >
            Voltar ao Global
          </button>
        </div>
      )}

      {/* LAYOUT PRINCIPAL: MENU VERTICAL À ESQUERDA & CONTEÚDO À DIREITA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA ESQUERDA: MENU VERTICAL FIXO */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm space-y-1">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Navegação do CMS
          </div>

          {[
            { id: 'ordem', label: '1. Organização & Ordem das Seções', icon: Layers, badge: `${secoesAtivas.length}` },
            { id: 'capa', label: '2. Capa Oficial & Identidade', icon: ImageIcon },
            { id: 'servicos_clientes', label: '3. Logos Clientes & Serviços', icon: Award },
            { id: 'institucional', label: '4. Sobre a Agência & Missão', icon: Building },
            { id: 'fundadores', label: '5. Liderança & Sócios', icon: Users },
            { id: 'premiacao', label: '6. Prêmios & Reconhecimento', icon: Sparkles },
            { id: 'cores_logo', label: '7. Identidade Visual & Diretrizes', icon: Palette },
            { id: 'termos_pix', label: '8. Chave PIX, Garantias & Rodapé', icon: CreditCard },
          ].map(item => {
            const Icon = item.icon;
            const ativo = menuAtivo === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setMenuAtivo(item.id as any)}
                className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  ativo
                    ? 'bg-purple-900 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${ativo ? 'text-amber-400' : 'text-zinc-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    ativo ? 'bg-purple-800 text-purple-200' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* PRESETS DE MODELOS SALVOS */}
          {(formData.modelosSecoes || []).length > 0 && (
            <div className="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800 px-3 space-y-2">
              <span className="text-[10px] font-black uppercase text-zinc-400 block">
                Modelos de Seções Salvos
              </span>
              <div className="space-y-1">
                {(formData.modelosSecoes || []).map(mod => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => handleCarregarModelo(mod.id)}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between group cursor-pointer"
                    title={`Carregar ${mod.nome}`}
                  >
                    <span className="truncate">{mod.nome}</span>
                    <FolderDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-purple-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: CONTEÚDO ATIVO */}
        <div className="lg:col-span-9 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          
          {/* ======================================================== */}
          {/* ABA 1: ORGANIZAÇÃO & ORDEM DAS SEÇÕES (COM EXCLUSÃO E FUNDO) */}
          {/* ======================================================== */}
          {menuAtivo === 'ordem' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    Organização & Ordem das Seções da Proposta
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Arraste para reordenar, configure o fundo de qualquer seção ou adicione seções personalizadas.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCriarNovaSecaoCustomizada}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    + Criar Seção Personalizada
                  </button>
                </div>
              </div>

              {/* PERMISSÃO PARA COMERCIAL CRIAR SEÇÕES */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-zinc-900 dark:text-white block">
                    Permitir que usuários comerciais criem seções próprias
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Se ativado, consultores comerciais poderão criar seções em suas respectivas propostas.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.usuarioComercialPodeCriarSecoes}
                  onChange={e => setFormData({ ...formData, usuarioComercialPodeCriarSecoes: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* LISTA ARRASTÁVEL DAS SEÇÕES */}
              <div className="space-y-2.5">
                {secoesAtivas.map((secao, index) => (
                  <div
                    key={secao.id || `sec_${index}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      secao.ativo
                        ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'
                        : 'bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200/50 dark:border-zinc-800/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab active:cursor-grabbing p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      
                      <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900 dark:text-white">
                            {secao.titulo}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            secao.tipo === 'customizada'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : secao.tipo === 'dinamico_proposta'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          }`}>
                            {secao.tipo === 'customizada' ? 'Personalizada' : secao.tipo === 'dinamico_proposta' ? 'Dados da Proposta' : 'Institucional'}
                          </span>

                          {/* Indicador de Fundo Customizado */}
                          {secao.estilo?.imagemFundoUrl && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                              Fundo: Imagem
                            </span>
                          )}
                          {secao.estilo?.corFundo && secao.estilo.corFundo !== '#ffffff' && (
                            <span className="inline-block w-3.5 h-3.5 rounded-full border border-zinc-300" style={{ backgroundColor: secao.estilo.corFundo }} title={`Cor: ${secao.estilo.corFundo}`} />
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {secao.descricao}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 flex-wrap">
                      {/* BOTÃO: EDITAR CONTEÚDO E FUNDO DA SEÇÃO */}
                      <button
                        type="button"
                        onClick={() => handleEditarSecaoClicada(secao)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer"
                        title="Editar conteúdo, fundo e widgets desta seção"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Conteúdo</span>
                      </button>

                      {/* TOGGLE: EXIBIR OU NÃO NO MENU FLUTUANTE (QUADRADINHOS LATERAIS) */}
                      <button
                        type="button"
                        onClick={() => alternarMenuFlutuante(secao.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          secao.mostrarNoMenuFlutuante !== false
                            ? 'text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/70'
                            : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                        title={
                          secao.mostrarNoMenuFlutuante !== false
                            ? 'Visível nos quadradinhos laterais. Clique para desativar.'
                            : 'Oculto dos quadradinhos laterais. Clique para ativar.'
                        }
                      >
                        <span 
                          className={`w-3 h-3 rounded-[2px] block border ${
                            secao.mostrarNoMenuFlutuante !== false
                              ? 'bg-purple-600 border-purple-600 shadow-xs'
                              : 'border-zinc-400 dark:border-zinc-600'
                          }`} 
                        />
                      </button>

                      {/* REORDENAÇÃO MANUAL */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moverSecao(index, 'cima')}
                        className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={index === secoesAtivas.length - 1}
                        onClick={() => moverSecao(index, 'baixo')}
                        className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* ATIVAR / OCULTAR TOTAL NA PÁGINA */}
                      <button
                        type="button"
                        onClick={() => alternarVisibilidadeSecao(secao.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          secao.ativo
                            ? 'text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950'
                            : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                        title={secao.ativo ? 'Seção Visível. Clique para ocultar da página' : 'Seção Oculta. Clique para exibir na página'}
                      >
                        {secao.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* EXCLUIR SEÇÃO (SEM CONFIRM BLOQUEANTE) */}
                      <button
                        type="button"
                        onClick={() => handleExcluirSecao(secao.id)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Excluir esta seção permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: CAPA OFICIAL (SLIDE 1) */}
          {/* ======================================================== */}
          {menuAtivo === 'capa' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  Personalização da Capa Oficial (Slide 1)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Configure cor de fundo ou imagem cover total, logotipo e itens de contato do rodapé da lâmina principal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Cor de Fundo da Capa
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.capa.corFundo}
                      onChange={e => setFormData({
                        ...formData,
                        capa: { ...formData.capa, corFundo: e.target.value }
                      })}
                      className="w-12 h-12 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0.5 bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.capa.corFundo}
                      onChange={e => setFormData({
                        ...formData,
                        capa: { ...formData.capa, corFundo: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Imagem Cover de Fundo (Cobertura Total)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.capa.imagemFundoUrl || ''}
                      onChange={e => setFormData({
                        ...formData,
                        capa: { ...formData.capa, imagemFundoUrl: e.target.value }
                      })}
                      placeholder="URL ou selecione arquivo"
                      className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
                    />
                    <label className="p-2.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0">
                      <Upload className="w-4 h-4 text-purple-600" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleUploadGenerico(e, url => {
                          setFormData({ ...formData, capa: { ...formData.capa, imagemFundoUrl: url } });
                        })}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Título Principal
                  </label>
                  <input
                    type="text"
                    value={formData.capa.titulo}
                    onChange={e => setFormData({ ...formData, capa: { ...formData.capa, titulo: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Subtítulo / Slogan
                  </label>
                  <input
                    type="text"
                    value={formData.capa.subtitulo}
                    onChange={e => setFormData({ ...formData, capa: { ...formData.capa, subtitulo: e.target.value } })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                  />
                </div>
              </div>

              {/* ITENS DO RODAPÉ DA CAPA */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                    Contatos do Rodapé da Capa
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const novoItem = { id: `item_${Date.now()}`, texto: 'Novo Contato / Rede' };
                      setFormData({
                        ...formData,
                        capa: {
                          ...formData.capa,
                          itensRodape: [...formData.capa.itensRodape, novoItem],
                        },
                      });
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Contato
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.capa.itensRodape.map((item, idx) => (
                    <div key={item.id || `capa_item_${idx}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.texto}
                        onChange={e => {
                          const novos = [...formData.capa.itensRodape];
                          novos[idx] = { ...novos[idx], texto: e.target.value };
                          setFormData({ ...formData, capa: { ...formData.capa, itensRodape: novos } });
                        }}
                        placeholder="Ex: @agencia ou Nome do Sócio"
                        className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                      />
                      <input
                        type="text"
                        value={item.link || ''}
                        onChange={e => {
                          const novos = [...formData.capa.itensRodape];
                          novos[idx] = { ...novos[idx], link: e.target.value };
                          setFormData({ ...formData, capa: { ...formData.capa, itensRodape: novos } });
                        }}
                        placeholder="Link opcional (ex: https://...)"
                        className="w-1/3 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            capa: {
                              ...formData.capa,
                              itensRodape: formData.capa.itensRodape.filter(i => i.id !== item.id),
                            },
                          });
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONSTRUTOR DE COLUNAS E WIDGETS DA CAPA */}
              {renderBlocoConstrutorSecao('hero_capa', 'Capa Oficial')}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: LOGOS DE CLIENTES & SERVIÇOS INSTITUCIONAIS */}
          {/* ======================================================== */}
          {menuAtivo === 'servicos_clientes' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Muro de Clientes Atendidos & Boxes de Serviços
                </h3>
              </div>

              {/* BOXES DE SERVIÇOS INSTITUCIONAIS */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      Boxes de Serviços Oficiais ({formData.servicosInstitucionais.length} Ativos)
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Cards exibidos na lâmina "Nossos Serviços" com título e descrição.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const novo = {
                        id: `srv_${Date.now()}`,
                        titulo: 'Novo Box de Serviço',
                        descricao: 'Descrição detalhada dos serviços, entregáveis ou diferenciais oferecidos neste pilar.'
                      };
                      setFormData(prev => ({
                        ...prev,
                        servicosInstitucionais: [...prev.servicosInstitucionais, novo]
                      }));
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Box
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.servicosInstitucionais.map((srv, sIdx) => (
                    <div key={srv.id || `tab_srv_${sIdx}`} className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-purple-600">Box #{sIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              servicosInstitucionais: prev.servicosInstitucionais.filter(s => s.id !== srv.id)
                            }));
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          title="Excluir este box"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Título do Serviço</label>
                        <input
                          type="text"
                          value={srv.titulo}
                          onChange={e => {
                            const novos = [...formData.servicosInstitucionais];
                            novos[sIdx] = { ...novos[sIdx], titulo: e.target.value };
                            setFormData(prev => ({ ...prev, servicosInstitucionais: novos }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-zinc-50 dark:bg-zinc-800 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Descrição</label>
                        <textarea
                          rows={2}
                          value={srv.descricao}
                          onChange={e => {
                            const novos = [...formData.servicosInstitucionais];
                            novos[sIdx] = { ...novos[sIdx], descricao: e.target.value };
                            setFormData(prev => ({ ...prev, servicosInstitucionais: novos }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-zinc-50 dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CLIENTES ATENDIDOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Muro de Clientes Atendidos ({formData.clientesApresentados.length})
                    </h4>
                    <p className="text-[11px] text-zinc-500">Logos exibidas na seção Nossos Clientes.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const novo: ClienteLogoItem = {
                        id: `cli_${Date.now()}`,
                        nome: 'Novo Cliente',
                        categoria: 'Geral',
                        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
                      };
                      setFormData({ ...formData, clientesApresentados: [...formData.clientesApresentados, novo] });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Cliente
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.clientesApresentados.map((cli, idx) => (
                    <div key={cli.id || `cli_${idx}`} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
                      <div className="h-16 flex items-center justify-center p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        {cli.logoUrl ? (
                          <img 
                            src={cli.logoUrl} 
                            alt={cli.nome} 
                            className="h-12 max-w-full object-contain filter dark:brightness-110" 
                          />
                        ) : (
                          <span className="text-xs font-bold text-zinc-400">Sem Imagem</span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={cli.nome}
                          onChange={e => {
                            const novos = [...formData.clientesApresentados];
                            novos[idx] = { ...novos[idx], nome: e.target.value };
                            setFormData({ ...formData, clientesApresentados: novos });
                          }}
                          placeholder="Nome do Cliente"
                          className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold"
                        />

                        <div className="flex items-center gap-2">
                          <label className="flex-1 text-center py-1.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer flex items-center justify-center gap-1">
                            <Upload className="w-3 h-3" /> Upload Logo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => handleUploadGenerico(e, url => {
                                const novos = [...formData.clientesApresentados];
                                novos[idx] = { ...novos[idx], logoUrl: url };
                                setFormData({ ...formData, clientesApresentados: novos });
                              })}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                clientesApresentados: formData.clientesApresentados.filter(c => c.id !== cli.id),
                              });
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONSTRUTOR DE COLUNAS E WIDGETS DE SERVIÇOS E CLIENTES */}
              {renderBlocoConstrutorSecao('nossos_servicos', 'Logos & Serviços')}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 4: SOBRE A AGÊNCIA */}
          {/* ======================================================== */}
          {menuAtivo === 'institucional' && (
            <div className="space-y-4">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  {config?.nomeAgencia ? `Sobre a ${config.nomeAgencia}` : 'Sobre a Nossa Agência'}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Texto Institucional da Agência
                </label>
                <textarea
                  rows={5}
                  value={formData.sobreAgencia}
                  onChange={e => setFormData({ ...formData, sobreAgencia: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* FOTO DE DESTAQUE DA AGÊNCIA */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Foto de Destaque da Agência
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={formData.sobreFotoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"}
                    alt="Foto da Agência"
                    className="w-16 h-16 rounded-xl object-cover border border-purple-300 shadow-xs"
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={formData.sobreFotoUrl || ''}
                      onChange={e => setFormData({ ...formData, sobreFotoUrl: e.target.value })}
                      placeholder="URL da foto institucional"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                    />
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" /> Fazer Upload Foto
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleUploadGenerico(e, url => {
                          setFormData({ ...formData, sobreFotoUrl: url });
                        })}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* CONSTRUTOR DE COLUNAS E WIDGETS SOBRE A AGÊNCIA */}
              {renderBlocoConstrutorSecao('sobre_agencia', 'Sobre a Agência')}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 5: FUNDADORES (LIDERANÇA & SÓCIOS) */}
          {/* ======================================================== */}
          {menuAtivo === 'fundadores' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Lâmina Fundadores (Liderança & Sócios)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SÓCIO / FUNDADOR 1 */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-3">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                    Sócio / Fundador 1
                  </span>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={formData.fundadores.gabrielNome}
                      onChange={e => setFormData({
                        ...formData,
                        fundadores: { ...formData.fundadores, gabrielNome: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.fundadores.instagramGabriel}
                      onChange={e => setFormData({
                        ...formData,
                        fundadores: { ...formData.fundadores, instagramGabriel: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                      Foto do Sócio 1
                    </label>
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.fundadores.fotoGabrielUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80"}
                        alt="Preview Gabriel"
                        className="w-12 h-12 rounded-xl object-cover border border-purple-300 shadow-xs shrink-0"
                      />
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={formData.fundadores.fotoGabrielUrl || ''}
                          onChange={e => setFormData({
                            ...formData,
                            fundadores: { ...formData.fundadores, fotoGabrielUrl: e.target.value }
                          })}
                          placeholder="URL da foto"
                          className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                        />
                        <label className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Fazer Upload Foto
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleUploadGenerico(e, url => {
                              setFormData({
                                ...formData,
                                fundadores: { ...formData.fundadores, fotoGabrielUrl: url }
                              });
                            })}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CAROL BARACHO */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-3">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                    Sócia: Carol Baracho
                  </span>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={formData.fundadores.carolNome}
                      onChange={e => setFormData({
                        ...formData,
                        fundadores: { ...formData.fundadores, carolNome: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold"
                    />
                  </div>

                  <div className="pt-8">
                    <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                      Foto de Carol Baracho
                    </label>
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.fundadores.fotoCarolUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80"}
                        alt="Preview Carol"
                        className="w-12 h-12 rounded-xl object-cover border border-purple-300 shadow-xs shrink-0"
                      />
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={formData.fundadores.fotoCarolUrl || ''}
                          onChange={e => setFormData({
                            ...formData,
                            fundadores: { ...formData.fundadores, fotoCarolUrl: e.target.value }
                          })}
                          placeholder="URL da foto"
                          className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                        />
                        <label className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Fazer Upload Foto
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleUploadGenerico(e, url => {
                              setFormData({
                                ...formData,
                                fundadores: { ...formData.fundadores, fotoCarolUrl: url }
                              });
                            })}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Texto de Apresentação dos Fundadores
                </label>
                <textarea
                  rows={4}
                  value={formData.fundadores.textoApresentacao}
                  onChange={e => setFormData({
                    ...formData,
                    fundadores: { ...formData.fundadores, textoApresentacao: e.target.value }
                  })}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                />
              </div>

              {/* CONSTRUTOR DE COLUNAS E WIDGETS DOS FUNDADORES */}
              {renderBlocoConstrutorSecao('fundadores', 'Liderança & Sócios')}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 6: PREMIAÇÃO & RECONHECIMENTO */}
          {/* ======================================================== */}
          {menuAtivo === 'premiacao' && (
            <div className="space-y-4">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Lâmina Premiação & Reconhecimento Regional
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Título da Premiação
                  </label>
                  <input
                    type="text"
                    value={formData.premiacao.titulo}
                    onChange={e => setFormData({
                      ...formData,
                      premiacao: { ...formData.premiacao, titulo: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    Anos / Votos Destaque
                  </label>
                  <input
                    type="text"
                    value={formData.premiacao.anos}
                    onChange={e => setFormData({
                      ...formData,
                      premiacao: { ...formData.premiacao, anos: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Texto da Premiação
                </label>
                <textarea
                  rows={4}
                  value={formData.premiacao.texto}
                  onChange={e => setFormData({
                    ...formData,
                    premiacao: { ...formData.premiacao, texto: e.target.value }
                  })}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                />
              </div>

              {/* CONSTRUTOR DE COLUNAS E WIDGETS DE PREMIAÇÃO */}
              {renderBlocoConstrutorSecao('premiacao', 'Prêmios & Reconhecimento')}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 7: DIRETRIZES DA MARCA & WIDGETS DE IDENTIDADE */}
          {/* ======================================================== */}
          {menuAtivo === 'cores_logo' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-600" />
                  Diretrizes da Marca & Identidade Visual
                </h3>
              </div>

              {/* INFORMAÇÃO: CORES CENTRAIS NO MENU IDENTIDADE & AGÊNCIA */}
              <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0">
                    <Building className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">
                      Cores Globais & Dados da Agência Gerenciados Centralmente
                    </h4>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                      As cores primária ({formData.corPrimaria}) e secundária ({formData.corSecundaria}), logo oficial e contatos da agência são configurados na aba superior <strong>"Identidade & Agência"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-6 h-6 rounded-lg border border-white/40 shadow-xs" style={{ backgroundColor: formData.corPrimaria }} title={`Primária: ${formData.corPrimaria}`} />
                  <span className="w-6 h-6 rounded-lg border border-white/40 shadow-xs" style={{ backgroundColor: formData.corSecundaria }} title={`Secundária: ${formData.corSecundaria}`} />
                </div>
              </div>

              {/* CONSTRUTOR DE COLUNAS E WIDGETS PARA DIRETRIZES DA MARCA */}
              {renderBlocoConstrutorSecao('time_parceiros', 'Diretrizes & Parceiros')}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 8: CHAVE PIX, TERMOS & RODAPÉ */}
          {/* ======================================================== */}
          {menuAtivo === 'termos_pix' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Dados Bancários, Termos & Rodapé Oficial
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Chave PIX e Instruções de Pagamento
                </label>
                <input
                  type="text"
                  value={formData.dadosBancariosPix}
                  onChange={e => setFormData({ ...formData, dadosBancariosPix: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Termos de Garantia & Cláusulas
                </label>
                <textarea
                  rows={4}
                  value={formData.termosGarantia}
                  onChange={e => setFormData({ ...formData, termosGarantia: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Texto do Rodapé Oficial (Exibido nas Propostas)
                </label>
                <input
                  type="text"
                  value={formData.textoRodape}
                  onChange={e => setFormData({ ...formData, textoRodape: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  * Este texto oficial é exibido integralmente na lâmina final da proposta comercial junto aos créditos da Designer Vip.
                </p>
              </div>

              {/* CONSTRUTOR DE COLUNAS E WIDGETS PIX E GARANTIAS */}
              {renderBlocoConstrutorSecao('dados_pagamento', 'PIX, Garantias & Rodapé')}
            </div>
          )}

        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: EDITAR FUNDO DA SEÇÃO (COR OU IMAGEM COVER) */}
      {/* ======================================================== */}
      {secaoEditandoFundo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  Editar Fundo: {secaoEditandoFundo.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSecaoEditandoFundo(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SELEÇÃO DE COR DE FUNDO */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                Cor de Fundo da Seção
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secaoEditandoFundo.estilo?.corFundo || '#ffffff'}
                  onChange={e => setSecaoEditandoFundo({
                    ...secaoEditandoFundo,
                    estilo: { ...secaoEditandoFundo.estilo, corFundo: e.target.value }
                  })}
                  className="w-12 h-12 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={secaoEditandoFundo.estilo?.corFundo || '#ffffff'}
                  onChange={e => setSecaoEditandoFundo({
                    ...secaoEditandoFundo,
                    estilo: { ...secaoEditandoFundo.estilo, corFundo: e.target.value }
                  })}
                  placeholder="#ffffff"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setSecaoEditandoFundo({
                    ...secaoEditandoFundo,
                    estilo: { ...secaoEditandoFundo.estilo, corFundo: '' }
                  })}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100"
                >
                  Padrão
                </button>
              </div>
            </div>

            {/* SELEÇÃO DE IMAGEM COVER DE FUNDO */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                Imagem de Fundo (Cobertura Total da Seção)
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={secaoEditandoFundo.estilo?.imagemFundoUrl || ''}
                  onChange={e => setSecaoEditandoFundo({
                    ...secaoEditandoFundo,
                    estilo: { ...secaoEditandoFundo.estilo, imagemFundoUrl: e.target.value }
                  })}
                  placeholder="Cole a URL da imagem ou envie abaixo"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                />
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-purple-700 dark:text-purple-300 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Enviar Imagem do Computador
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleUploadGenerico(e, url => {
                        setSecaoEditandoFundo({
                          ...secaoEditandoFundo,
                          estilo: { ...secaoEditandoFundo.estilo, imagemFundoUrl: url }
                        });
                      })}
                    />
                  </label>
                  {secaoEditandoFundo.estilo?.imagemFundoUrl && (
                    <button
                      type="button"
                      onClick={() => setSecaoEditandoFundo({
                        ...secaoEditandoFundo,
                        estilo: { ...secaoEditandoFundo.estilo, imagemFundoUrl: '' }
                      })}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Remover imagem
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* COR DO TEXTO (SE FUNDO ESCURO) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                Cor do Texto da Seção (Opcional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secaoEditandoFundo.estilo?.corTexto || '#18181b'}
                  onChange={e => setSecaoEditandoFundo({
                    ...secaoEditandoFundo,
                    estilo: { ...secaoEditandoFundo.estilo, corTexto: e.target.value }
                  })}
                  className="w-10 h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={secaoEditandoFundo.estilo?.corTexto || ''}
                  onChange={e => setSecaoEditandoFundo({
                    ...secaoEditandoFundo,
                    estilo: { ...secaoEditandoFundo.estilo, corTexto: e.target.value }
                  })}
                  placeholder="Deixe em branco para usar o padrão"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSecaoEditandoFundo(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSalvarFundoSecao(secaoEditandoFundo.id, secaoEditandoFundo.estilo)}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md"
              >
                Aplicar Fundo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIÇÃO DE SEÇÃO PERSONALIZADA (WIDGET BUILDER) */}
      {/* ======================================================== */}
      {secaoEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8 max-h-[85vh] flex flex-col">
            
            {/* MODAL HEADER */}
            <div className="p-6 bg-zinc-50 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    <Edit3 className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                    Editor de Widgets da Seção: {secaoEmEdicao.titulo}
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Adicione linhas com 1 a 4 colunas e insira widgets de título, texto com cor, imagem, lista configurável, botão e divisores.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSecaoEmEdicao(null)}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* CONFIGURAÇÃO DO TÍTULO, DESCRIÇÃO E MENU FLUTUANTE */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Título da Seção</label>
                    <input
                      type="text"
                      value={secaoEmEdicao.titulo}
                      onChange={e => {
                        const nova = { ...secaoEmEdicao, titulo: e.target.value };
                        setSecaoEmEdicao(nova);
                        const novas = secoesAtivas.map(s => s.id === nova.id ? nova : s);
                        setSecoesAtivas(novas);
                        if (alvoAplicacao === 'global') setFormData(prev => ({ ...prev, secoesOrdem: novas }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Descrição Breve</label>
                    <input
                      type="text"
                      value={secaoEmEdicao.descricao}
                      onChange={e => {
                        const nova = { ...secaoEmEdicao, descricao: e.target.value };
                        setSecaoEmEdicao(nova);
                        const novas = secoesAtivas.map(s => s.id === nova.id ? nova : s);
                        setSecoesAtivas(novas);
                        if (alvoAplicacao === 'global') setFormData(prev => ({ ...prev, secoesOrdem: novas }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                    />
                  </div>
                </div>

                {/* TOGGLE MENU LATERAL FLUTUANTE */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-[2px] bg-purple-600 block shadow-xs" />
                    <div>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                        Exibir no Menu Flutuante (Quadradinhos Laterais)
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Se ativado, esta seção terá seu próprio ponto de ancoragem no menu flutuante lateral da proposta.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={secaoEmEdicao.mostrarNoMenuFlutuante !== false}
                    onChange={e => {
                      const nova = { ...secaoEmEdicao, mostrarNoMenuFlutuante: e.target.checked };
                      setSecaoEmEdicao(nova);
                      const novas = secoesAtivas.map(s => s.id === nova.id ? nova : s);
                      setSecoesAtivas(novas);
                      if (alvoAplicacao === 'global') setFormData(prev => ({ ...prev, secoesOrdem: novas }));
                    }}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* ======================================================== */}
              {/* EDITOR DE CONTEÚDO NATIVO DA SEÇÃO SELECIONADA */}
              {/* ======================================================== */}
              {secaoEmEdicao.id === 'fundadores' && (
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-800">
                    <Users className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      Fotos & Dados dos Sócios / Fundadores
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SÓCIO / FUNDADOR 1 */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                        Sócio / Fundador 1
                      </span>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Nome de Exibição</label>
                        <input
                          type="text"
                          value={formData.fundadores.gabrielNome}
                          onChange={e => setFormData(prev => ({
                            ...prev,
                            fundadores: { ...prev.fundadores, gabrielNome: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-zinc-50 dark:bg-zinc-800 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Instagram</label>
                        <input
                          type="text"
                          value={formData.fundadores.instagramGabriel}
                          onChange={e => setFormData(prev => ({
                            ...prev,
                            fundadores: { ...prev.fundadores, instagramGabriel: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-zinc-50 dark:bg-zinc-800 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Foto do Sócio 1</label>
                        <div className="flex items-center gap-2">
                          <img
                            src={formData.fundadores.fotoGabrielUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80"}
                            alt="Preview Gabriel"
                            className="w-12 h-12 rounded-lg object-cover border border-purple-300 shrink-0 shadow-xs"
                          />
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={formData.fundadores.fotoGabrielUrl || ''}
                              onChange={e => setFormData(prev => ({
                                ...prev,
                                fundadores: { ...prev.fundadores, fotoGabrielUrl: e.target.value }
                              }))}
                              placeholder="URL da foto"
                              className="w-full px-2 py-1 rounded border text-[11px] bg-zinc-50 dark:bg-zinc-800"
                            />
                            <label className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer">
                              <Upload className="w-3 h-3" /> Fazer Upload Foto
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => handleUploadGenerico(e, url => {
                                  setFormData(prev => ({
                                    ...prev,
                                    fundadores: { ...prev.fundadores, fotoGabrielUrl: url }
                                  }));
                                })}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CAROL BARACHO */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                        Sócia: Carol Baracho
                      </span>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Nome de Exibição</label>
                        <input
                          type="text"
                          value={formData.fundadores.carolNome}
                          onChange={e => setFormData(prev => ({
                            ...prev,
                            fundadores: { ...prev.fundadores, carolNome: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-zinc-50 dark:bg-zinc-800 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Foto de Carol Baracho</label>
                        <div className="flex items-center gap-2">
                          <img
                            src={formData.fundadores.fotoCarolUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80"}
                            alt="Preview Carol"
                            className="w-12 h-12 rounded-lg object-cover border border-purple-300 shrink-0 shadow-xs"
                          />
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={formData.fundadores.fotoCarolUrl || ''}
                              onChange={e => setFormData(prev => ({
                                ...prev,
                                fundadores: { ...prev.fundadores, fotoCarolUrl: e.target.value }
                              }))}
                              placeholder="URL da foto"
                              className="w-full px-2 py-1 rounded border text-[11px] bg-zinc-50 dark:bg-zinc-800"
                            />
                            <label className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer">
                              <Upload className="w-3 h-3" /> Fazer Upload Foto
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => handleUploadGenerico(e, url => {
                                  setFormData(prev => ({
                                    ...prev,
                                    fundadores: { ...prev.fundadores, fotoCarolUrl: url }
                                  }));
                                })}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Texto de Apresentação / Bio dos Fundadores</label>
                    <textarea
                      rows={3}
                      value={formData.fundadores.textoApresentacao}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        fundadores: { ...prev.fundadores, textoApresentacao: e.target.value }
                      }))}
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>
                </div>
              )}

              {/* SERVIÇOS INSTITUCIONAIS: 4 BOXES */}
              {secaoEmEdicao.id === 'nossos_servicos' && (
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2">
                      <BoxIcon className="w-4 h-4 text-purple-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                        Boxes de Serviços Institucionais ({formData.servicosInstitucionais.length} Ativos)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const novo = {
                          id: `srv_${Date.now()}`,
                          titulo: 'Novo Box de Serviço',
                          descricao: 'Descrição detalhada dos serviços, entregáveis ou diferenciais oferecidos neste pilar.'
                        };
                        setFormData(prev => ({
                          ...prev,
                          servicosInstitucionais: [...prev.servicosInstitucionais, novo]
                        }));
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Box
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.servicosInstitucionais.map((srv, sIdx) => (
                      <div key={srv.id || `srv_${sIdx}`} className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-purple-600">Box #{sIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                servicosInstitucionais: prev.servicosInstitucionais.filter(s => s.id !== srv.id)
                              }));
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            title="Excluir este box"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Título do Serviço</label>
                          <input
                            type="text"
                            value={srv.titulo}
                            onChange={e => {
                              const novos = [...formData.servicosInstitucionais];
                              novos[sIdx] = { ...novos[sIdx], titulo: e.target.value };
                              setFormData(prev => ({ ...prev, servicosInstitucionais: novos }));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-zinc-50 dark:bg-zinc-800 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Descrição</label>
                          <textarea
                            rows={2}
                            value={srv.descricao}
                            onChange={e => {
                              const novos = [...formData.servicosInstitucionais];
                              novos[sIdx] = { ...novos[sIdx], descricao: e.target.value };
                              setFormData(prev => ({ ...prev, servicosInstitucionais: novos }));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-zinc-50 dark:bg-zinc-800"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOBRE A AGÊNCIA */}
              {secaoEmEdicao.id === 'sobre_agencia' && (
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-800">
                    <Building className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      Conteúdo Sobre a Agência & Foto Oficial
                    </h4>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Texto Institucional da Agência</label>
                    <textarea
                      rows={4}
                      value={formData.sobreAgencia}
                      onChange={e => setFormData(prev => ({ ...prev, sobreAgencia: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Foto de Destaque da Agência</label>
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.sobreFotoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"}
                        alt="Foto da Agência"
                        className="w-16 h-16 rounded-xl object-cover border border-purple-300 shadow-xs"
                      />
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={formData.sobreFotoUrl || ''}
                          onChange={e => setFormData(prev => ({ ...prev, sobreFotoUrl: e.target.value }))}
                          placeholder="URL da foto institucional"
                          className="w-full px-2.5 py-1.5 rounded-xl border text-xs bg-white dark:bg-zinc-900"
                        />
                        <label className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Fazer Upload Foto
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handleUploadGenerico(e, url => {
                              setFormData(prev => ({ ...prev, sobreFotoUrl: url }));
                            })}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PREMIAÇÃO */}
              {secaoEmEdicao.id === 'premiacao' && (
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-800">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      Premiação & Reconhecimento Regional
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Título da Premiação</label>
                      <input
                        type="text"
                        value={formData.premiacao.titulo}
                        onChange={e => setFormData(prev => ({ ...prev, premiacao: { ...prev.premiacao, titulo: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Anos Consecutivos</label>
                      <input
                        type="text"
                        value={formData.premiacao.anos}
                        onChange={e => setFormData(prev => ({ ...prev, premiacao: { ...prev.premiacao, anos: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Texto Explicativo</label>
                    <textarea
                      rows={3}
                      value={formData.premiacao.texto}
                      onChange={e => setFormData(prev => ({ ...prev, premiacao: { ...prev.premiacao, texto: e.target.value } }))}
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>
                </div>
              )}

              {/* TIME & PARCEIROS */}
              {secaoEmEdicao.id === 'time_parceiros' && (
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-800">
                    <Award className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      O Time & Parceiros Oficiais
                    </h4>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Texto do Time</label>
                    <textarea
                      rows={3}
                      value={formData.time.texto}
                      onChange={e => setFormData(prev => ({ ...prev, time: { ...prev.time, texto: e.target.value } }))}
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>
                </div>
              )}

              {/* DADOS BANCÁRIOS & PIX */}
              {secaoEmEdicao.id === 'dados_pagamento' && (
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-800">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      Dados Bancários, PIX & Rodapé
                    </h4>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Chave PIX e Dados Bancários</label>
                    <input
                      type="text"
                      value={formData.dadosBancariosPix}
                      onChange={e => setFormData(prev => ({ ...prev, dadosBancariosPix: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-white dark:bg-zinc-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Termos de Garantia</label>
                    <textarea
                      rows={3}
                      value={formData.termosGarantia}
                      onChange={e => setFormData(prev => ({ ...prev, termosGarantia: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Texto do Rodapé Oficial</label>
                    <input
                      type="text"
                      value={formData.textoRodape}
                      onChange={e => setFormData(prev => ({ ...prev, textoRodape: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-white dark:bg-zinc-900 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* CAPA OFICIAL */}
              {secaoEmEdicao.id === 'hero_capa' && (
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-800">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      Dados da Capa Oficial
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Título da Capa</label>
                      <input
                        type="text"
                        value={formData.capa.titulo}
                        onChange={e => setFormData(prev => ({ ...prev, capa: { ...prev.capa, titulo: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Subtítulo / Slogan</label>
                      <input
                        type="text"
                        value={formData.capa.subtitulo}
                        onChange={e => setFormData(prev => ({ ...prev, capa: { ...prev.capa, subtitulo: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CONFIGURAÇÃO DE FUNDO DA SEÇÃO (COR OU IMAGEM COVER COM COBERTURA TOTAL) */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <Paintbrush className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Fundo da Seção (Cor de Fundo ou Imagem Cover Total)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Cor de Fundo
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secaoEmEdicao.estilo?.corFundo || '#ffffff'}
                        onChange={e => {
                          const nova: SecaoConfiguravel = {
                            ...secaoEmEdicao,
                            estilo: { ...secaoEmEdicao.estilo, corFundo: e.target.value }
                          };
                          setSecaoEmEdicao(nova);
                          const novas = secoesAtivas.map(s => s.id === nova.id ? nova : s);
                          setSecoesAtivas(novas);
                          if (alvoAplicacao === 'global') setFormData(prev => ({ ...prev, secoesOrdem: novas }));
                        }}
                        className="w-10 h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={secaoEmEdicao.estilo?.corFundo || ''}
                        onChange={e => {
                          const nova: SecaoConfiguravel = {
                            ...secaoEmEdicao,
                            estilo: { ...secaoEmEdicao.estilo, corFundo: e.target.value }
                          };
                          setSecaoEmEdicao(nova);
                          const novas = secoesAtivas.map(s => s.id === nova.id ? nova : s);
                          setSecoesAtivas(novas);
                          if (alvoAplicacao === 'global') setFormData(prev => ({ ...prev, secoesOrdem: novas }));
                        }}
                        placeholder="#ffffff (Padrão branco)"
                        className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Imagem de Fundo (Cobertura Total da Seção)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={secaoEmEdicao.estilo?.imagemFundoUrl || ''}
                        onChange={e => {
                          const nova: SecaoConfiguravel = {
                            ...secaoEmEdicao,
                            estilo: { ...secaoEmEdicao.estilo, imagemFundoUrl: e.target.value }
                          };
                          setSecaoEmEdicao(nova);
                          const novas = secoesAtivas.map(s => s.id === nova.id ? nova : s);
                          setSecoesAtivas(novas);
                          if (alvoAplicacao === 'global') setFormData(prev => ({ ...prev, secoesOrdem: novas }));
                        }}
                        placeholder="URL da imagem cover"
                        className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                      />
                      <label className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer shrink-0" title="Upload de imagem">
                        <Upload className="w-4 h-4 text-purple-600" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleUploadGenerico(e, url => {
                            const nova: SecaoConfiguravel = {
                              ...secaoEmEdicao,
                              estilo: { ...secaoEmEdicao.estilo, imagemFundoUrl: url }
                            };
                            setSecaoEmEdicao(nova);
                            const novas = secoesAtivas.map(s => s.id === nova.id ? nova : s);
                            setSecoesAtivas(novas);
                            if (alvoAplicacao === 'global') setFormData(prev => ({ ...prev, secoesOrdem: novas }));
                          })}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {secaoEmEdicao.estilo?.imagemFundoUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="overlay_check"
                      checked={Boolean(secaoEmEdicao.estilo?.overlayEscuro)}
                      onChange={e => {
                        const nova: SecaoConfiguravel = {
                          ...secaoEmEdicao,
                          estilo: { ...secaoEmEdicao.estilo, overlayEscuro: e.target.checked }
                        };
                        setSecaoEmEdicao(nova);
                        const novas = secoesAtivas.map(s => s.id === nova.id ? nova : s);
                        setSecoesAtivas(novas);
                        if (alvoAplicacao === 'global') setFormData(prev => ({ ...prev, secoesOrdem: novas }));
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <label htmlFor="overlay_check" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                      Aplicar overlay escuro semi-transparente sobre a imagem (garante leitura dos textos)
                    </label>
                  </div>
                )}
              </div>

              {/* ADICIONAR LINHA DE CONTEÚDO COM COLUNAS */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-center space-y-3">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-300 block">
                  + Adicionar Nova Linha de Conteúdo (Escolha a Quantidade de Colunas)
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { cols: 1, label: '1 Coluna (100%)' },
                    { cols: 2, label: '2 Colunas (50% / 50%)' },
                    { cols: 3, label: '3 Colunas (33%)' },
                    { cols: 4, label: '4 Colunas (25%)' },
                  ].map(c => (
                    <button
                      key={c.cols}
                      type="button"
                      onClick={() => handleAdicionarLinha(c.cols)}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 text-xs font-bold text-purple-900 dark:text-purple-200 shadow-xs transition-colors cursor-pointer"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* LINHAS, COLUNAS E WIDGETS */}
              <div className="space-y-4">
                {(secaoEmEdicao.linhas || []).map((linha, lIndex) => (
                  <div key={linha.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-4">
                    <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                      <span className="font-bold flex items-center gap-1.5">
                        <Rows className="w-4 h-4 text-purple-600" /> Linha {lIndex + 1} ({linha.qtdColunas} colunas)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoverLinha(linha.id)}
                        className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover Linha
                      </button>
                    </div>

                    <div className={`grid gap-4 ${
                      linha.qtdColunas === 1 ? 'grid-cols-1' :
                      linha.qtdColunas === 2 ? 'grid-cols-1 md:grid-cols-2' :
                      linha.qtdColunas === 3 ? 'grid-cols-1 md:grid-cols-3' :
                      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                    }`}>
                      {linha.colunas.map((col, cIndex) => (
                        <div key={col.id} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="text-[10px] font-bold uppercase text-zinc-400">
                              Coluna {cIndex + 1}
                            </span>
                            {/* TOGGLE DIREÇÃO: VERTICAL vs HORIZONTAL */}
                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleMudarDirecaoColuna(linha.id, col.id, 'vertical')}
                                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                                  (col.direcao || 'vertical') === 'vertical'
                                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                                }`}
                                title="Empilhar itens verticalmente"
                              >
                                <ArrowDown className="w-3 h-3" /> Vertical
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMudarDirecaoColuna(linha.id, col.id, 'horizontal')}
                                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                                  col.direcao === 'horizontal'
                                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                                }`}
                                title="Itens lado a lado horizontalmente"
                              >
                                <ArrowRight className="w-3 h-3" /> Horizontal
                              </button>
                            </div>
                          </div>

                          {/* LISTA DE WIDGETS NA COLUNA */}
                          <div className="space-y-2">
                            {col.widgets.map(w => (
                              <div key={w.id} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                                  <span className="capitalize flex items-center gap-1">
                                    {w.tipo === 'titulo' && <Type className="w-3.5 h-3.5 text-purple-600" />}
                                    {w.tipo === 'texto' && <AlignLeft className="w-3.5 h-3.5 text-blue-600" />}
                                    {w.tipo === 'imagem' && <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />}
                                    {w.tipo === 'lista' && <List className="w-3.5 h-3.5 text-amber-600" />}
                                    {w.tipo === 'divisor' && <Minus className="w-3.5 h-3.5 text-zinc-500" />}
                                    {w.tipo === 'botao' && <MousePointerClick className="w-3.5 h-3.5 text-rose-600" />}
                                    {w.tipo === 'box' && <BoxIcon className="w-3.5 h-3.5 text-amber-600" />}
                                    {w.tipo === 'tabela' && <TableIcon className="w-3.5 h-3.5 text-cyan-600" />}
                                    {w.tipo}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoverWidget(linha.id, col.id, w.id)}
                                    className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* EDITOR WIDGET: TÍTULO COM COR */}
                                {w.tipo === 'titulo' && (
                                  <div className="space-y-1.5">
                                    <input
                                      type="text"
                                      value={w.conteudo.texto || ''}
                                      onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { texto: e.target.value })}
                                      placeholder="Texto do Título"
                                      className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-zinc-400">Cor:</span>
                                      <input
                                        type="color"
                                        value={w.conteudo.cor || '#5A0072'}
                                        onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { cor: e.target.value })}
                                        className="w-6 h-6 rounded cursor-pointer p-0 border border-zinc-300"
                                      />
                                      <input
                                        type="text"
                                        value={w.conteudo.cor || ''}
                                        onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { cor: e.target.value })}
                                        placeholder="Padrão"
                                        className="w-20 px-1 py-0.5 text-[10px] rounded border border-zinc-300 dark:border-zinc-700 font-mono"
                                      />
                                      {w.conteudo.cor && (
                                        <button
                                          type="button"
                                          onClick={() => handleAtualizarWidget(linha.id, col.id, w.id, { cor: undefined })}
                                          className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
                                        >
                                          Resetar
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* EDITOR WIDGET: TEXTO COM COR */}
                                {w.tipo === 'texto' && (
                                  <div className="space-y-1.5">
                                    <textarea
                                      rows={2}
                                      value={w.conteudo.texto || ''}
                                      onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { texto: e.target.value })}
                                      placeholder="Conteúdo do texto"
                                      className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-zinc-400">Cor:</span>
                                      <input
                                        type="color"
                                        value={w.conteudo.corTexto || '#3f3f46'}
                                        onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { corTexto: e.target.value })}
                                        className="w-6 h-6 rounded cursor-pointer p-0 border border-zinc-300"
                                      />
                                      <input
                                        type="text"
                                        value={w.conteudo.corTexto || ''}
                                        onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { corTexto: e.target.value })}
                                        placeholder="Padrão"
                                        className="w-20 px-1 py-0.5 text-[10px] rounded border border-zinc-300 dark:border-zinc-700 font-mono"
                                      />
                                      {w.conteudo.corTexto && (
                                        <button
                                          type="button"
                                          onClick={() => handleAtualizarWidget(linha.id, col.id, w.id, { corTexto: undefined })}
                                          className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
                                        >
                                          Resetar
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* EDITOR WIDGET: LISTA TOTALMENTE FUNCIONAL */}
                                {w.tipo === 'lista' && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1 text-[10px]">
                                      <span className="text-zinc-400">Orientação:</span>
                                      <button
                                        type="button"
                                        onClick={() => handleAtualizarWidget(linha.id, col.id, w.id, { orientacaoLista: 'vertical' })}
                                        className={`px-2 py-0.5 rounded ${w.conteudo.orientacaoLista !== 'horizontal' ? 'bg-purple-700 text-white font-bold' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                      >
                                        Vertical
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAtualizarWidget(linha.id, col.id, w.id, { orientacaoLista: 'horizontal' })}
                                        className={`px-2 py-0.5 rounded ${w.conteudo.orientacaoLista === 'horizontal' ? 'bg-purple-700 text-white font-bold' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                      >
                                        Horizontal (Grid)
                                      </button>
                                    </div>

                                    {/* Itens existentes da lista */}
                                    <div className="space-y-1">
                                      {(w.conteudo.itensLista || []).map((item, iIdx) => (
                                        <div key={iIdx} className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={item}
                                            onChange={e => {
                                              const novosItens = [...(w.conteudo.itensLista || [])];
                                              novosItens[iIdx] = e.target.value;
                                              handleAtualizarWidget(linha.id, col.id, w.id, { itensLista: novosItens });
                                            }}
                                            className="flex-1 px-1.5 py-0.5 text-[11px] rounded border bg-white dark:bg-zinc-900"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const novosItens = (w.conteudo.itensLista || []).filter((_, idx) => idx !== iIdx);
                                              handleAtualizarWidget(linha.id, col.id, w.id, { itensLista: novosItens });
                                            }}
                                            className="text-rose-500 hover:text-rose-700 p-0.5"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Adicionar novo item */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const novosItens = [...(w.conteudo.itensLista || []), 'Novo item da lista'];
                                        handleAtualizarWidget(linha.id, col.id, w.id, { itensLista: novosItens });
                                      }}
                                      className="text-[10px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" /> Adicionar item
                                    </button>
                                  </div>
                                )}

                                {/* EDITOR WIDGET: BARRA DE DIVISÃO (LINHA OU COLUNA) */}
                                {w.tipo === 'divisor' && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-1 text-[10px]">
                                      <span className="text-zinc-400">Tipo de Barra:</span>
                                      <button
                                        type="button"
                                        onClick={() => handleAtualizarWidget(linha.id, col.id, w.id, { orientacaoDivisor: 'horizontal' })}
                                        className={`px-2 py-0.5 rounded ${w.conteudo.orientacaoDivisor !== 'vertical' ? 'bg-purple-700 text-white font-bold' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                      >
                                        Linha (Horizontal)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAtualizarWidget(linha.id, col.id, w.id, { orientacaoDivisor: 'vertical' })}
                                        className={`px-2 py-0.5 rounded ${w.conteudo.orientacaoDivisor === 'vertical' ? 'bg-purple-700 text-white font-bold' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                      >
                                        Coluna (Vertical)
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-zinc-400">Cor:</span>
                                      <input
                                        type="color"
                                        value={w.conteudo.corDivisor || '#e4e4e7'}
                                        onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { corDivisor: e.target.value })}
                                        className="w-6 h-6 rounded cursor-pointer p-0 border"
                                      />
                                      <span className="text-[10px] text-zinc-400">Espessura:</span>
                                      <select
                                        value={w.conteudo.espessuraDivisorPx || 1}
                                        onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { espessuraDivisorPx: Number(e.target.value) })}
                                        className="text-[10px] rounded border px-1 py-0.5 bg-white dark:bg-zinc-900"
                                      >
                                        <option value={1}>1px</option>
                                        <option value={2}>2px</option>
                                        <option value={4}>4px</option>
                                      </select>
                                    </div>
                                  </div>
                                )}

                                {/* EDITOR WIDGET: IMAGEM COM UPLOAD */}
                                {w.tipo === 'imagem' && (
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={w.conteudo.urlImagem || ''}
                                      onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { urlImagem: e.target.value })}
                                      placeholder="URL da Imagem"
                                      className="w-full px-2 py-1 text-[11px] rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                    />
                                    <label className="text-[10px] text-purple-600 font-bold block cursor-pointer">
                                      Fazer Upload Direto
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => handleUploadGenerico(e, url => {
                                          handleAtualizarWidget(linha.id, col.id, w.id, { urlImagem: url });
                                        })}
                                      />
                                    </label>
                                  </div>
                                )}

                                {/* EDITOR WIDGET: BOTÃO */}
                                {w.tipo === 'botao' && (
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={w.conteudo.textoBotao || ''}
                                      onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { textoBotao: e.target.value })}
                                      placeholder="Texto do Botão"
                                      className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                    />
                                    <input
                                      type="text"
                                      value={w.conteudo.urlBotao || ''}
                                      onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { urlBotao: e.target.value })}
                                      placeholder="Link URL"
                                      className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                    />
                                  </div>
                                )}

                                {/* EDITOR WIDGET: BOX (CARD ESTILO SERVIÇO) */}
                                {w.tipo === 'box' && (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                      <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Título do Box</label>
                                        <input
                                          type="text"
                                          value={w.conteudo.tituloBox || ''}
                                          onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { tituloBox: e.target.value })}
                                          placeholder="Ex: Gestão de Mídia & Tráfego"
                                          className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Tag de Destaque (Badge)</label>
                                        <input
                                          type="text"
                                          value={w.conteudo.tagDestaque || ''}
                                          onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { tagDestaque: e.target.value })}
                                          placeholder="Ex: Exclusivo"
                                          className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Texto / Descrição do Box</label>
                                      <textarea
                                        rows={2}
                                        value={w.conteudo.textoBox || ''}
                                        onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { textoBox: e.target.value })}
                                        placeholder="Descrição dos serviços ou diferenciais do card..."
                                        className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                      />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 pt-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-zinc-400">Fundo:</span>
                                        <input
                                          type="color"
                                          value={w.conteudo.corFundoBox || '#f8fafc'}
                                          onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { corFundoBox: e.target.value })}
                                          className="w-6 h-6 rounded cursor-pointer p-0 border"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-zinc-400">Borda:</span>
                                        <input
                                          type="color"
                                          value={w.conteudo.corBordaBox || '#e2e8f0'}
                                          onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { corBordaBox: e.target.value })}
                                          className="w-6 h-6 rounded cursor-pointer p-0 border"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-zinc-400">Texto:</span>
                                        <input
                                          type="color"
                                          value={w.conteudo.corTextoBox || '#18181b'}
                                          onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { corTextoBox: e.target.value })}
                                          className="w-6 h-6 rounded cursor-pointer p-0 border"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* EDITOR WIDGET: TABELA */}
                                {w.tipo === 'tabela' && (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                      <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Linhas</label>
                                        <input
                                          type="number"
                                          min={1}
                                          max={10}
                                          value={w.conteudo.linhasTabela || 2}
                                          onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { linhasTabela: Math.max(1, parseInt(e.target.value) || 1) })}
                                          className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Colunas</label>
                                        <input
                                          type="number"
                                          min={1}
                                          max={6}
                                          value={w.conteudo.colunasTabela || 2}
                                          onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { colunasTabela: Math.max(1, parseInt(e.target.value) || 1) })}
                                          className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5" title="0 = Sem borda, 1 = 1px, 2 = 2px...">
                                          Borda (0 = Sem)
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          max={10}
                                          value={w.conteudo.espessuraBorda ?? 1}
                                          onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { espessuraBorda: Math.max(0, parseInt(e.target.value) || 0) })}
                                          className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Cor da Borda</label>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="color"
                                            value={w.conteudo.corBorda || '#e4e4e7'}
                                            onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { corBorda: e.target.value })}
                                            className="w-6 h-6 rounded cursor-pointer p-0 border"
                                          />
                                          <input
                                            type="text"
                                            value={w.conteudo.corBorda || '#e4e4e7'}
                                            onChange={e => handleAtualizarWidget(linha.id, col.id, w.id, { corBorda: e.target.value })}
                                            className="w-full px-1 py-1 text-[10px] font-mono rounded border"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* CÉLULAS DA TABELA */}
                                    <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                        Células da Tabela (Texto ou Imagem por Célula)
                                      </span>
                                      <div className="space-y-2 max-h-56 overflow-y-auto p-1 bg-zinc-100/60 dark:bg-zinc-900/60 rounded-xl">
                                        {Array.from({ length: w.conteudo.linhasTabela || 2 }).map((_, rIdx) => (
                                          <div key={rIdx} className="space-y-1">
                                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                                              Linha {rIdx + 1}:
                                            </span>
                                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${w.conteudo.colunasTabela || 2}, minmax(0, 1fr))` }}>
                                              {Array.from({ length: w.conteudo.colunasTabela || 2 }).map((_, cIdx) => {
                                                const cell = (w.conteudo.celulasTabela || []).find(cl => cl.linha === rIdx && cl.coluna === cIdx) || {
                                                  linha: rIdx,
                                                  coluna: cIdx,
                                                  tipo: 'texto' as const,
                                                  texto: `Item ${rIdx + 1}.${cIdx + 1}`,
                                                };

                                                return (
                                                  <div key={cIdx} className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-1">
                                                    <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400">
                                                      <span>[{rIdx + 1},{cIdx + 1}]</span>
                                                      <div className="flex items-center gap-1">
                                                        <button
                                                          type="button"
                                                          onClick={() => handleAtualizarCelulaTabela(linha.id, col.id, w.id, rIdx, cIdx, { tipo: 'texto' })}
                                                          className={`px-1 py-0.5 rounded cursor-pointer ${cell.tipo !== 'imagem' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-500'}`}
                                                        >
                                                          Texto
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => handleAtualizarCelulaTabela(linha.id, col.id, w.id, rIdx, cIdx, { tipo: 'imagem' })}
                                                          className={`px-1 py-0.5 rounded cursor-pointer ${cell.tipo === 'imagem' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-500'}`}
                                                        >
                                                          Imagem
                                                        </button>
                                                      </div>
                                                    </div>

                                                    {cell.tipo === 'imagem' ? (
                                                      <div className="space-y-1">
                                                        <input
                                                          type="text"
                                                          value={cell.urlImagem || ''}
                                                          onChange={e => handleAtualizarCelulaTabela(linha.id, col.id, w.id, rIdx, cIdx, { urlImagem: e.target.value })}
                                                          placeholder="URL da Imagem"
                                                          className="w-full px-1.5 py-0.5 text-[10px] rounded border bg-zinc-50 dark:bg-zinc-900"
                                                        />
                                                        <label className="text-[9px] text-purple-600 font-bold block cursor-pointer">
                                                          Upload Imagem
                                                          <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={e => handleUploadGenerico(e, url => {
                                                              handleAtualizarCelulaTabela(linha.id, col.id, w.id, rIdx, cIdx, { urlImagem: url });
                                                            })}
                                                          />
                                                        </label>
                                                      </div>
                                                    ) : (
                                                      <input
                                                        type="text"
                                                        value={cell.texto || ''}
                                                        onChange={e => handleAtualizarCelulaTabela(linha.id, col.id, w.id, rIdx, cIdx, { texto: e.target.value })}
                                                        placeholder="Texto da célula"
                                                        className="w-full px-1.5 py-0.5 text-[10px] rounded border bg-zinc-50 dark:bg-zinc-900"
                                                      />
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* BOTÃO ADICIONAR WIDGET */}
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex flex-wrap gap-1">
                              {(['titulo', 'texto', 'imagem', 'lista', 'divisor', 'botao', 'box', 'tabela'] as TipoWidget[]).map(tipo => (
                                <button
                                  key={tipo}
                                  type="button"
                                  onClick={() => handleAdicionarWidget(linha.id, col.id, tipo)}
                                  className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-100 dark:hover:bg-purple-950 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
                                >
                                  +{tipo}
                                </button>
                              ))}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (alvoAplicacao === 'global') {
                    onSalvarConfig({
                      ...formData,
                      secoesOrdem: secoesAtivas,
                    });
                  }
                  setSecaoEmEdicao(null);
                  setFeedback({
                    tipo: 'sucesso',
                    titulo: 'Edição Concluída',
                    mensagem: 'Todas as alterações de conteúdo, fotos, widgets e fundo foram gravadas com sucesso.',
                    aberto: true,
                  });
                }}
                className="px-6 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                Concluir Edição da Seção
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: SALVAR MODELO DE SEÇÕES */}
      {/* ======================================================== */}
      {modalSalvarModeloAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-500" />
              Salvar Estrutura como Modelo
            </h3>
            <p className="text-xs text-zinc-500">
              Guarde esta organização e estilo de seções para aplicar facilmente em qualquer outra proposta no futuro.
            </p>

            <form onSubmit={handleSalvarComoModelo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Nome do Modelo *</label>
                <input
                  type="text"
                  required
                  value={nomeNovoModelo}
                  onChange={e => setNomeNovoModelo(e.target.value)}
                  placeholder="Ex: Modelo Odontologia Premium"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Descrição</label>
                <input
                  type="text"
                  value={descricaoNovoModelo}
                  onChange={e => setDescricaoNovoModelo(e.target.value)}
                  placeholder="Ex: Focado em clínicas com destaque para análise de redes"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalSalvarModeloAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md"
                >
                  Salvar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: VISUALIZAR PRÉVIA EM TEMPO REAL ANTES DE SALVAR */}
      {/* ======================================================== */}
      {previaAberta && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white animate-fade-in overflow-hidden">
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h4 className="font-bold text-sm text-white">
                  Pré-visualização da Proposta em Tempo Real
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Visualizando com as seções e widgets configurados atualmente no CMS.
                </p>
              </div>
            </div>

            <button
              onClick={() => setPreviaAberta(false)}
              className="px-4 py-2 rounded-xl bg-white text-zinc-900 font-bold text-xs hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Fechar Prévia
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ClientProposalView
              proposta={propostaParaPrevia}
              config={{
                ...formData,
                secoesOrdem: secoesAtivas,
              }}
              onVoltarParaPainel={() => setPreviaAberta(false)}
            />
          </div>
        </div>
      )}

      {/* FEEDBACK POPUP GLOBAL */}
      <FeedbackPopup
        feedback={feedback}
        onFechar={() => setFeedback(prev => ({ ...prev, aberto: false }))}
      />

    </div>
  );
};

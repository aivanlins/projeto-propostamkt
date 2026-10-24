/**
 * Utilitários de Segurança e Formatação Corporativa
 * Alinhados com os padrões OWASP Top 10 e práticas defensivas em PHP/MySQL
 */

import { Proposta } from '../types';

/**
 * Gera um token criptograficamente seguro (equivalente a bin2hex(random_bytes(32)) em PHP)
 */
export function gerarTokenSeguro(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Sanitização estrita contra XSS para inputs de texto
 * Escapa caracteres HTML críticos (<, >, &, ", ')
 */
export function sanitizarTexto(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validação rigorosa de arquivo de imagem (Logo/Banners)
 * Verifica MIME type, extensão e tamanho máximo (3MB)
 */
export interface ResultadoValidacaoArquivo {
  valido: boolean;
  mensagemErro?: string;
  mimeTypeDetectado?: string;
}

export function validarUploadImagem(file: File): ResultadoValidacaoArquivo {
  const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  const EXTENSOES_PERMITIDAS = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
  const TAMANHO_MAXIMO_BYTES = 3 * 1024 * 1024; // 3MB

  if (!file) {
    return { valido: false, mensagemErro: 'Nenhum arquivo enviado.' };
  }

  // Validação de Tamanho
  if (file.size > TAMANHO_MAXIMO_BYTES) {
    return {
      valido: false,
      mensagemErro: `Arquivo excede o limite máximo de 3MB (tamanho atual: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
    };
  }

  // Validação de Extensão
  const extensao = file.name.split('.').pop()?.toLowerCase() || '';
  if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
    return {
      valido: false,
      mensagemErro: `Extensão .${extensao} não permitida. Apenas JPG, PNG, WEBP e SVG são aceitos.`,
    };
  }

  // Validação de MIME Type
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return {
      valido: false,
      mensagemErro: `MIME-type '${file.type}' inválido ou suspeito.`,
      mimeTypeDetectado: file.type,
    };
  }

  return { valido: true, mimeTypeDetectado: file.type };
}

/**
 * Lógica do Backend para verificação de expiração de URL da proposta
 * Reproduz rigorosamente a regra de negócio do PropostaController.php
 */
export interface ResultadoVerificacaoUrl {
  acessoPermitido: boolean;
  motivoBloqueio?: 'NAO_ENCONTRADA' | 'INATIVA' | 'EXPIRADA' | 'RECUSADA';
  mensagem: string;
  segundosRestantes?: number;
  expirouEm?: string;
}

export function verificarStatusExpiraUrl(proposta: Proposta | null | undefined): ResultadoVerificacaoUrl {
  if (!proposta) {
    return {
      acessoPermitido: false,
      motivoBloqueio: 'NAO_ENCONTRADA',
      mensagem: 'A proposta solicitada não existe ou o token é inválido.',
    };
  }

  // 1. Verificação de status desativado manualmente pelo gestor no banco de dados
  if (proposta.status === 'inativo') {
    return {
      acessoPermitido: false,
      motivoBloqueio: 'INATIVA',
      mensagem: 'Este link de proposta comercial foi suspenso temporariamente pela agência emissora.',
    };
  }

  if (proposta.status === 'recusado') {
    return {
      acessoPermitido: false,
      motivoBloqueio: 'RECUSADA',
      mensagem: 'Esta proposta foi marcada como recusada e não está mais disponível.',
    };
  }

  // 2. Validação cronológica de data de validade (NOW() > data_validade)
  const agora = new Date().getTime();
  const validadeTimestamp = new Date(proposta.dataValidade).getTime();

  if (agora > validadeTimestamp) {
    return {
      acessoPermitido: false,
      motivoBloqueio: 'EXPIRADA',
      mensagem: 'O prazo de validade desta proposta expirou.',
      expirouEm: new Date(proposta.dataValidade).toLocaleString('pt-BR'),
      segundosRestantes: 0,
    };
  }

  const segundosRestantes = Math.max(0, Math.floor((validadeTimestamp - agora) / 1000));

  return {
    acessoPermitido: true,
    mensagem: 'Proposta comercial ativa e dentro do prazo regulamentar.',
    segundosRestantes,
  };
}

/**
 * Formata moeda BRL (R$ 1.500,00)
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata data em pt-BR (DD/MM/AAAA)
 */
export function formatarData(dataIso: string): string {
  if (!dataIso) return '-';
  const d = new Date(dataIso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata data e hora em pt-BR (DD/MM/AAAA às HH:mm)
 */
export function formatarDataHora(dataIso: string): string {
  if (!dataIso) return '-';
  const d = new Date(dataIso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Gera e realiza o download do arquivo de contato padrão vCard (.vcf)
 * compatível com iOS, Android e Outlook
 */
export function baixarVCard(u: { nome: string; whatsapp: string; email: string; cargo?: string; papel?: string }, nomeAgencia?: string): void {
  const agencia = nomeAgencia || 'Agência';
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${u.nome}`,
    `ORG:${agencia}`,
    `TITLE:${u.cargo || (u.papel === 'admin' ? 'Diretor Executivo' : 'Consultor Comercial')}`,
    `TEL;TYPE=WORK,VOICE:${u.whatsapp}`,
    `TEL;TYPE=CELL:${u.whatsapp}`,
    `EMAIL;TYPE=PREF,INTERNET:${u.email}`,
    `NOTE:Consultor Oficial ${agencia}`,
    'END:VCARD'
  ].join('\r\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${u.nome.replace(/\s+/g, '_')}_contato.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

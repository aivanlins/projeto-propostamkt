import { Proposta } from '../types';

export const PREFIXO_URL_PROPOSTA = 'proposta-';

/** Converte um texto livre em slug seguro para URL (sem acentos, minúsculo, hífens). */
export function slugify(texto: string): string {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** Gera um slug único entre as propostas existentes (ignorando a própria proposta). */
export function gerarSlugUnico(base: string, propostas: Proposta[], idAtual?: string): string {
  const raiz = slugify(base) || 'cliente';
  const usados = new Set(
    propostas.filter(p => p.id !== idAtual && p.slug).map(p => p.slug as string)
  );
  if (!usados.has(raiz)) return raiz;
  let i = 2;
  while (usados.has(`${raiz}-${i}`)) i++;
  return `${raiz}-${i}`;
}

/** URL base da aplicação (domínio + subpasta, se houver), sem barra final. */
export function getBaseUrlApp(): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  return `${window.location.origin}${base}`;
}

/** URL pública e amigável da proposta. Propostas antigas sem slug usam o link por token. */
export function getUrlProposta(proposta: Proposta): string {
  const base = getBaseUrlApp();
  if (proposta.slug) return `${base}/${PREFIXO_URL_PROPOSTA}${proposta.slug}`;
  return `${base}/?token=${encodeURIComponent(proposta.token)}`;
}

export type RotaPublica = { tipo: 'slug' | 'token'; valor: string } | null;

/** Detecta se a URL atual é um link público de proposta (/proposta-slug ou ?token=). */
export function detectarRotaPublica(): RotaPublica {
  const match = window.location.pathname.match(/\/proposta-([a-z0-9-]+)\/?$/i);
  if (match) return { tipo: 'slug', valor: match[1].toLowerCase() };
  const token = new URLSearchParams(window.location.search).get('token');
  if (token) return { tipo: 'token', valor: token };
  return null;
}

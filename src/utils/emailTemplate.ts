import { Proposta, ConfiguracaoFixa } from '../types';
import { formatarData } from './security';

const esc = (s: string | undefined | null) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const corValida = (c: string | undefined, padrao: string) =>
  c && /^#[0-9a-f]{3,8}$/i.test(c.trim()) ? c.trim() : padrao;

export function gerarAssuntoEmail(proposta: Proposta, config: ConfiguracaoFixa): string {
  return `${config?.nomeAgencia || 'Proposta Comercial'} • Proposta para ${proposta.clienteEmpresa || proposta.clienteNome}`;
}

/** Versão em texto puro (usada no mailto: e no WhatsApp). */
export function gerarEmailTexto(proposta: Proposta, config: ConfiguracaoFixa, url: string): string {
  const linhas = [
    `Olá, ${proposta.clienteNome || 'tudo bem'}!`,
    '',
    `É um prazer apresentar a proposta comercial "${proposta.titulo}", desenvolvida exclusivamente para ${proposta.clienteEmpresa || 'você'}.`,
    '',
    'Acesse a proposta completa pelo link abaixo:',
    url,
    '',
    proposta.dataValidade ? `Esta proposta é válida até ${formatarData(proposta.dataValidade)}.` : '',
    '',
    'Ficamos à disposição para qualquer dúvida.',
    '',
    'Atenciosamente,',
    config?.nomeAgencia || '',
    config?.emailContato ? `E-mail: ${config.emailContato}` : '',
    config?.telefoneWhatsapp ? `WhatsApp: ${config.telefoneWhatsapp}` : '',
    config?.endereco ? `Endereço: ${config.endereco}` : '',
  ];
  return linhas.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n').trim();
}

/** Layout HTML padrão do e-mail, com identidade da agência (Identidade & Dados da Agência). */
export function gerarEmailHtml(proposta: Proposta, config: ConfiguracaoFixa, url: string): string {
  const primaria = corValida(config?.corPrimaria, '#6d28d9');
  const secundaria = corValida(config?.corSecundaria, '#18181b');
  const nome = esc(config?.nomeAgencia || 'Nossa Agência');
  const logo = config?.logoUrl
    ? `<img src="${esc(config.logoUrl)}" alt="${nome}" style="max-height:56px;max-width:200px;display:block;margin:0 auto 8px;" />`
    : '';
  const whatsDigits = (config?.telefoneWhatsapp || '').replace(/\D/g, '');
  const validade = proposta.dataValidade ? formatarData(proposta.dataValidade) : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${esc(gerarAssuntoEmail(proposta, config))}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#27272a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="background:${secundaria};padding:28px 24px;text-align:center;">
          ${logo}
          <div style="color:#ffffff;font-size:20px;font-weight:bold;">${nome}</div>
          ${config?.slogan ? `<div style="color:#d4d4d8;font-size:12px;margin-top:4px;">${esc(config.slogan)}</div>` : ''}
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <p style="font-size:16px;margin:0 0 16px;">Olá, <strong>${esc(proposta.clienteNome || 'tudo bem')}</strong>!</p>
          <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">É um prazer apresentar a proposta comercial <strong>"${esc(proposta.titulo)}"</strong>, desenvolvida exclusivamente para <strong>${esc(proposta.clienteEmpresa || '')}</strong>.</p>
          <p style="font-size:14px;line-height:1.6;margin:0 0 24px;">Nela você encontra o planejamento completo, as entregas e as condições comerciais.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 24px;">
            <tr><td style="background:${primaria};border-radius:999px;">
              <a href="${esc(url)}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Ver Proposta Completa</a>
            </td></tr>
          </table>
          ${validade ? `<p style="font-size:13px;color:#71717a;text-align:center;margin:0 0 8px;">Proposta válida até <strong>${esc(validade)}</strong>.</p>` : ''}
          <p style="font-size:12px;color:#a1a1aa;text-align:center;margin:0;word-break:break-all;">Se o botão não funcionar, copie e cole: <a href="${esc(url)}" style="color:${primaria};">${esc(url)}</a></p>
        </td></tr>
        <tr><td style="background:#fafafa;border-top:1px solid #e4e4e7;padding:20px 28px;font-size:12px;color:#52525b;line-height:1.7;text-align:center;">
          <strong>${nome}</strong><br />
          ${config?.emailContato ? `E-mail: <a href="mailto:${esc(config.emailContato)}" style="color:${primaria};">${esc(config.emailContato)}</a><br />` : ''}
          ${config?.telefoneWhatsapp ? `WhatsApp: ${whatsDigits ? `<a href="https://wa.me/${whatsDigits}" style="color:${primaria};">${esc(config.telefoneWhatsapp)}</a>` : esc(config.telefoneWhatsapp)}<br />` : ''}
          ${config?.endereco ? `${esc(config.endereco)}<br />` : ''}
          ${config?.cnpj ? `CNPJ: ${esc(config.cnpj)}` : ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

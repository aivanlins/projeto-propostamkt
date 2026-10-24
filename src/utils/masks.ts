/** Formata telefone no padrão +55 XX XXXXX-XXXX (somente dígitos, máx. 13). */
export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 13);
  if (!d) return '';
  if (d.length <= 2) return '+' + d;
  if (d.length <= 4) return '+' + d.slice(0, 2) + ' ' + d.slice(2);
  if (d.length <= 9) return '+' + d.slice(0, 2) + ' ' + d.slice(2, 4) + ' ' + d.slice(4);
  return '+' + d.slice(0, 2) + ' ' + d.slice(2, 4) + ' ' + d.slice(4, 9) + '-' + d.slice(9);
}

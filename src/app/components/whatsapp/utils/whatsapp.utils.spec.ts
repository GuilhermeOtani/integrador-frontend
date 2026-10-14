import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { associarErrosWhatsapp, baixarPdfWhatsapp, diaWhatsapp, erroWhatsapp, ESTADOS_ENTREGA, impedimentoWhatsapp, instanteWhatsapp, linkAtivacaoSeguro, normalizarNumero, rotuloEntrega, severidadeEntrega, textoObrigatorio, validarNumero } from './whatsapp.utils';

describe('WhatsApp utils', () => {
  it('normaliza somente formatação e valida número internacional', () => {
    expect(normalizarNumero('+55 (11) 99999-9999')).toBe('+5511999999999');
    for (const numero of ['+5511999999999', '+55 (11) 99999-9999']) expect(validarNumero(new FormControl(numero))).toBeNull();
    for (const numero of ['', '11999999999', '+012345678', '+123', '+1234567890123456', '+55abc']) expect(validarNumero(new FormControl(numero))).not.toBeNull();
  });
  it('400 associa erros aos controles conhecidos e permite correção', () => {
    const form = new FormGroup({ numero: new FormControl('inválido') });
    associarErrosWhatsapp(form, new HttpErrorResponse({ status: 400, error: { errors: { numero: 'Formato inválido', pessoaId: 'Não permitido' } } }));
    expect(form.controls.numero.errors?.['api']).toBe('Formato inválido'); expect(form.controls.numero.touched).toBeTrue();
    form.controls.numero.setValue('+5511999999999'); expect(form.valid).toBeTrue();
  });
  it('motivo rejeita espaços e os dez estados são distintos', () => {
    expect(textoObrigatorio(new FormControl('  '))).not.toBeNull(); expect(textoObrigatorio(new FormControl(' Correção '))).toBeNull();
    expect(new Set(ESTADOS_ENTREGA.map(rotuloEntrega)).size).toBe(10);
    expect(rotuloEntrega('ACEITA')).not.toBe('Entregue'); expect(severidadeEntrega('INCERTA')).toBe('warn');
    expect(impedimentoWhatsapp('SEM_PROGRAMACAO')).toContain('Sem programação'); expect(impedimentoWhatsapp('META_HTTP_429')).toBe('META_HTTP_429');
  });
  it('formata timestamp em São Paulo e preserva ausências', () => { expect(instanteWhatsapp('2026-10-14T18:00:00Z')).toContain('15:00'); expect(instanteWhatsapp(null)).toBe('Não informado'); expect(diaWhatsapp('TERCA')).toBe('Terça-feira'); });
  it('mantém o link de ativação restrito ao WhatsApp HTTPS', () => { expect(linkAtivacaoSeguro('https://wa.me/5511999999999?text=ATIVAR%20teste')).toBeTrue(); for (const link of ['javascript:alert(1)', 'https://malicioso.test', 'http://wa.me/1', 'https://wa.me@malicioso.test/1']) expect(linkAtivacaoSeguro(link)).toBeFalse(); });
  it('interpreta ProblemDetail em Blob e mantém fallback em erro inválido', async () => {
    expect(await erroWhatsapp(new HttpErrorResponse({ status: 404, error: new Blob([JSON.stringify({ detail: 'Sem programação hoje' })]) }))).toBe('Sem programação hoje');
    expect(await erroWhatsapp(new HttpErrorResponse({ status: 404, error: new Blob(['inválido']) }))).toContain('não foi encontrado');
    expect(await erroWhatsapp(new HttpErrorResponse({ status: 503, error: {} }))).toContain('Integração indisponível');
  });
  it('download usa URL temporária sem token e a revoga', async () => {
    const criar = spyOn(URL, 'createObjectURL').and.returnValue('blob:pdf'); const revogar = spyOn(URL, 'revokeObjectURL');
    const clicar = spyOn(HTMLAnchorElement.prototype, 'click'); const temporizador = spyOn(window, 'setTimeout').and.callFake(((callback: () => void) => { callback(); return 1; }) as typeof window.setTimeout);
    const blob = new Blob(['PDF']); baixarPdfWhatsapp(blob);
    expect(criar).toHaveBeenCalledWith(blob); expect(clicar).toHaveBeenCalled(); expect(revogar).toHaveBeenCalledWith('blob:pdf'); expect(temporizador).toHaveBeenCalled();
  });
});

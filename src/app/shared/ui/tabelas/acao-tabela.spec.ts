import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AcaoTabela } from './acao-tabela';

describe('Ação compartilhada das tabelas', () => {
  let fixture: ComponentFixture<AcaoTabela>;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AcaoTabela], providers: [provideNoopAnimations()] });
    fixture = TestBed.createComponent(AcaoTabela);
    fixture.componentRef.setInput('icon', 'pi pi-pencil');
    fixture.componentRef.setInput('ariaLabel', 'Editar aluno Ana'); fixture.detectChanges();
  });
  it('exibe somente ícone, com nome acessível e formato circular contornado', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Editar aluno Ana');
    expect(button.textContent?.trim()).toBe(''); expect(button.classList).toContain('p-button-rounded');
    expect(button.classList).toContain('p-button-outlined'); expect(button.type).toBe('button');
    expect(button.querySelector('.pi-pencil')).not.toBeNull();
  });
  it('um clique emite exatamente uma ação e preserva o evento usado para ancorar menus', () => {
    const acionado = jasmine.createSpy(); fixture.componentInstance.onAction.subscribe(acionado);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement; button.click();
    expect(acionado).toHaveBeenCalledTimes(1); expect(acionado.calls.mostRecent().args[0] instanceof MouseEvent).toBeTrue();
    expect(acionado.calls.mostRecent().args[0].target).toBe(button);
  });
  for (const estado of ['disabled', 'loading']) {
    it(`${estado} impede a ação e mantém o nome acessível`, () => {
      fixture.componentRef.setInput(estado, true); fixture.detectChanges();
      const acionado = jasmine.createSpy(); fixture.componentInstance.onAction.subscribe(acionado);
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement; button.click();
      fixture.componentInstance.acionar(new MouseEvent('click'));
      expect(button.disabled).toBeTrue(); expect(acionado).not.toHaveBeenCalled();
      expect(button.getAttribute('aria-label')).toBe('Editar aluno Ana');
    });
  }
  it('aceita tooltip de impedimento sem mostrar texto no botão', () => {
    fixture.componentRef.setInput('tooltip', 'Exclusão bloqueada por recebimentos'); fixture.componentRef.setInput('severity', 'danger'); fixture.detectChanges();
    expect(fixture.componentInstance.tooltip()).toBe('Exclusão bloqueada por recebimentos');
    expect(fixture.nativeElement.querySelector('button').classList).toContain('p-button-danger');
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
  it('pode ser reabilitado sem criar outro handler', () => {
    const acionado = jasmine.createSpy(); fixture.componentInstance.onAction.subscribe(acionado);
    fixture.componentRef.setInput('loading', true); fixture.detectChanges();
    fixture.componentRef.setInput('loading', false); fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click(); expect(acionado).toHaveBeenCalledTimes(1);
  });
});

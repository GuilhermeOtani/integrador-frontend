import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { mensagemApi, problemaApi } from '../../core/auth/api-error';
import { Papel, PessoaDisponivelResponse, UsuarioResumo } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { UsuarioService } from '../../core/auth/usuario.service';

const senhasIguais: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const senha = control.get('senha')?.value;
  const confirmacao = control.get('confirmacao')?.value;
  return senha && confirmacao && senha !== confirmacao ? { senhasDiferentes: true } : null;
};

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    MenuModule,
    MessageModule,
    PasswordModule,
    ProgressSpinnerModule,
    TableModule,
    TagModule,
    ToolbarModule,
    TooltipModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly usuarios = signal<UsuarioResumo[]>([]);
  readonly pessoasDisponiveis = signal<PessoaDisponivelResponse[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly processandoId = signal<number | null>(null);
  readonly erroLista = signal<string | null>(null);
  readonly erroConta = signal<string | null>(null);
  readonly erroAdmin = signal<string | null>(null);
  readonly erroEmail = signal<string | null>(null);
  readonly erroSenha = signal<string | null>(null);
  readonly usuarioSelecionado = signal<UsuarioResumo | null>(null);
  readonly itensAcoes = signal<MenuItem[]>([]);

  dialogConta = false;
  dialogAdmin = false;
  dialogEmail = false;
  dialogSenha = false;
  pessoaSelecionada: PessoaDisponivelResponse | null = null;
  private emailOriginal = '';

  readonly formConta = this.fb.nonNullable.group(
    {
      pessoaId: [0, [Validators.required, Validators.min(1)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmacao: ['', Validators.required],
    },
    { validators: senhasIguais },
  );

  readonly formAdmin = this.fb.nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmacao: ['', Validators.required],
    },
    { validators: senhasIguais },
  );

  readonly formEmail = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly formSenha = this.fb.nonNullable.group(
    {
      senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmacao: ['', Validators.required],
    },
    { validators: senhasIguais },
  );

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando.set(true);
    this.erroLista.set(null);
    forkJoin({
      usuarios: this.usuarioService.listar(),
      pessoas: this.usuarioService.listarPessoasSemUsuario(),
    })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: ({ usuarios, pessoas }) => {
          this.usuarios.set(usuarios);
          this.pessoasDisponiveis.set(pessoas);
        },
        error: (error: HttpErrorResponse) => this.erroLista.set(mensagemApi(error)),
      });
  }

  carregarUsuarios(): void {
    this.erroLista.set(null);
    this.usuarioService.listar().subscribe({
      next: (usuarios) => this.usuarios.set(usuarios),
      error: (error: HttpErrorResponse) => this.erroLista.set(mensagemApi(error)),
    });
  }

  abrirConta(pessoa: PessoaDisponivelResponse): void {
    this.pessoaSelecionada = pessoa;
    this.erroConta.set(null);
    this.formConta.reset({ pessoaId: pessoa.id, email: '', senha: '', confirmacao: '' });
    this.dialogConta = true;
  }

  abrirAdmin(): void {
    this.erroAdmin.set(null);
    this.formAdmin.reset({ nome: '', email: '', senha: '', confirmacao: '' });
    this.dialogAdmin = true;
  }

  abrirMenu(event: Event, usuario: UsuarioResumo, menu: Menu): void {
    this.usuarioSelecionado.set(usuario);
    const propriaConta = this.ehPropriaConta(usuario);
    const bloqueado = this.processandoId() !== null;
    this.itensAcoes.set([
      {
        label: 'Editar e-mail',
        icon: 'pi pi-envelope',
        disabled: bloqueado,
        command: () => this.abrirEdicaoEmail(usuario),
      },
      {
        label: 'Redefinir senha',
        icon: 'pi pi-key',
        disabled: bloqueado,
        command: () => this.abrirRedefinicaoSenha(usuario),
      },
      {
        label: usuario.ativo ? 'Desativar acesso' : 'Reativar acesso',
        icon: usuario.ativo ? 'pi pi-ban' : 'pi pi-check-circle',
        disabled: bloqueado || propriaConta,
        command: () =>
          usuario.ativo ? this.confirmarDesativacao(usuario) : this.atualizarStatus(usuario, true),
      },
      { separator: true },
      {
        label: propriaConta ? 'Excluir acesso (indisponível)' : 'Excluir acesso',
        icon: 'pi pi-trash',
        disabled: bloqueado || propriaConta,
        styleClass: 'usuario-danger-item',
        command: () => this.confirmarExclusao(usuario),
      },
    ]);
    menu.toggle(event);
  }

  abrirEdicaoEmail(usuario: UsuarioResumo): void {
    this.usuarioSelecionado.set(usuario);
    this.erroEmail.set(null);
    this.emailOriginal = this.normalizarEmail(usuario.email);
    this.formEmail.reset({ email: usuario.email });
    this.dialogEmail = true;
  }

  abrirRedefinicaoSenha(usuario: UsuarioResumo): void {
    this.usuarioSelecionado.set(usuario);
    this.erroSenha.set(null);
    this.formSenha.reset({ senha: '', confirmacao: '' });
    this.dialogSenha = true;
  }

  emailSemAlteracao(): boolean {
    return this.normalizarEmail(this.formEmail.controls.email.value) === this.emailOriginal;
  }

  criarConta(): void {
    if (this.formConta.invalid || this.salvando()) {
      this.formConta.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erroConta.set(null);
    const { pessoaId, email, senha } = this.formConta.getRawValue();
    this.usuarioService
      .criar({ pessoaId, email, senha })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.dialogConta = false;
          this.messages.add({
            severity: 'success',
            summary: 'Conta criada',
            detail: 'O usuário já pode entrar no sistema.',
          });
          this.carregarDados();
        },
        error: (error: HttpErrorResponse) =>
          this.tratarErroFormulario(error, this.formConta, this.erroConta),
      });
  }

  criarAdmin(): void {
    if (this.formAdmin.invalid || this.salvando()) {
      this.formAdmin.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erroAdmin.set(null);
    const { nome, email, senha } = this.formAdmin.getRawValue();
    this.usuarioService
      .criarAdmin({ nome, email, senha })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.dialogAdmin = false;
          this.messages.add({
            severity: 'success',
            summary: 'Administrador criado',
            detail: 'A nova conta administrativa está disponível.',
          });
          this.carregarDados();
        },
        error: (error: HttpErrorResponse) =>
          this.tratarErroFormulario(error, this.formAdmin, this.erroAdmin),
      });
  }

  salvarEmail(): void {
    const usuario = this.usuarioSelecionado();
    const email = this.formEmail.controls.email.value.trim();
    if (email !== this.formEmail.controls.email.value) {
      this.formEmail.controls.email.setValue(email);
    }
    if (!usuario || this.formEmail.invalid || this.emailSemAlteracao() || this.salvando()) {
      this.formEmail.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erroEmail.set(null);
    this.usuarioService
      .atualizarEmail(usuario.id, email)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.dialogEmail = false;
          this.messages.add({
            severity: 'success',
            summary: 'E-mail atualizado',
            detail: this.ehPropriaConta(usuario)
              ? 'Entre novamente com o novo e-mail.'
              : 'O novo e-mail já está disponível.',
          });
          if (this.ehPropriaConta(usuario)) {
            this.auth.logout();
          } else {
            this.carregarUsuarios();
          }
        },
        error: (error: HttpErrorResponse) =>
          this.tratarErroEdicao(error, this.formEmail, this.erroEmail, () => {
            this.dialogEmail = false;
          }),
      });
  }

  salvarSenha(): void {
    const usuario = this.usuarioSelecionado();
    if (!usuario || this.formSenha.invalid || this.salvando()) {
      this.formSenha.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erroSenha.set(null);
    const senha = this.formSenha.controls.senha.value;
    this.usuarioService
      .redefinirSenha(usuario.id, senha)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.dialogSenha = false;
          this.formSenha.reset({ senha: '', confirmacao: '' });
          this.messages.add({
            severity: 'success',
            summary: 'Senha redefinida',
            detail: this.ehPropriaConta(usuario)
              ? 'Entre novamente com a nova senha.'
              : 'A senha da conta foi atualizada.',
          });
          if (this.ehPropriaConta(usuario)) {
            this.auth.logout();
          } else {
            this.carregarUsuarios();
          }
        },
        error: (error: HttpErrorResponse) =>
          this.tratarErroEdicao(error, this.formSenha, this.erroSenha, () => {
            this.dialogSenha = false;
            this.formSenha.reset({ senha: '', confirmacao: '' });
          }),
      });
  }

  confirmarDesativacao(usuario: UsuarioResumo): void {
    if (this.ehPropriaConta(usuario)) return;
    this.confirmationService.confirm({
      header: 'Desativar acesso?',
      message: `A conta ${usuario.email} não poderá entrar até ser reativada.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-warning',
      acceptLabel: 'Desativar',
      rejectLabel: 'Cancelar',
      accept: () => this.atualizarStatus(usuario, false),
    });
  }

  atualizarStatus(usuario: UsuarioResumo, ativo: boolean): void {
    if (this.ehPropriaConta(usuario) || this.processandoId() !== null) return;
    this.processandoId.set(usuario.id);
    this.usuarioService
      .atualizarStatus(usuario.id, ativo)
      .pipe(finalize(() => this.processandoId.set(null)))
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: ativo ? 'Acesso reativado' : 'Acesso desativado',
            detail: ativo
              ? 'A conta pode realizar um novo login.'
              : 'Os tokens anteriores da conta foram revogados.',
          });
          this.carregarUsuarios();
        },
        error: (error: HttpErrorResponse) => this.tratarErroAcao(error),
      });
  }

  confirmarExclusao(usuario: UsuarioResumo): void {
    if (this.ehPropriaConta(usuario)) return;
    this.confirmationService.confirm({
      header: 'Excluir acesso?',
      message: `A conta ${usuario.email} perderá o acesso. A pessoa cadastrada será preservada.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Excluir acesso',
      rejectLabel: 'Cancelar',
      accept: () => this.excluirAcesso(usuario),
    });
  }

  excluirAcesso(usuario: UsuarioResumo): void {
    if (this.ehPropriaConta(usuario) || this.processandoId() !== null) return;
    this.processandoId.set(usuario.id);
    this.usuarioService
      .excluirAcesso(usuario.id)
      .pipe(finalize(() => this.processandoId.set(null)))
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Acesso excluído',
            detail: 'As credenciais foram removidas e a pessoa foi preservada.',
          });
          this.carregarDados();
        },
        error: (error: HttpErrorResponse) => this.tratarErroAcao(error),
      });
  }

  ehPropriaConta(usuario: UsuarioResumo): boolean {
    return usuario.id === this.auth.usuario()?.id;
  }

  rotuloPapel(papel: Papel): string {
    return papel === 'ADMIN' ? 'Administrador' : papel === 'ALUNO' ? 'Aluno' : 'Motorista';
  }

  severidadePapel(papel: Papel): 'danger' | 'info' | 'success' {
    return papel === 'ADMIN' ? 'danger' : papel === 'ALUNO' ? 'info' : 'success';
  }

  private normalizarEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private tratarErroFormulario(
    error: HttpErrorResponse,
    form: FormGroup,
    destino: { set(value: string | null): void },
  ): void {
    this.aplicarErrosServidor(error, form);
    destino.set(mensagemApi(error));
  }

  private tratarErroEdicao(
    error: HttpErrorResponse,
    form: FormGroup,
    destino: { set(value: string | null): void },
    fechar: () => void,
  ): void {
    if (error.status === 404) {
      fechar();
      this.messages.add({
        severity: 'error',
        summary: 'Conta não encontrada',
        detail: mensagemApi(error),
      });
      this.carregarDados();
      return;
    }
    this.aplicarErrosServidor(error, form);
    destino.set(mensagemApi(error));
  }

  private tratarErroAcao(error: HttpErrorResponse): void {
    this.messages.add({
      severity: 'error',
      summary: error.status === 404 ? 'Conta não encontrada' : 'Operação não realizada',
      detail: mensagemApi(error),
    });
    if (error.status === 404) this.carregarDados();
  }

  private aplicarErrosServidor(error: HttpErrorResponse, form: FormGroup): void {
    const errors = problemaApi(error)?.errors;
    if (!errors) return;
    Object.entries(errors).forEach(([campo, mensagem]) => {
      const control = form.get(campo);
      control?.setErrors({ ...(control.errors ?? {}), servidor: mensagem });
      control?.markAsTouched();
    });
  }
}

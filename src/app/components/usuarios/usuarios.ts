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
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { mensagemApi, problemaApi } from '../../core/auth/api-error';
import { Papel, PessoaDisponivelResponse, UsuarioResumo } from '../../core/auth/auth.models';
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
    DialogModule,
    InputTextModule,
    MessageModule,
    PasswordModule,
    ProgressSpinnerModule,
    TableModule,
    TagModule,
    ToolbarModule,
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly messages = inject(MessageService);

  readonly usuarios = signal<UsuarioResumo[]>([]);
  readonly pessoasDisponiveis = signal<PessoaDisponivelResponse[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly erroLista = signal<string | null>(null);
  readonly erroConta = signal<string | null>(null);
  readonly erroAdmin = signal<string | null>(null);

  dialogConta = false;
  dialogAdmin = false;
  pessoaSelecionada: PessoaDisponivelResponse | null = null;

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
          this.messages.add({ severity: 'success', summary: 'Conta criada', detail: 'O usuário já pode entrar no sistema.' });
          this.carregarDados();
        },
        error: (error: HttpErrorResponse) => this.tratarErroFormulario(error, this.formConta, this.erroConta),
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
          this.messages.add({ severity: 'success', summary: 'Administrador criado', detail: 'A nova conta administrativa está disponível.' });
          this.carregarDados();
        },
        error: (error: HttpErrorResponse) => this.tratarErroFormulario(error, this.formAdmin, this.erroAdmin),
      });
  }

  rotuloPapel(papel: Papel): string {
    return papel === 'ADMIN' ? 'Administrador' : papel === 'ALUNO' ? 'Aluno' : 'Motorista';
  }

  severidadePapel(papel: Papel): 'danger' | 'info' | 'success' {
    return papel === 'ADMIN' ? 'danger' : papel === 'ALUNO' ? 'info' : 'success';
  }

  private tratarErroFormulario(
    error: HttpErrorResponse,
    form: FormGroup,
    destino: { set(value: string | null): void },
  ): void {
    const errors = problemaApi(error)?.errors;
    if (errors) {
      Object.entries(errors).forEach(([campo, mensagem]) => {
        const control = form.get(campo);
        control?.setErrors({ ...(control.errors ?? {}), servidor: mensagem });
        control?.markAsTouched();
      });
    }
    destino.set(mensagemApi(error));
  }
}

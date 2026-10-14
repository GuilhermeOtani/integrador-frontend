import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, concatMap, defer, finalize, from, map, of, Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { mensagemApi } from '../../../../core/auth/utils/api-error';
import { FaculdadeService } from '../../../faculdade/service/faculdade-service';
import Aluno, { SituacaoExclusaoAluno, SituacaoListaAluno, VinculosAluno } from '../../models/aluno';
import { AlunoService } from '../../service/aluno-service';
import { mensagemArquivamentoAluno, requerRevisaoAluno, situacaoExclusaoValida,
  TIPOS_VINCULOS_ALUNO, vinculosValidos } from '../../utils/arquivamento-aluno';
import { AlunoCadastro } from '../aluno-cadastro/aluno-cadastro';

interface ResultadoArquivamento {
  id: number;
  nome: string;
  estado: 'SUCESSO' | 'FALHA' | 'NAO_TENTADO';
  mensagem: string;
}

@Component({
  standalone: true,
  selector: 'app-aluno-listar',
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, IconFieldModule,
    InputIconModule, InputTextModule, MessageModule, SelectModule, TableModule,
    TagModule, ToastModule, ToolbarModule, AlunoCadastro],
  providers: [AlunoService, MessageService],
  templateUrl: './aluno-listar.html',
  styleUrl: './aluno-listar.css',
})
export class AlunoListar {
  private readonly alunoService = inject(AlunoService);
  private readonly faculdadeService = inject(FaculdadeService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private consultaLista?: Subscription;
  private consultaExclusao?: Subscription;

  @ViewChild('dt') dt!: Table;
  alunos: Aluno[] = [];
  aluno: Aluno = {} as Aluno;
  faculdades: any[] = [];
  selectedAlunos: Aluno[] = [];
  alunoDialog = false;
  dialogAcao = false;
  dialogExclusao = false;
  situacao: SituacaoListaAluno = 'NAO_ARQUIVADOS';
  readonly opcoesSituacao = [
    { label: 'Não arquivados', value: 'NAO_ARQUIVADOS' },
    { label: 'Arquivados', value: 'ARQUIVADOS' },
    { label: 'Todos', value: 'TODOS' },
  ];
  readonly cols = [
    { field: 'id', header: 'ID' }, { field: 'nome', header: 'Nome' },
    { field: 'cpfCnpj', header: 'CPF/CNPJ' }, { field: 'telefone', header: 'Telefone' },
    { field: 'matricula', header: 'Matrícula' }, { field: 'mensalidade', header: 'Mensalidade' },
    { field: 'arquivado', header: 'Arquivado' },
  ];
  readonly carregando = signal(false);
  readonly processando = signal(false);
  readonly consultandoExclusao = signal(false);
  readonly erroLista = signal<string | null>(null);
  readonly erroAcao = signal<string | null>(null);
  readonly erroExclusao = signal<string | null>(null);
  readonly revisaoNecessaria = signal(false);
  readonly contratoDisponivel = signal(false);
  readonly acao = signal<'ARQUIVAR' | 'RESTAURAR'>('ARQUIVAR');
  readonly alvosAcao = signal<Aluno[]>([]);
  readonly resultados = signal<ResultadoArquivamento[]>([]);
  readonly alunoExclusao = signal<Aluno | null>(null);
  readonly situacaoExclusao = signal<SituacaoExclusaoAluno | null>(null);
  readonly conflitoVinculos = signal<VinculosAluno | null>(null);
  readonly tiposVinculos = TIPOS_VINCULOS_ALUNO;
  readonly bloqueado = computed(() => this.carregando() || this.processando() || this.consultandoExclusao());
  readonly podeExcluir = computed(() => {
    const dados = this.situacaoExclusao();
    const alvo = this.alunoExclusao();
    return !!alvo && !!dados && situacaoExclusaoValida(dados, alvo.id) && dados.podeExcluir
      && !this.bloqueado() && !this.erroExclusao() && !this.revisaoNecessaria()
      && this.contratoDisponivel() && !this.erroLista();
  });

  ngOnInit(): void {
    this.carregarAlunos();
    this.faculdadeService.listarFaculdades().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => this.faculdades = data,
      error: (error: HttpErrorResponse) => this.mostrarErro(error, 'Não foi possível consultar as faculdades'),
    });
  }

  exportCSV(): void { this.dt.exportCSV(); }

  carregarAlunos(): void {
    if (this.processando()) return;
    this.consultaLista?.unsubscribe();
    this.carregando.set(true);
    this.erroLista.set(null);
    this.contratoDisponivel.set(false);
    const filtro = this.situacao;
    this.consultaLista = this.alunoService.listarAlunos(filtro).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.carregando.set(false)),
    ).subscribe({
      next: data => {
        const contrato = Array.isArray(data) && data.every(item => item && Number.isSafeInteger(item.id)
          && item.id > 0 && typeof item.arquivado === 'boolean');
        if (!contrato) {
          // Permite ler cadastros antigos, mas não inventa seu estado de arquivamento.
          this.alunos = filtro === 'NAO_ARQUIVADOS' && Array.isArray(data)
            ? data.filter(item => item && typeof item === 'object') : [];
          this.selectedAlunos = [];
          this.erroLista.set('O backend ainda não informa o arquivamento dos alunos. Implemente o GUIA_ARQUIVAMENTO_ALUNOS_BACKEND.md para habilitar os filtros e ações.');
          return;
        }
        if (data.some(item => !this.correspondeFiltro(item, filtro))) {
          this.alunos = [];
          this.selectedAlunos = [];
          this.erroLista.set('O backend retornou alunos fora do filtro solicitado. Atualize a API antes de utilizar o arquivamento.');
          return;
        }
        const selecionados = new Set(this.selectedAlunos.map(item => item.id));
        this.alunos = data;
        this.selectedAlunos = data.filter(item => selecionados.has(item.id));
        this.contratoDisponivel.set(true);
        this.revisaoNecessaria.set(false);
      },
      error: (error: HttpErrorResponse) => this.erroLista.set(mensagemApi(error)),
    });
  }

  mudarSituacao(situacao: SituacaoListaAluno): void {
    if (this.processando() || this.dialogAcao || this.dialogExclusao || this.alunoDialog) return;
    this.situacao = situacao;
    this.selectedAlunos = [];
    this.alunos = [];
    this.dt?.reset();
    this.carregarAlunos();
  }

  openNew(): void {
    if (this.bloqueado() || this.alunoDialog || this.dialogAcao || this.dialogExclusao) return;
    this.aluno = {} as Aluno;
    this.alunoDialog = true;
  }

  editAluno(aluno: Aluno): void {
    if (this.bloqueado() || this.alunoDialog || this.dialogAcao || this.dialogExclusao) return;
    this.aluno = { ...aluno, faculdadeId: aluno.faculdade?.id ?? aluno.faculdadeId };
    this.alunoDialog = true;
  }

  hideDialog(): void { this.alunoDialog = false; }

  aoSalvarAluno(): void {
    this.alunoDialog = false;
    this.aluno = {} as Aluno;
    this.carregarAlunos();
  }

  get selecionadosArquivaveis(): Aluno[] {
    return this.selectedAlunos.filter(item => item.arquivado === false);
  }

  arquivarSelecionados(): void { this.abrirAcao(this.selecionadosArquivaveis, 'ARQUIVAR'); }
  arquivarAluno(aluno: Aluno): void { this.abrirAcao([aluno], 'ARQUIVAR'); }
  restaurarAluno(aluno: Aluno): void { this.abrirAcao([aluno], 'RESTAURAR'); }

  private abrirAcao(alunos: Aluno[], acao: 'ARQUIVAR' | 'RESTAURAR'): void {
    if (!this.podeAbrirOperacao() || !alunos.length
        || alunos.some(item => item.arquivado !== (acao === 'RESTAURAR'))) return;
    this.acao.set(acao);
    this.alvosAcao.set([...new Map(alunos.map(item => [item.id, { ...item }])).values()]);
    this.erroAcao.set(null);
    this.resultados.set([]);
    this.dialogAcao = true;
  }

  confirmarAcao(): void {
    if (!this.dialogAcao || this.bloqueado() || this.revisaoNecessaria() || !this.contratoDisponivel()
        || this.resultados().length) return;
    const alvos = this.alvosAcao();
    if (!alvos.length) return;
    const arquivar = this.acao() === 'ARQUIVAR';
    this.processando.set(true);
    this.erroAcao.set(null);
    this.resultados.set([]);
    let interrompido = false;
    from(alvos).pipe(
      concatMap(alvo => defer(() => {
        if (interrompido) return of<ResultadoArquivamento>({ id: alvo.id, nome: alvo.nome,
          estado: 'NAO_TENTADO', mensagem: 'Não solicitado após interrupção. Atualize a lista antes de continuar.' });
        return this.alunoService.atualizarArquivamento(alvo.id, arquivar).pipe(
          map(atualizado => {
            if (!atualizado || atualizado.id !== alvo.id || atualizado.arquivado !== arquivar) {
              interrompido = true;
              this.revisaoNecessaria.set(true);
              return { id: alvo.id, nome: alvo.nome, estado: 'FALHA' as const,
                mensagem: 'Resposta incompatível. A operação pode ter sido aplicada; atualize a lista antes de continuar.' };
            }
            this.aplicarAtualizacao(atualizado);
            return { id: alvo.id, nome: alvo.nome, estado: 'SUCESSO' as const,
              mensagem: arquivar ? 'Arquivado; histórico preservado.' : 'Restaurado; reative o acesso separadamente em Usuários.' };
          }),
          catchError((error: HttpErrorResponse) => {
            const incerto = requerRevisaoAluno(error);
            interrompido = incerto || [401, 403].includes(error.status);
            if (interrompido) this.revisaoNecessaria.set(true);
            return of<ResultadoArquivamento>({ id: alvo.id, nome: alvo.nome, estado: 'FALHA',
              mensagem: incerto
                ? 'Resultado não confirmado. Atualize a lista antes de tentar novamente. ' + mensagemArquivamentoAluno(error)
                : mensagemArquivamentoAluno(error) });
          }),
        );
      })),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.processando.set(false)),
    ).subscribe({
      next: resultado => this.resultados.update(itens => [...itens, resultado]),
      complete: () => {
        if (this.destroyRef.destroyed) return;
        const sucessos = this.resultados().filter(item => item.estado === 'SUCESSO').length;
        const falhas = this.resultados().filter(item => item.estado !== 'SUCESSO').length;
        if (!falhas) {
          this.dialogAcao = false;
          this.messages.add({ severity: 'success', summary: arquivar ? 'Arquivamento concluído' : 'Cadastro restaurado',
            detail: arquivar ? `${sucessos} cadastro(s) arquivado(s). Histórico preservado.`
              : 'O cadastro foi restaurado. Reative o acesso separadamente em Usuários.', life: 5000 });
        } else {
          this.erroAcao.set(`${sucessos} concluído(s); ${falhas} não concluído(s). Consulte o resultado de cada aluno abaixo.`);
        }
      },
    });
  }

  fecharAcao(): void {
    if (this.processando()) return;
    this.dialogAcao = false;
    this.alvosAcao.set([]);
  }

  deleteAluno(aluno: Aluno): void {
    if (!this.podeAbrirOperacao() || aluno.arquivado !== true) return;
    this.alunoExclusao.set({ ...aluno });
    this.dialogExclusao = true;
    this.atualizarSituacaoExclusao();
  }

  atualizarSituacaoExclusao(): void {
    const alvo = this.alunoExclusao();
    if (!this.dialogExclusao || !alvo || this.processando()) return;
    this.consultaExclusao?.unsubscribe();
    this.situacaoExclusao.set(null);
    this.conflitoVinculos.set(null);
    this.erroExclusao.set(null);
    this.consultandoExclusao.set(true);
    this.consultaExclusao = this.alunoService.consultarSituacaoExclusao(alvo.id).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.consultandoExclusao.set(false)),
    ).subscribe({
      next: dados => {
        if (!situacaoExclusaoValida(dados, alvo.id)) {
          this.erroExclusao.set('A API retornou condições de exclusão incompletas ou incompatíveis. Nenhum cadastro foi excluído. Confira o guia do backend.');
          return;
        }
        this.situacaoExclusao.set(dados);
      },
      error: (error: HttpErrorResponse) => this.erroExclusao.set(mensagemArquivamentoAluno(error)),
    });
  }

  confirmarExclusao(): void {
    if (!this.dialogExclusao || !this.podeExcluir()) return;
    const alvo = this.alunoExclusao()!;
    this.processando.set(true);
    this.alunoService.ExcluirAlunos(alvo.id).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.processando.set(false)),
    ).subscribe({
      next: () => {
        this.alunos = this.alunos.filter(item => item.id !== alvo.id);
        this.selectedAlunos = this.selectedAlunos.filter(item => item.id !== alvo.id);
        this.dialogExclusao = false;
        this.situacaoExclusao.set(null);
        this.alunoExclusao.set(null);
        this.messages.add({ severity: 'success', summary: 'Exclusão concluída',
          detail: 'Cadastro e acesso excluídos definitivamente.', life: 5000 });
      },
      error: (error: HttpErrorResponse) => {
        this.situacaoExclusao.set(null);
        if (vinculosValidos(error.error?.vinculos)) this.conflitoVinculos.set(error.error.vinculos);
        if (requerRevisaoAluno(error) || [401, 403].includes(error.status)) this.revisaoNecessaria.set(true);
        this.erroExclusao.set(requerRevisaoAluno(error)
          ? 'Exclusão não confirmada. Atualize a lista antes de tentar novamente. ' + mensagemArquivamentoAluno(error)
          : mensagemArquivamentoAluno(error));
      },
    });
  }

  fecharExclusao(): void {
    if (this.processando()) return;
    this.consultaExclusao?.unsubscribe();
    this.dialogExclusao = false;
    this.alunoExclusao.set(null);
    this.situacaoExclusao.set(null);
    this.erroExclusao.set(null);
    this.conflitoVinculos.set(null);
  }

  private podeAbrirOperacao(): boolean {
    return !this.bloqueado() && !this.revisaoNecessaria() && this.contratoDisponivel()
      && !this.erroLista() && !this.dialogAcao && !this.dialogExclusao && !this.alunoDialog;
  }

  private correspondeFiltro(aluno: Aluno, filtro = this.situacao): boolean {
    return filtro === 'TODOS' || aluno.arquivado === (filtro === 'ARQUIVADOS');
  }

  private aplicarAtualizacao(atualizado: Aluno): void {
    this.alunos = this.alunos.flatMap(item => item.id !== atualizado.id ? [item]
      : this.correspondeFiltro(atualizado) ? [atualizado] : []);
    this.selectedAlunos = this.selectedAlunos.filter(item => item.id !== atualizado.id);
  }

  private mostrarErro(error: HttpErrorResponse, summary: string): void {
    if ([0, 401, 403].includes(error.status)) return;
    this.messages.add({ severity: 'error', summary, detail: mensagemApi(error), life: 5000 });
  }
}

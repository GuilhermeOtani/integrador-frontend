import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, MeResponse, Papel, Sessao } from './auth.models';

export const AUTH_STORAGE_KEY = 'integrador.sessao';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessaoState = signal<Sessao | null>(this.restaurarSessao());
  private expiracaoTimer: ReturnType<typeof setTimeout> | null = null;

  readonly sessao = this.sessaoState.asReadonly();
  readonly usuario = computed(() => this.sessaoState()?.usuario ?? null);
  readonly papel = computed(() => this.usuario()?.tipoPessoa ?? null);
  readonly autenticado = computed(() => this.sessaoState() !== null);

  constructor() {
    const sessao = this.sessaoState();
    if (sessao) this.agendarExpiracao(sessao.expiresAt);
  }

  login(dados: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, dados).pipe(
      tap((response) => {
        const sessao: Sessao = {
          accessToken: response.accessToken,
          tokenType: response.tokenType,
          expiresAt: Date.now() + response.expiresIn * 1000,
          usuario: response.usuario,
        };
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessao));
        this.sessaoState.set(sessao);
        this.agendarExpiracao(sessao.expiresAt);
      }),
    );
  }

  carregarPerfil(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${environment.apiUrl}/auth/me`);
  }

  token(): string | null {
    const sessao = this.sessaoState();
    if (!sessao || sessao.expiresAt <= Date.now()) {
      this.limparSessao();
      return null;
    }
    return sessao.accessToken;
  }

  temPapel(...papeis: Papel[]): boolean {
    const papelAtual = this.papel();
    return papelAtual !== null && papeis.includes(papelAtual);
  }

  destinoInicial(): string {
    if (this.papel() === 'ADMIN') return '/alunos';
    if (this.papel() === 'MOTORISTA') return '/minhas-viagens';
    return '/rotas';
  }

  redirecionarAposLogin(retorno?: string | null): void {
    const retornoSeguro =
      retorno && retorno.startsWith('/') && !retorno.startsWith('//') && retorno !== '/login'
        ? retorno
        : null;
    void this.router.navigateByUrl(retornoSeguro ?? this.destinoInicial());
  }

  logout(): void {
    this.limparSessao();
    if (this.router.url !== '/login') void this.router.navigateByUrl('/login');
  }

  private restaurarSessao(): Sessao | null {
    const json = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!json) return null;

    try {
      const sessao = JSON.parse(json) as Partial<Sessao>;
      const valida =
        typeof sessao.accessToken === 'string' &&
        sessao.accessToken.length > 0 &&
        sessao.tokenType === 'Bearer' &&
        typeof sessao.expiresAt === 'number' &&
        sessao.expiresAt > Date.now() &&
        !!sessao.usuario &&
        ['ADMIN', 'ALUNO', 'MOTORISTA'].includes(sessao.usuario.tipoPessoa);

      if (!valida) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      return sessao as Sessao;
    } catch {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  }

  private agendarExpiracao(expiresAt: number): void {
    this.cancelarTimer();
    const atraso = Math.max(0, expiresAt - Date.now());
    this.expiracaoTimer = setTimeout(() => this.logout(), atraso);
  }

  private limparSessao(): void {
    this.cancelarTimer();
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    this.sessaoState.set(null);
  }

  private cancelarTimer(): void {
    if (this.expiracaoTimer !== null) {
      clearTimeout(this.expiracaoTimer);
      this.expiracaoTimer = null;
    }
  }
}

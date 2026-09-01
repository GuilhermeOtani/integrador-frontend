import { HttpErrorResponse } from '@angular/common/http';
import { ApiProblem } from './auth.models';

export function problemaApi(error: HttpErrorResponse): ApiProblem | null {
  return error.error && typeof error.error === 'object' ? (error.error as ApiProblem) : null;
}

export function mensagemApi(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Servidor indisponível. Verifique se o backend está em execução.';
  }

  const problem = problemaApi(error);
  const primeiroErro = problem?.errors ? Object.values(problem.errors)[0] : undefined;
  switch (error.status) {
    case 400:
      return problem?.detail ?? primeiroErro ?? 'Revise os dados informados.';
    case 401:
      return 'Sua sessão é inválida ou expirou. Entre novamente.';
    case 403:
      return 'Você não possui permissão para esta operação.';
    case 404:
      return problem?.detail ?? 'O recurso solicitado não foi encontrado.';
    case 409:
      return problem?.detail ?? primeiroErro ?? 'Já existe um registro com estes dados.';
    default:
      return problem?.detail ?? 'Ocorreu um erro inesperado.';
  }
}

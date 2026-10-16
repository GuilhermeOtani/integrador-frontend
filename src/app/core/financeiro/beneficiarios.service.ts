import { inject, Injectable } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { AlunoService } from '../../components/aluno/service/aluno-service';
import { MotoristaService } from '../../components/motorista/service/motorista-service';
import { UsuarioService } from '../../components/usuarios/service/usuario.service';
import { PessoaConta } from '../../components/relatorios/models/relatorios.models';
import { idFinanceiroValido, textoFinanceiro } from './financeiro.utils';
export interface Beneficiario extends PessoaConta { label: string; }
@Injectable({ providedIn: 'root' })
export class BeneficiariosService {
  private readonly alunos = inject(AlunoService); private readonly motoristas = inject(MotoristaService); private readonly usuarios = inject(UsuarioService);
  listar() {
    return forkJoin({ alunos: this.alunos.listarAlunos(), motoristas: this.motoristas.listarMotoristas(), usuarios: this.usuarios.listar() }).pipe(map(r => {
      const pessoas: PessoaConta[] = [
        ...r.alunos.filter(a => !a.arquivado).map(a => ({ id: a.id, nome: a.nome, tipoPessoa: 'ALUNO' as const })),
        ...r.motoristas.map(m => ({ id: m.id, nome: m.nome, tipoPessoa: 'MOTORISTA' as const })),
        ...r.usuarios.filter(u => u.tipoPessoa === 'ADMIN').map(u => ({ id: u.pessoaId, nome: u.nome, tipoPessoa: 'ADMIN' as const })),
      ];
      return [...new Map(pessoas.filter(p => idFinanceiroValido(p.id)).map(p => [p.id, { ...p, label: `${textoFinanceiro(p.nome)} · ${p.tipoPessoa} · #${p.id}` }])).values()].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    }));
  }
}

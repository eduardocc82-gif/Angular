import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ProfileConfig } from '../models/finance.models';

@Injectable({
  providedIn: 'root',
})
export class FinanceProfiles {
  // Chaves versionadas evitam conflito com outros projetos no localStorage.
  private readonly profilesKey = 'controle-financeiro-angular.profiles.v1';
  private readonly selectedProfileKey = 'controle-financeiro-angular.selected-profile.v1';

  // Perfis iniciais seguem exatamente os percentuais do documento.
  private readonly defaultProfiles: ProfileConfig[] = [
    {
      id: 'leve',
      label: 'Leve',
      percentage: 90,
      description: 'Permite gastar até 90% das entradas do mês.',
    },
    {
      id: 'conservador',
      label: 'Conservador',
      percentage: 50,
      description: 'Permite gastar até 50% das entradas do mês.',
    },
    {
      id: 'arrojado',
      label: 'Arrojado',
      percentage: 40,
      description: 'Permite gastar até 40% das entradas do mês.',
    },
  ];

  // Streams de perfis e selecao sincronizados apos configuracoes do usuario.
  private readonly profilesSubject = new BehaviorSubject<ProfileConfig[]>(this.loadProfiles());
  private readonly selectedProfileSubject = new BehaviorSubject<ProfileConfig['id']>(
    this.loadSelectedProfileId(),
  );

  // Observables publicos usados pelas paginas.
  readonly profiles$ = this.profilesSubject.asObservable();
  readonly selectedProfileId$ = this.selectedProfileSubject.asObservable();

  /** Exposicao sincrona dos perfis configuraveis. */
  get profilesSnapshot(): ProfileConfig[] {
    return this.profilesSubject.value;
  }

  /** Resolve o perfil ativo a partir do ID persistido. */
  get selectedProfile(): ProfileConfig {
    const selectedId = this.selectedProfileSubject.value;
    return (
      this.profilesSubject.value.find((profile) => profile.id === selectedId) ??
      this.profilesSubject.value[0]
    );
  }

  /** Troca o perfil ativo usado no calculo de metas. */
  selectProfile(profileId: ProfileConfig['id']): void {
    localStorage.setItem(this.selectedProfileKey, profileId);
    this.selectedProfileSubject.next(profileId);
  }

  /** Atualiza o percentual configuravel mantendo nome e descricao do perfil. */
  updateProfile(profileId: ProfileConfig['id'], percentage: number): void {
    const normalizedPercentage = Math.min(Math.max(Number(percentage), 1), 100);
    const updatedProfiles = this.profilesSubject.value.map((profile) =>
      profile.id === profileId ? { ...profile, percentage: normalizedPercentage } : profile,
    );

    localStorage.setItem(this.profilesKey, JSON.stringify(updatedProfiles));
    this.profilesSubject.next(updatedProfiles);
  }

  /** Restaura os perfis padrao e seleciona o perfil conservador. */
  resetDemoData(): void {
    localStorage.removeItem(this.profilesKey);
    localStorage.setItem(this.selectedProfileKey, 'conservador');
    this.profilesSubject.next([...this.defaultProfiles]);
    this.selectedProfileSubject.next('conservador');
  }

  /** Carrega perfis customizados ou mantem os perfis padrao. */
  private loadProfiles(): ProfileConfig[] {
    try {
      const storedProfiles = localStorage.getItem(this.profilesKey);
      if (!storedProfiles) {
        return [...this.defaultProfiles];
      }

      return JSON.parse(storedProfiles) as ProfileConfig[];
    } catch {
      return [...this.defaultProfiles];
    }
  }

  /** Resolve o perfil inicial persistido, com conservador como padrao. */
  private loadSelectedProfileId(): ProfileConfig['id'] {
    const storedProfile = localStorage.getItem(this.selectedProfileKey) as
      | ProfileConfig['id']
      | null;
    return storedProfile ?? 'conservador';
  }
}

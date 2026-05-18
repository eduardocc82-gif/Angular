import { Component, Input } from '@angular/core';

import { ProfileConfig, ProjectionResult } from '../../models/finance.models';

@Component({
  selector: 'app-goal-projection',
  standalone: false,
  templateUrl: './goal-projection.html',
  styleUrl: './goal-projection.scss',
})
export class GoalProjection {
  // Dados calculados pelo pai entram por @Input.
  @Input() profile: ProfileConfig | null = null;
  @Input() projection: ProjectionResult | null = null;

  // Largura protegida para a barra não estourar o layout.
  progressWidth(): string {
    const percent = Math.min(this.projection?.usagePercent ?? 0, 100);
    return `${percent}%`;
  }

  // Classe por status de meta.
  statusClass(): string {
    return `goal-projection--${this.projection?.status ?? 'positiva'}`;
  }

  // Ícone sem SVG manual, usando Bootstrap Icons.
  statusIcon(): string {
    const icons = {
      positiva: 'bi-check-circle',
      alerta: 'bi-exclamation-triangle',
      negativa: 'bi-x-circle',
    };

    return icons[this.projection?.status ?? 'positiva'];
  }
}

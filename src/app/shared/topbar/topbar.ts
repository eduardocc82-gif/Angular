import { Component } from '@angular/core';

@Component({
  selector: 'app-topbar',
  standalone: false,
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  // Itens do menu centralizados para facilitar manutenção das rotas.
  readonly navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'bi-speedometer2' },
    { label: 'Lançamentos', route: '/lancamentos', icon: 'bi-plus-circle' },
    { label: 'Metas', route: '/metas', icon: 'bi-bullseye' },
    { label: 'Investimentos', route: '/investimentos', icon: 'bi-graph-up-arrow' },
    { label: 'Relatórios', route: '/relatorios', icon: 'bi-file-earmark-pdf' },
    { label: 'Configurações', route: '/configuracoes', icon: 'bi-sliders' },
  ];
}

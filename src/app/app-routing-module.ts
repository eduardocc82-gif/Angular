import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Configuracoes } from './pages/configuracoes/configuracoes';
import { Dashboard } from './pages/dashboard/dashboard';
import { Investimentos } from './pages/investimentos/investimentos';
import { Lancamentos } from './pages/lancamentos/lancamentos';
import { Metas } from './pages/metas/metas';
import { Relatorios } from './pages/relatorios/relatorios';

// Rotas principais pedidas na especificação, com alias para o typo "configuacoes".
const routes: Routes = [
  { path: 'dashboard', component: Dashboard },
  { path: 'lancamentos', component: Lancamentos },
  { path: 'metas', component: Metas },
  { path: 'investimentos', component: Investimentos },
  { path: 'carteira', redirectTo: 'investimentos', pathMatch: 'full' },
  { path: 'relatorios', component: Relatorios },
  { path: 'configuracoes', component: Configuracoes },
  { path: 'configuacoes', redirectTo: 'configuracoes', pathMatch: 'full' },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

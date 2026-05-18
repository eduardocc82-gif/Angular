import { LOCALE_ID, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Topbar } from './shared/topbar/topbar';
import { SummaryCard } from './shared/summary-card/summary-card';
import { FilterBar } from './shared/filter-bar/filter-bar';
import { RecordsTable } from './shared/records-table/records-table';
import { RecordForm } from './shared/record-form/record-form';
import { ChartPanel } from './shared/chart-panel/chart-panel';
import { GoalProjection } from './shared/goal-projection/goal-projection';
import { Dashboard } from './pages/dashboard/dashboard';
import { Lancamentos } from './pages/lancamentos/lancamentos';
import { Metas } from './pages/metas/metas';
import { Configuracoes } from './pages/configuracoes/configuracoes';
import { Investimentos } from './pages/investimentos/investimentos';

// Registro do locale pt-BR para moeda, datas e números no padrão brasileiro.
registerLocaleData(localePt);

@NgModule({
  declarations: [
    App,
    Topbar,
    SummaryCard,
    FilterBar,
    RecordsTable,
    RecordForm,
    ChartPanel,
    GoalProjection,
    Dashboard,
    Lancamentos,
    Metas,
    Configuracoes,
    Investimentos,
  ],
  imports: [BrowserModule, FormsModule, AppRoutingModule],
  providers: [provideBrowserGlobalErrorListeners(), { provide: LOCALE_ID, useValue: 'pt-BR' }],
  bootstrap: [App],
})
export class AppModule {}

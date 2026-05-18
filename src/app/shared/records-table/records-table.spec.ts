import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialRecord } from '../../models/finance.models';
import { RecordsTable } from './records-table';

describe('RecordsTable', () => {
  let fixture: ComponentFixture<RecordsTable>;
  let component: RecordsTable;

  const records: FinancialRecord[] = [
    {
      id: 'registro-1',
      description: 'Salário',
      type: 'entrada',
      category: 'Salário',
      date: '2026-05-05',
      value: 5000,
    },
    {
      id: 'registro-2',
      description: 'Aluguel',
      type: 'saida',
      category: 'Moradia',
      date: '2026-05-06',
      value: 1500,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RecordsTable],
      imports: [CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordsTable);
    component = fixture.componentInstance;
    component.records = records;
    fixture.detectChanges();
  });

  it('deve renderizar registros recebidos por @Input', () => {
    const tableText = fixture.nativeElement.textContent as string;

    expect(tableText).toContain('Salário');
    expect(tableText).toContain('Aluguel');
    expect(tableText).toContain('2 registro(s) encontrado(s)');
  });

  it('deve emitir o ID do registro ao clicar em excluir', () => {
    const spy = vi.spyOn(component.deleteRecord, 'emit');
    const deleteButton = fixture.nativeElement.querySelector('button[aria-label="Excluir Salário"]') as HTMLButtonElement;

    deleteButton.click();

    expect(spy).toHaveBeenCalledWith('registro-1');
  });

  it('deve mostrar mensagem quando a lista estiver vazia', () => {
    const emptyFixture = TestBed.createComponent(RecordsTable);
    emptyFixture.componentInstance.records = [];
    emptyFixture.detectChanges();

    expect(emptyFixture.nativeElement.textContent).toContain('Nenhum lançamento encontrado');
  });
});

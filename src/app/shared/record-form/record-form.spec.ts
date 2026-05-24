import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { NewFinancialRecord } from '../../models/finance.models';
import { RecordForm } from './record-form';

describe('RecordForm', () => {
  let fixture: ComponentFixture<RecordForm>;
  let component: RecordForm;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      declarations: [RecordForm],
      imports: [FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve carregar categorias conforme o tipo selecionado', () => {
    component.onTypeChange('entrada');

    expect(component.categories).toContain('Salário');
    expect(component.form.category).toBe('Salário');
  });

  it('deve restringir tipos disponíveis quando a página informa tipos permitidos', () => {
    const restrictedFixture = TestBed.createComponent(RecordForm);
    restrictedFixture.componentInstance.allowedTypes = ['entrada', 'saida'];
    restrictedFixture.detectChanges();

    expect(restrictedFixture.componentInstance.typeOptions.map((option) => option.value)).toEqual([
      'entrada',
      'saida',
    ]);
  });

  it('deve emitir um lançamento válido por @Output', () => {
    const emittedRecords: NewFinancialRecord[] = [];
    component.saveRecord.subscribe((record) => emittedRecords.push(record));
    component.form = {
      description: 'Conta de luz',
      type: 'saida',
      category: 'Moradia',
      date: '2026-05-10',
      value: 250,
    };

    component.submit();

    expect(emittedRecords).toHaveLength(1);
    expect(emittedRecords[0]).toEqual({
      description: 'Conta de luz',
      type: 'saida',
      category: 'Moradia',
      date: '2026-05-10',
      value: 250,
    });
  });

  it('deve bloquear data futura para receita ou despesa', () => {
    const spy = vi.spyOn(component.saveRecord, 'emit');
    component.form = {
      description: 'Receita futura',
      type: 'entrada',
      category: 'Salário',
      date: '2999-01-01',
      value: 1000,
    };

    component.submit();

    expect(spy).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('não podem ser cadastradas com data futura');
  });

  it('deve travar o tipo quando usado no módulo de investimentos', () => {
    component.lockedType = 'investimento';
    component.ngOnChanges({
      lockedType: {
        currentValue: 'investimento',
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(component.form.type).toBe('investimento');
    expect(component.categories).toContain('Tesouro Direto');
  });
});

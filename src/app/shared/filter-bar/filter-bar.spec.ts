import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { RecordFilters } from '../../models/finance.models';
import { FilterBar } from './filter-bar';

describe('FilterBar', () => {
  let fixture: ComponentFixture<FilterBar>;
  let component: FilterBar;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      declarations: [FilterBar],
      imports: [FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBar);
    component = fixture.componentInstance;
    component.months = ['2026-05'];
    component.categories = ['Moradia', 'Outros'];
    component.filters = { month: 'todos', category: 'todas', type: 'todos' };
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve renderizar opções recebidas por @Input', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('maio de 2026');
    expect(text).toContain('Moradia');
  });

  it('deve emitir filtros atualizados por @Output', () => {
    const emittedFilters: RecordFilters[] = [];
    component.filtersChange.subscribe((filters) => emittedFilters.push(filters));

    component.updateFilter('category', 'Moradia');

    expect(emittedFilters).toEqual([{ month: 'todos', category: 'Moradia', type: 'todos' }]);
  });
});

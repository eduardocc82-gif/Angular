import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import { NewFinancialRecord, TransactionType } from '../../models/finance.models';
import { Finance } from '../../services/finance';

@Component({
  selector: 'app-record-form',
  standalone: false,
  templateUrl: './record-form.html',
  styleUrl: './record-form.scss',
})
export class RecordForm implements OnInit, OnChanges {
  // Permite reaproveitar o formulário para lançamentos comuns ou apenas investimentos.
  @Input() allowedTypes: TransactionType[] = ['entrada', 'saida', 'investimento'];
  @Input() lockedType: TransactionType | null = null;
  @Input() title = 'Novo lançamento';
  @Input() submitLabel = 'Salvar lançamento';
  @Input() descricaoPlaceholder = 'Ex: Conta de luz';

  // O formulário comunica o novo registro ao pai por @Output.
  @Output() saveRecord = new EventEmitter<NewFinancialRecord>();

  // Data máxima do input HTML e base da regra contra datas futuras.
  readonly today = new Date().toISOString().slice(0, 10);

  // Opções fixas de tipo exibidas quando não há tipo travado.
  private readonly allTypeOptions: Array<{ value: TransactionType; label: string }> = [
    { value: 'entrada', label: 'Entrada' },
    { value: 'saida', label: 'Saída' },
    { value: 'investimento', label: 'Investimento' },
  ];

  // Modelo local do formulário template-driven; categorias reais entram após a injeção do Service.
  form: NewFinancialRecord = {
    description: '',
    type: 'saida',
    category: 'Outros',
    date: this.today,
    value: 0,
  };
  categories: string[] = [];
  errorMessage = '';

  constructor(private readonly finance: Finance) {}

  get typeOptions(): Array<{ value: TransactionType; label: string }> {
    return this.allTypeOptions.filter((option) => this.allowedTypes.includes(option.value));
  }

  // Inicializa categorias no primeiro carregamento do componente.
  ngOnInit(): void {
    this.applyLockedType();
  }

  // Reage quando a página de investimentos trava o tipo por @Input.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lockedType'] || changes['allowedTypes']) {
      this.applyLockedType();
    }
  }

  // Atualiza categorias quando o usuário muda Entrada/Saída/Investimento.
  onTypeChange(type: TransactionType): void {
    const resolvedType = this.resolveAllowedType(type);
    this.form.type = resolvedType;
    this.categories = this.finance.getCategoriesForType(resolvedType);
    this.form.category = this.categories[0] ?? 'Outros';
  }

  // Valida campos obrigatórios e a regra de data futura antes de emitir.
  submit(): void {
    this.errorMessage = '';

    if (!this.form.description.trim()) {
      this.errorMessage = 'Informe uma descrição para o lançamento.';
      return;
    }

    if (!this.form.category) {
      this.errorMessage = 'Selecione uma categoria.';
      return;
    }

    if (this.form.value <= 0) {
      this.errorMessage = 'Informe um valor maior que zero.';
      return;
    }

    if (!this.allowedTypes.includes(this.form.type)) {
      this.errorMessage = 'Tipo de lançamento indisponível nesta página.';
      return;
    }

    if (this.form.type !== 'investimento' && this.finance.isFutureDate(this.form.date)) {
      this.errorMessage = 'Receitas e despesas não podem ser cadastradas com data futura.';
      return;
    }

    this.saveRecord.emit({
      ...this.form,
      description: this.form.description.trim(),
      value: Number(this.form.value),
    });

    this.reset();
  }

  // Limpa formulário preservando o tipo travado quando existir.
  reset(): void {
    const type = this.lockedType ?? this.resolveAllowedType('saida');
    this.form = this.createEmptyForm(type);
    this.categories = this.finance.getCategoriesForType(type);
    this.form.category = this.categories[0] ?? 'Outros';
    this.errorMessage = '';
  }

  // Aplica tipo travado em páginas dedicadas, como Investimentos.
  private applyLockedType(): void {
    const type = this.lockedType ?? this.resolveAllowedType(this.form.type);
    this.form.type = type;
    this.categories = this.finance.getCategoriesForType(type);
    this.form.category = this.categories[0] ?? 'Outros';
  }

  private resolveAllowedType(type: TransactionType): TransactionType {
    if (this.allowedTypes.includes(type)) {
      return type;
    }

    return this.allowedTypes[0] ?? 'saida';
  }

  // Cria um novo estado de formulário com data atual.
  private createEmptyForm(type: TransactionType): NewFinancialRecord {
    const categories = this.finance.getCategoriesForType(type);

    return {
      description: '',
      type,
      category: categories[0] ?? 'Outros',
      date: this.today,
      value: 0,
    };
  }
}

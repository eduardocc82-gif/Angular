# Controle Financeiro Angular

Data da versão: 24/05/2026 20:42 (America/Fortaleza)
Versão do projeto: 3.0.0

Aplicação Angular para controle financeiro pessoal, com dashboard, lançamentos, metas, carteira e investimentos, relatórios em PDF, persistência local e visualização por gráficos.

## Recursos

- Dashboard com cards de entradas, saídas, saldo e investimentos.
- Cadastro e exclusão de lançamentos usando comunicação entre componentes com `@Input()` e `@Output()`.
- Filtros por mês, categoria e tipo.
- Persistência de registros, perfis e perfil ativo em `localStorage`.
- Perfis leve, conservador e arrojado com percentuais editáveis.
- Projeção de meta com status, limite e margem diária.
- Card de balanceamento das despesas por categoria em relação às entradas do mês.
- Configuração flexível do percentual máximo de balanceamento entre 30% e 100%.
- Tela unificada de Carteira e Investimentos, com aportes, resgates, saldo acumulado e total investido.
- Tela de relatórios com prévia e geração de PDF para impressão.
- Gráficos com Chart.js.
- Interface responsiva com Bootstrap e Bootstrap Icons.

## Alterações da versão 3.0.0

- Criada a experiência unificada `Carteira e Investimentos`, mesclando carteira e investimentos em uma única aba.
- A antiga rota `/carteira` agora redireciona para `/investimentos`, mantendo compatibilidade com links já existentes.
- A tela `Carteira e Investimentos` passou a exibir os cards `Total investido` e `Saldo hoje carteira` lado a lado.
- Movidos os gráficos `Saldo acumulado no período` e `Valor total investido no período completo` para a parte inferior da tela de Carteira e Investimentos.
- Removido o gráfico `Saldo acumulado no período` da Dashboard.
- O card `Saldo hoje carteira` da Dashboard agora abre a tela unificada de Carteira e Investimentos.
- O card `Investimentos` da Dashboard foi renomeado para `Total investido` e passou a considerar aportes acumulados até a data atual.
- Criada regra para lançar automaticamente uma saída ao cadastrar um investimento:
  - descrição `Saída Investimento`;
  - categoria `Aplicação Investimento`;
  - mesma data e valor do aporte.
- Criada regra para resgatar investimentos:
  - o botão de lixeira da tabela de investimentos foi substituído por `Resgatar investimento`;
  - o resgate lança uma entrada automática com descrição `Entrada Investimento`;
  - a entrada automática usa a categoria `Resgate investimento`;
  - o investimento original é removido da lista após o resgate.
- A categoria `Aplicação Investimento` deixou de entrar no cálculo de uso da meta.
- A categoria `Aplicação Investimento` deixou de entrar no cálculo de balanceamento de despesas.
- As categorias `Aplicação Investimento` e `Resgate investimento` deixaram de aparecer nos gráficos `Despesas por categoria` e `Evolução mensal - Entradas vs Saídas`.
- A aba `Lançamentos` passou a permitir o cadastro apenas de entradas e saídas no formulário.
- O filtro de tipo da aba `Lançamentos` continua exibindo investimentos para consulta histórica.
- A descrição dos perfis de metas passou a ser atualizada automaticamente quando o percentual do perfil é alterado em Configurações.
- Adicionados testes para regras de carteira, investimento, resgate, exclusões de meta e balanceamento, e restrição de tipos no formulário.
- Projeto atualizado para `3.0.0`.

## Alterações da versão 2.2.0

- Adicionado o card `Balanceamento das Despesas` logo abaixo da projeção de meta no Dashboard e na tela de Metas.
- Criada regra de negócio para identificar quando uma categoria de despesa ultrapassa o percentual máximo permitido em relação às entradas do mês.
- Mantido o padrão visual do status da projeção, com mensagem positiva em verde e mensagem negativa em vermelho.
- Destacado em vermelho o nome do item desbalanceado e o percentual correspondente.
- Formatado o percentual da mensagem com duas casas decimais no padrão brasileiro.
- Adicionada na aba Configurações a opção `percentual máximo para que alguma despesa seja considerada desbalanceada)`.
- O percentual configurável varia de 30% até 100%, permanece com 50% como valor padrão e é persistido em `localStorage`.
- O botão `Restaurar demo` agora também retorna o percentual de balanceamento para 50%.
- Adicionado serviço `FinanceSettings` para isolar as configurações gerais do sistema.
- Adicionados testes para o percentual configurável, limites de 30% a 100% e restauração da demo.
- Projeto atualizado para `2.2.0`.

## Alterações da versão 2.1.0

- Reforçado o `try/catch` em `loadRecords()` para cobrir falhas de acesso ao `localStorage` e JSON inválido.
- Reforçado o `try/catch` em `loadProfiles()` para cobrir falhas de acesso ao `localStorage` e JSON inválido.
- Adicionado `try/catch` em `generatePdf()` para tratar erros na importação das bibliotecas, criação do PDF, abertura da aba ou salvamento.
- Mantido o comportamento funcional do sistema, exibindo mensagem amigável quando a geração do PDF falha.
- Projeto atualizado para `2.1.0`.

## Alterações da versão 2.0.0

- A classe `Finance` foi separada em serviços menores por responsabilidade:
  - `FinanceRecords`: lançamentos, mock inicial e persistência.
  - `FinanceProfiles`: perfis financeiros, seleção e atualização.
  - `FinanceCategories`: categorias por tipo de transação.
  - `FinanceCalculations`: filtros, totais, projeções, meses e datas.
- `Finance` foi mantida como fachada pública para preservar a API usada pelas telas.
- Todas as funções/getters de `Finance` e dos serviços derivados foram comentadas.
- Corrigido o deslocamento de data nas tabelas, evitando que `YYYY-MM-DD` seja interpretado em UTC pelo `date` pipe.
- Ajustado o idioma base do documento para `pt-BR`.
- Melhorada a limpeza do Chart.js ao recriar gráficos.
- A geração de PDF agora revoga a URL temporária criada para o arquivo.
- Código revisado, formatado e validado com build e testes.

## Histórico de versões anteriores

Histórico reconstruído por comparação dos arquivos zipados encontrados no diretório do projeto. As versões `1.7`, `1.8` e `1.9` não foram localizadas como pacotes zipados, então não há alterações confiáveis registradas para elas neste workspace.

### Versão 1.6

- Adicionado placeholder configurável ao `RecordForm` por meio do input `descricaoPlaceholder`.
- Ajustado o formulário de investimentos para usar placeholder específico de aporte.
- Melhorada a apresentação visual dos investimentos, com cor própria para o tipo `investimento`.
- Refinada a tela de relatórios, removendo o botão principal do topo e deixando a ação no bloco de filtros.
- Melhorada a prévia e o PDF dos relatórios com estilos por tipo de lançamento.
- Ajustados textos e microcópias nas telas de configurações e relatórios.

### Versão 1.5

- Simplificada a tela de metas com a remoção do gráfico de despesas por categoria dessa página.
- Simplificada a tela de relatórios com remoção dos cards de resumo da prévia.
- Reduzida a complexidade visual da página de relatórios e dos estilos responsivos ligados aos cards removidos.

### Versão 1.4

- `filterRecords()` passou a devolver os lançamentos em ordem crescente por data e descrição.
- `RecordsTable` passou a ordenar os registros internamente antes da exibição.
- Atualizada a tabela para usar `sortedRecords` na contagem, renderização e estado vazio.
- Adicionados testes cobrindo a ordenação cronológica dos registros.

### Versão 1.3

- Adicionada a página de relatórios em `src/app/pages/relatorios`.
- Criada rota `/relatorios`.
- Adicionado item “Relatórios” ao menu superior.
- Adicionadas dependências para geração de PDF com `jspdf` e `jspdf-autotable`.
- Configurada a dependência CommonJS permitida para `canvg`.
- Ajustado o `index.html` para idioma `pt-BR`.

### Versão 1.2

- Adicionada configuração de testes no `angular.json` usando `@angular/build:unit-test`.
- Adicionadas dependências de teste `vitest` e `jsdom`.
- Criados testes para o serviço financeiro.
- Criados testes para `FilterBar`, `RecordForm` e `RecordsTable`.

### Versão 1.1

- Ajustados ícones dos cards de entrada e saída para usar `bi-graph-up-arrow` e `bi-graph-down-arrow`.
- Ajustes aplicados no dashboard e na tela de metas.

### Versões 1.7, 1.8 e 1.9

- Nenhum pacote `controle-financeiro-angular v1.7.zip`, `v1.8.zip` ou `v1.9.zip` foi encontrado no diretório.
- O histórico disponível indica salto da versão `1.6` para a versão `2.0`.

## Versões principais

- Projeto: 3.0.0
- Angular: ^21.2.0
- Angular CLI/build: ^21.2.8
- TypeScript: ~5.9.2
- RxJS: ~7.8.0
- Bootstrap: ^5.3.8
- Bootstrap Icons: ^1.13.1
- Chart.js: ^4.5.1
- jsPDF: ^4.2.1
- jsPDF AutoTable: ^5.0.8
- Vitest: ^4.1.6
- npm declarado: 11.11.0

## Como rodar

```bash
npm install
npm start
```

Acesse:

```text
http://127.0.0.1:4200/
```

## Build

```bash
npm run build
```

O build de produção é gerado em:

```text
dist/controle-financeiro-angular
```

## Testes

```bash
npm test -- --watch=false
```

Validação da versão 3.0.0:

- `npm run build`: aprovado.
- `npm test`: aprovado, 4 arquivos de teste e 29 testes.

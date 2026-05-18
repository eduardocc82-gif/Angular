# Controle Financeiro Angular

Projeto final em Angular para controle financeiro pessoal, desenvolvido a partir das especificações do arquivo `especificacoes.docx` e do layout de referência do `saved_resource.zip`.

## Recursos implementados

- Dashboard com cards de entradas, saídas, saldo e investimentos.
- Tabela filtrável por mês, categoria e tipo.
- Cadastro e exclusão de lançamentos com `@Input()` e `@Output()`.
- IDs gerados com `crypto.randomUUID()`.
- Validação de data futura para receitas e despesas.
- Persistência de registros, perfis e perfil ativo em `localStorage`.
- Perfis leve, conservador e arrojado com percentuais editáveis.
- Projeção de meta com status e margem diária.
- Rotas `/dashboard`, `/lancamentos`, `/metas`, `/investimentos`, `/configuracoes` e alias `/configuacoes`.
- Gráficos com Chart.js.
- Bootstrap e Bootstrap Icons para UI responsiva.

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

O build de produção é gerado em `dist/controle-financeiro-angular`.

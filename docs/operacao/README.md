# Operação — índice (Fisio)

Documentação de **ambiente, produção, banco e CI** para a stack Fisio (Next + Spring + PostgreSQL + S3).

| Documento | Descrição |
|-----------|------------|
| [TODO-producao.md](./TODO-producao.md) | Tarefas backend + front antes de produção |
| [variaveis-ambiente-local-producao.md](./variaveis-ambiente-local-producao.md) | Variáveis **LOCAL** vs **PRODUÇÃO** (tabelas) |
| [deploy-producao-custo-zero.md](./deploy-producao-custo-zero.md) | *Deploy* barato (Vercel, Render/Fly, Neon, R2, **GitHub Actions**) |
| [infra-estrategia-cicd-e-db.md](./infra-estrategia-cicd-e-db.md) | *Free tier*, ordem de *setup*, CI/CD GitHub, **DB sem repo separado**, *branch protection* |
| [banco-dados-postgresql.md](./banco-dados-postgresql.md) | Criar e operar PostgreSQL; Flyway; *backup* |

- Modelo de env: `env.example` (raiz do repositório)  
- Backend: `msorquestrador-jf/env.example` e `msorquestrador-jf/docs/operacao/README.md` (ponte para estes ficheiros)

**Escalabilidade:** variáveis separadas por ambiente evitam *drift*; CI no **front** e no **backend** (`lint` + *test* + *build* / `mvn verify`) a cada PR; Dependabot e CodeQL ajudam a manter dependências e superfície de ataque sob controlo.

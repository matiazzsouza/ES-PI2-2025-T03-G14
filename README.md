ES-PI2-2025-T3-G14 - NotaDez


👥 Integrantes do Grupo

LUCAS ORMENESE ALTIERI - RA24005497
MATEUS SOUZA MARINHO - RM24005497
PEDRO ALENCAR BILIU VALE VIEIRA - RM550585
VINICIUS DOS SANTOS GIROTTI - RM99190

🎯 Professor Orientador

LUA MARCELO MURIANA

📋 Descrição do Projeto

Sistema web para gerenciamento de notas pessoais desenvolvido com TypeScript, Node.js, Express e SQLite.

🚀 Status do Projeto
Em Desenvolvimento - Incremento 1: MVP Básico

📦 Como Usar
Pré-requisitos
    Node.js 18+
    npm ou yarn

Instalação
bash

git clone git@github.com:matiazzsouza/ES-PI2-2025-T03-G14.git
cd ES-PI2-2025-T03-G14
npm install

Execução
bash

npm run dev

Acesse: http://localhost:3000
Credenciais de Teste

    Email: admin@notadez.com

    Senha: 123456

🏗️ Estrutura do Projeto
text

ES-PI2-2025-T3-G14/
├── src/
│   ├── controllers/     # Lógica das rotas (AuthController, NotesController)
│   ├── models/          # Modelos de dados (User, Note)
│   ├── routes/          # Definição de rotas (authRoutes, notesRoutes)
│   ├── database/        # Configuração SQLite (database.ts)
│   ├── views/           # Templates EJS
│   │   ├── auth/        # Páginas de autenticação (login, register)
│   │   ├── notes/       # Páginas de notas (index, create, show, edit)
│   │   └── partials/    # Componentes reutilizáveis (header, footer)
│   ├── public/          # Arquivos estáticos
│   │   ├── css/         # Estilos (style.css)
│   │   ├── js/          # Scripts JavaScript (script.js)
│   │   └── images/      # Imagens e assets
│   └── app.ts           # Arquivo principal da aplicação
├── package.json         # Dependências e scripts do projeto
├── tsconfig.json        # Configuração do TypeScript
├── .gitignore          # Arquivos ignorados pelo Git
├── LICENSE             # Licença MIT
└── README.md           # Documentação do projeto

📝 Scripts Disponíveis
bash

npm run dev    # Desenvolvimento com auto-reload
npm run build  # Compila TypeScript para JavaScript  
npm start      # Modo produção
npm test       # Executa testes

🛠️ Tecnologias Utilizadas

    Backend: Node.js, Express, TypeScript

    Database: SQLite

    Template Engine: EJS

    Autenticação: express-session, bcrypt

    Frontend: HTML5, CSS3, JavaScript

📋 Funcionalidades
✅ Implementadas

    Sistema de autenticação (login/logout)

    CRUD completo de notas (Create, Read, Update, Delete)

    Interface responsiva

    Persistência com SQLite

    Sessões de usuário

🔄 Em Desenvolvimento

    Sistema de registro de usuários

    Dashboard pessoal

    Sistema de categorias/tags

    Busca e filtros

    Exportação de notas

🔄 Versionamento
Estrutura de Branches

    main - Código estável (produção)

    develop - Desenvolvimento principal

    feature/autenticacao - Sistema de autenticação

    feature/sistema-notes - CRUD de notas

    feature/frontend - Interface do usuário

    feature/database - Configuração do banco de dados

Convenção de Commits
text

feat: adiciona nova funcionalidade
fix: corrige bug ou problema
docs: atualiza documentação
style: formatação de código
refactor: refatoração de código
test: adiciona testes

👥 Contribuição

    Fork o projeto

    Crie uma branch: git checkout -b feature/nova-feature

    Commit suas mudanças: git commit -m 'feat: adiciona feature'

    Push para a branch: git push origin feature/nova-feature

    Abra um Pull Request

📊 GitHub Projects

O acompanhamento do projeto é realizado através do GitHub Projects, com apontamento real de horas e tasks seguindo a metodologia ágil.
⚠️ Problemas Conhecidos

Nenhum problema crítico no momento
📞 Suporte

Encontrou um problema? Abra uma issue no GitHub.
📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

# MCP Server Orchestrator API

Uma API FastAPI que descobre automaticamente servidores MCP do GitHub, realiza deploy e orquestra com Gemini AI.

## Funcionalidades

- 🔍 **Descoberta Automática**: Busca servidores MCP no GitHub usando a API de pesquisa
- 🚀 **Deploy Multi-método**: Suporta Docker, NPX, E2B e deploy local
- 🤖 **Orquestração Gemini**: Integração com Gemini para execução inteligente de tarefas
- 💾 **Cache e Registro**: Sistema de cache para servidores descobertos
- 📊 **API RESTful**: Endpoints completos para gerenciamento de servidores MCP

## Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd test-python
```

### 2. Instale as dependências

```bash
pip install -r requirements.txt
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

### 4. Execute a aplicação

```bash
# Modo desenvolvimento
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Ou use o script Python diretamente
python main.py
```

## Uso da API

### Endpoints Principais

#### 1. Descobrir Servidores MCP

```bash
POST /api/discover
{
  "query": "context7 mcp",
  "limit": 10,
  "auto_deploy": false
}
```

#### 2. Deploy de Servidor

```bash
POST /api/deploy
{
  "github_url": "https://github.com/upstash/context7",
  "method": "auto",
  "port": 3000
}
```

#### 3. Listar Servidores

```bash
GET /api/servers
GET /api/servers?status=deployed
GET /api/servers/{server_id}
```

#### 4. Orquestrar Tarefa com Gemini

```bash
POST /api/orchestrate
{
  "server_id": "abc123",
  "prompt": "Count all users in the database",
  "context": {}
}
```

#### 5. Invocar Ferramenta Diretamente

```bash
POST /api/invoke
{
  "server_id": "abc123",
  "tool_name": "sql_query",
  "args": {
    "query": "SELECT COUNT(*) FROM users"
  }
}
```

## Métodos de Deploy

### Docker
- Detecta automaticamente `Dockerfile` ou `docker-compose.yml`
- Constrói e executa container isolado
- Ideal para produção

### NPX
- Para pacotes npm publicados (ex: `@upstash/context7-mcp`)
- Execução rápida sem instalação permanente
- Perfeito para servidores Node.js

### E2B (Sandbox)
- Execução segura em ambiente isolado
- Ideal para código não confiável
- Requer API key do E2B

### Local
- Para servidores Python com `requirements.txt`
- Execução direta no host
- Útil para desenvolvimento

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Cliente   │────▶│   FastAPI    │────▶│   GitHub    │
│     API     │     │  Orchestrator│     │     API     │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                    ┌───────▼────────┐
                    │     Gemini     │
                    │  Orchestrator  │
                    └───────┬────────┘
                            │
                ┌───────────▼───────────┐
                │   Deployed Servers    │
                │  ┌──────┐ ┌──────┐   │
                │  │Docker│ │ NPX  │   │
                │  └──────┘ └──────┘   │
                │  ┌──────┐ ┌──────┐   │
                │  │ E2B  │ │Local │   │
                │  └──────┘ └──────┘   │
                └───────────────────────┘
```

## Documentação Interativa

Acesse a documentação interativa da API em:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Docker

### Build da imagem

```bash
docker build -t mcp-orchestrator .
```

### Executar com Docker Compose

```bash
docker-compose up -d
```

## Segurança

- **GitHub Token**: Use token com permissões mínimas (read:repo)
- **Gemini API Key**: Mantenha segura e não commite no código
- **Sandbox**: Use E2B para código não confiável
- **Network**: Configure firewall para isolar servidores deployados

## Troubleshooting

### Erro de rate limit do GitHub
- Configure `GITHUB_TOKEN` no `.env`
- Reduza o número de requisições paralelas

### Falha no deploy Docker
- Verifique se Docker está instalado e rodando
- Confirme permissões do usuário para Docker

### Gemini não responde
- Verifique `GEMINI_API_KEY`
- Confirme quota da API

## Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
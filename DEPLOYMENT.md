# Deploy SmartDirect CRM

## Regiao recomendada

Como o Render ainda nao oferece Sao Paulo, use uma regiao comum nos tres
provedores:

- Vercel: `iad1` / Washington, DC / US East
- Render: `virginia`
- Supabase: `us-east-1` / North Virginia

Para publico majoritariamente no Brasil, Sao Paulo seria melhor para banco e
frontend, mas a API no Render ficaria fora dessa regiao.

## Supabase

1. Crie um projeto em `us-east-1`.
2. Copie a connection string do Postgres, de preferencia pelo pooler.
3. Use essa URL em `DATABASE_URL` no Render.

## Render

1. Publique o repositorio em um Git provider.
2. No Render, crie um Blueprint apontando para o arquivo `render.yaml`.
3. Preencha as variaveis marcadas como `sync: false`:
   - `DATABASE_URL`
   - `FRONTEND_URL`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
4. A API sera criada como `smartdirect-api`.
5. O Render Key Value sera criado como `smartdirect-redis` e injetado em
   `REDIS_URL`.

## Vercel

1. Crie um projeto apontando o Root Directory para `apps/web`.
2. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Adicione a variavel:
   - `VITE_API_URL=https://smartdirect-api.onrender.com/api`
4. Faca o deploy de producao.

## Variaveis importantes

API:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
DB_SSL=true
DB_SYNCHRONIZE=true
REDIS_URL=redis://...
FRONTEND_URL=https://smartdirect-crm.vercel.app
JWT_SECRET=...
JWT_EXPIRES_IN=7d
```

Web:

```env
VITE_API_URL=https://smartdirect-api.onrender.com/api
```

## Depois do primeiro deploy

1. Atualize `FRONTEND_URL` no Render com a URL real da Vercel.
2. Atualize `VITE_API_URL` na Vercel com a URL real da API Render.
3. Rode um redeploy nos dois servicos.
4. Teste register, login, contatos, pipeline, SAC e campanhas.

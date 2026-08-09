# Postman Collection

Coleção Postman gerada a partir da documentação Swagger/OpenAPI.

## Como importar

1. Abra o **Postman** (app ou web)
2. Clique em **Import**
3. Arraste o arquivo `api.postman_collection.json` ou selecione-o
4. A coleção será importada com todas as rotas configuradas

## Configuração

- **baseUrl**: URL base da API (padrão: `http://localhost:3000`)
- **accessToken**: Token JWT para autenticação (preenchido automaticamente após login)

## Regenerar a coleção

Se a API for atualizada e você exportar um novo `swagger.json`:

```bash
npm run generate:postman
```

A coleção será gerada em `postman/api.postman_collection.json`.

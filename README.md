<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Code Generation

This project includes a CLI for generating modules from Handlebars templates. The generated files follow the project's architecture and eliminate the manual work of writing boilerplate.

### Command

```bash
# simple mode
$ npm run generate:module <module-name>

# DDD mode (with entities, factory and repository)
$ npm run generate:module <module-name> -- --ddd
```

> The module name must be in **kebab-case** (e.g. `product-review`).

### Generation modes

| Artifact | Simple | DDD |
|---|:---:|:---:|
| `module.ts` | ✅ | ✅ |
| Response DTO | ✅ | ✅ |
| DAO interfaces + persistence module | ✅ | ✅ |
| Use cases (create, edit, delete, find-all, find-by-id) + specs | ✅ | ✅ |
| HTTP controller + spec | ✅ | ✅ |
| Prisma DAO + spec | ✅ | ✅ |
| Domain errors (not-found, already-exists) | ✅ | ✅ |
| Domain entity + spec | ❌ | ✅ |
| Domain factory + spec | ❌ | ✅ |
| Repository interface | ❌ | ✅ |
| Prisma repository + spec | ❌ | ✅ |

### Example

```bash
$ npm run generate:module order -- --ddd
```

Creates the full structure under `src/app/order/`.

### Post-generation steps

After running the script, complete the following steps:

1. **Dependency injection tokens** — add the entries to `src/core/di/token.ts`:

```typescript
OrderDao: Symbol.for('OrderDao'),
OrderRepository: Symbol.for('OrderRepository'), // DDD mode only
```

2. **Prisma model** — add the model to `prisma/schema/<module>.prisma` (generator and datasource live in `prisma/schema/schema.prisma`) with the base fields (`id`, `status`, `createdAt`, `updatedAt`) and run the migration:

```bash
$ npm run db:migration
```

3. **AppModule registration** — import the generated module in `src/app.module.ts`.

---

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

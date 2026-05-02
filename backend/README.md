# Spin Platform API

NestJS backend for a campaign-based spin wheel platform: Sequelize (sequelize-typescript) with MySQL, environment-based configuration, Sequelize CLI migrations, global validation and error handling, rate limiting, and structured feature modules.

## Prerequisites

- Node.js 20+ (LTS recommended)
- MySQL 8+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and adjust credentials:

```bash
cp .env.example .env
```

3. Create the database in MySQL (name must match `DB_NAME`, default `spin_platform`).

4. Run migrations:

```bash
npm run db:migrate
```

5. Start the API:

```bash
npm run start:dev
```

6. Health check: `GET http://localhost:3000/` returns `{ "message": "Spin Platform API is running" }`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Production build |
| `npm run start:prod` | Run compiled app |
| `npm run db:migrate` | Apply Sequelize migrations (TypeScript via `tsconfig.sequelize.json`) |
| `npm run db:migrate:undo` | Undo last migration |
| `npm run db:seed` | Run seeders |
| `npm test` / `npm run test:e2e` | Tests (e2e expects a reachable MySQL instance using `.env`) |

## Sequelize CLI

- Config: `config/config.js` (reads `.env`).
- Paths: `.sequelizerc` → `migrations/`, `seeders/`, `models/`.
- Add migrations: create a new file under `migrations/` following existing naming, or use `npx sequelize-cli migration:generate --name your-migration` from the project root.

## Architecture

- **Modules:** `src/modules/*` — auth, campaign, product, participation, spin, fraud, verification, fulfillment, notification (controllers + services ready for extension).
- **Database:** `src/database/database.module.ts` — global `SequelizeModule.forRootAsync`, `synchronize: false`, `autoLoadModels: true`.
- **Common:** `src/common/filters`, `guards`, `interceptors`, `middleware`.
- **Config:** `src/config` — env validation (`class-validator` / `class-transformer`) and Sequelize options builder.

## Security defaults

- Global `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform`.
- `@nestjs/throttler`: 30 requests per 60 seconds (per default tracker).
- `synchronize: false` — schema changes only through migrations.

## NestJS resources

- [NestJS documentation](https://docs.nestjs.com)
- [Sequelize migrations](https://sequelize.org/docs/v6/other-topics/migrations/)

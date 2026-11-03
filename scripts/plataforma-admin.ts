// Dá (ou tira) a administração da plataforma Coffee Break a uma conta que já existe.
// Só quem tem acesso ao banco consegue rodar: não existe tela nem rota para isso.
//
//   npm run plataforma:admin -- seu@email.com           dá a administração
//   npm run plataforma:admin -- seu@email.com --tirar   tira
//
// Usa o DATABASE_URL do .env (para produção, use a URL de produção).
import { existsSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env')
const { pool } = await import('../server/db.ts')

const email = process.argv[2]?.trim().toLowerCase()
const tirar = process.argv.includes('--tirar')
if (!email || !email.includes('@')) {
  console.error('Uso: npm run plataforma:admin -- seu@email.com [--tirar]')
  process.exit(1)
}

// O banco precisa já ter a versão nova do sistema (o servidor aplica o schema ao subir).
// A plataforma tem um único administrador: o banco recusa uma segunda conta com a marca.
const [r] = await pool
  .query<Record<string, unknown>[]>(
    'update usuarios set plataforma_admin = ?, sessao_versao = sessao_versao + 1 where lower(email) = ? returning nome, email',
    [!tirar, email],
  )
  .catch(async (err: { code?: string }) => {
    if (err.code !== '23505') throw err
    const [atual] = await pool.query<Record<string, unknown>[]>('select email from usuarios where plataforma_admin = true')
    console.error(
      `Já existe um administrador (${atual[0]?.email}). Tire a marca dele primeiro: npm run plataforma:admin -- ${atual[0]?.email} --tirar`,
    )
    process.exit(3)
  })
if (!r.length) {
  console.error(`Nenhuma conta com o e-mail ${email}. Crie a conta no site primeiro (Cadastrar minha padaria).`)
  process.exit(2)
}
console.log(
  tirar
    ? `Administração retirada de ${r[0].nome} (${r[0].email}).`
    : `${r[0].nome} (${r[0].email}) agora administra a plataforma. Entre de novo no site: o item "Administração" aparece no menu.`,
)
process.exit(0)

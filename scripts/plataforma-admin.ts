// Dá (ou tira) a administração da plataforma Coffee Break a uma conta que já existe.
// Só quem tem acesso ao banco consegue rodar: não existe tela nem rota para isso.
//
//   npm run plataforma:admin -- seu@email.com                dá a administração e deixa a conta
//                                                            só de administração (sem padaria)
//   npm run plataforma:admin -- seu@email.com --com-padaria  dá a administração e mantém a padaria
//   npm run plataforma:admin -- seu@email.com --tirar        tira
//
// Sem padaria: a padaria que foi criada só para abrir a conta (ex.: "Padaria Central") fica
// oculta da administração, se ninguém mais usa ela. Nada é apagado.
//
// Usa o DATABASE_URL do .env (para produção, use a URL de produção).
import { existsSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env')
const { pool, transaction } = await import('../server/db.ts')

const email = process.argv[2]?.trim().toLowerCase()
const tirar = process.argv.includes('--tirar')
const comPadaria = process.argv.includes('--com-padaria')
if (!email || !email.includes('@')) {
  console.error('Uso: npm run plataforma:admin -- seu@email.com [--com-padaria | --tirar]')
  process.exit(1)
}

type Linha = Record<string, unknown>

// O banco precisa já ter a versão nova do sistema (o servidor aplica o schema ao subir).
try {
  const resultado = await transaction(async (conn) => {
    const [[conta]] = await conn.query<Linha[]>('select id, nome, email, padaria_id from usuarios where lower(email) = ?', [email])
    if (!conta) return null
    // A plataforma tem um único administrador: o banco recusa uma segunda conta com a marca.
    await conn.query('update usuarios set plataforma_admin = ?, sessao_versao = sessao_versao + 1 where id = ?', [!tirar, conta.id])
    let ocultou: string | null = null
    if (!tirar && !comPadaria && conta.padaria_id) {
      await conn.query('update usuarios set padaria_id = null where id = ?', [conta.id])
      const [[outros]] = await conn.query<Linha[]>('select count(*)::int as n from usuarios where padaria_id = ?', [conta.padaria_id])
      if (Number(outros.n) === 0) {
        const [[p]] = await conn.query<Linha[]>(
          `update padarias set oculta = true where id = ? returning dados->>'nome_fantasia' as nome`,
          [conta.padaria_id],
        )
        ocultou = String(p?.nome ?? 'sem nome')
      }
    }
    return { conta, ocultou }
  })
  if (!resultado) {
    console.error(`Nenhuma conta com o e-mail ${email}. Crie a conta no site primeiro (Cadastrar minha padaria).`)
    process.exit(2)
  }
  const { conta, ocultou } = resultado
  if (tirar) {
    console.log(`Administração retirada de ${conta.nome} (${conta.email}).`)
  } else {
    console.log(`${conta.nome} (${conta.email}) agora administra a plataforma.`)
    if (!comPadaria) console.log('A conta ficou só de administração: ao entrar, abre direto o painel.')
    if (ocultou) console.log(`A padaria "${ocultou}" ficou oculta da administração (nada foi apagado).`)
    console.log('Entre de novo no site para ver a mudança.')
  }
  process.exit(0)
} catch (err) {
  if ((err as { code?: string }).code !== '23505') throw err
  const [atual] = await pool.query<Linha[]>('select email from usuarios where plataforma_admin = true')
  console.error(
    `Já existe um administrador (${atual[0]?.email}). Tire a marca dele primeiro: npm run plataforma:admin -- ${atual[0]?.email} --tirar`,
  )
  process.exit(3)
}

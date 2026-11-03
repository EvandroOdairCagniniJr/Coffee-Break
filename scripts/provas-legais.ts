// Dossiê de provas legais de uma pessoa: aceites dos Termos e da Política, assinaturas do
// contrato e o texto inteiro de cada versão aceita ou assinada, como estava na época.
// Para usar num pedido do Procon, num processo ou numa dúvida de um cliente.
//
//   npm run provas -- email@dacliente.com.br
//
// Lê o banco do DATABASE_URL do .env (use o de produção para casos reais). Só lê: não altera nada.
// O arquivo sai na pasta provas/, que não vai para o GitHub (tem dados pessoais).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env')
const { pool } = await import('../server/db.ts')

const email = process.argv[2]?.trim().toLowerCase()
if (!email || !email.includes('@')) {
  console.error('Uso: npm run provas -- email@da.pessoa')
  process.exit(1)
}

type Linha = Record<string, any>
const consulta = async (sql: string, params: unknown[]) => (await pool.query<Linha[]>(sql, params))[0]

const pessoas = await consulta(
  `select u.id, u.nome, u.email, u.papel, u.ativo, u.created_at, u.termos_versao, u.termos_aceitos_em,
          p.id as padaria_id, p.dados->>'nome_fantasia' as padaria, p.dados->>'cnpj' as padaria_cnpj
   from usuarios u left join padarias p on p.id = u.padaria_id where lower(u.email) = ?`,
  [email],
)
const ids = pessoas.map((p) => p.id)

// Busca também pelo e-mail copiado no registro: acha a prova mesmo se o e-mail da conta mudou.
const aceites = await consulta(
  `select * from aceites_termos where lower(email) = ? or usuario_id in (select jsonb_array_elements_text(?::jsonb)) order by aceito_em`,
  [email, JSON.stringify(ids)],
)
const assinaturas = await consulta(
  `select * from assinaturas_contrato where lower(email_conta) = ? or usuario_id in (select jsonb_array_elements_text(?::jsonb)) order by assinado_em`,
  [email, JSON.stringify(ids)],
)

const hashes = new Set<string>()
for (const a of aceites) {
  hashes.add(`termos:${a.hash_termos}`)
  hashes.add(`privacidade:${a.hash_privacidade}`)
}
for (const a of assinaturas) hashes.add(`contrato:${a.hash_contrato}`)
const documentos: Linha[] = []
for (const chave of hashes) {
  const [tipo, hash] = chave.split(':')
  const [doc] = await consulta('select tipo, versao, hash, publicado_em, texto from documentos_legais where tipo = ? and hash = ?', [
    tipo,
    hash,
  ])
  documentos.push(doc ?? { tipo, hash, aviso: 'Texto desta versão não encontrado no banco (anterior ao arquivamento).' })
}

if (!pessoas.length && !aceites.length && !assinaturas.length) {
  console.error(`Nada encontrado para ${email}.`)
  process.exit(2)
}

const dossie = {
  sobre:
    'Dossiê de provas do Coffee Break: aceites e assinaturas eletrônicas (MP 2.200-2/2001, art. 10, §2º; Lei 14.063/2020), ' +
    'com o texto exato de cada versão. O hash SHA-256 de cada texto confere com o hash gravado no aceite ou na assinatura.',
  gerado_em: new Date().toISOString(),
  email_pesquisado: email,
  contas: pessoas,
  aceites_dos_termos: aceites,
  assinaturas_do_contrato: assinaturas,
  documentos,
}

mkdirSync('provas', { recursive: true })
const arquivo = `provas/${email.replace(/[^a-z0-9@._-]/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`
writeFileSync(arquivo, JSON.stringify(dossie, null, 2))
console.log(`Dossiê salvo em ${arquivo}`)
console.log(`  ${aceites.length} aceite(s), ${assinaturas.length} assinatura(s), ${documentos.length} documento(s)`)
process.exit(0)

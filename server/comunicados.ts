// Comunicados da administração do Coffee Break para as padarias (faixa no topo do sistema).
import { Router } from 'express'
import type { RowDataPacket } from './db.ts'
import { pool } from './db.ts'
import type { Usuario } from './auth.ts'

export const comunicadosRouter = Router()

comunicadosRouter.get('/', async (_req, res) => {
  const u = res.locals.usuario as Usuario
  const publicos = u.papel === 'dono' ? ['todos', 'donos', 'gestao'] : u.papel === 'admin' ? ['todos', 'gestao'] : ['todos']
  const [linhas] = await pool.query<RowDataPacket[]>(
    `select id, titulo, texto, tom, created_at from plataforma_comunicados
     where ativo = true and (expira_em is null or expira_em > now()) and publico in (?)
     order by created_at desc limit 3`,
    [publicos],
  )
  res.json(linhas)
})

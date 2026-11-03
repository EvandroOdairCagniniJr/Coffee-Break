-- Coffee Break — schema PostgreSQL (Supabase). Aplicado automaticamente ao iniciar o servidor;
-- todas as instruções são idempotentes (rodar de novo não estraga nada).
--
-- Tudo fica no schema "padaria", FORA do schema public: a API automática do Supabase (PostgREST)
-- só expõe o public, então ninguém acessa estas tabelas pela URL do projeto. Como segunda trava,
-- todas têm RLS ligado sem políticas (só o servidor, que conecta como dono das tabelas, enxerga).
--
-- Multi-padaria: toda tabela de negócio tem padaria_id e toda consulta do servidor filtra por ele.
-- Ids são UUIDs gerados pelo servidor (texto). Dinheiro em numeric(10,2); datas/horas em timestamptz.

create schema if not exists padaria;
-- Nenhum papel além do dono usa o schema (anon/authenticated do Supabase ficam de fora).
revoke all on schema padaria from public;
set search_path to padaria;

-- Padarias (SaaS). dados = cadastro (nome, CNPJ, endereço...) em JSON.
-- codigo_convite: o funcionário informa em "Criar conta" para pedir acesso à equipe.
create table if not exists padarias (
  id text primary key,
  dados jsonb not null,
  codigo_convite char(8) not null unique,
  created_at timestamptz not null default now()
);

-- papel: dono (tudo + Equipe), admin (gerente: toda a operação), funcionario (PDV, estoque, produção).
create table if not exists usuarios (
  id text primary key,
  padaria_id text references padarias (id),
  nome varchar(255) not null default '',
  email varchar(255) not null unique,
  senha_hash varchar(255) not null,
  papel text not null default 'funcionario' check (papel in ('dono', 'admin', 'funcionario')),
  -- cargo: a função na padaria (Caixa, Padeiro(a)...), só para exibição.
  cargo varchar(60) not null default '',
  foto text,
  telefone varchar(11),
  cpf char(11),
  data_nascimento date,
  data_admissao date,
  turno text check (turno in ('manha', 'tarde', 'noite', 'madrugada', 'integral')),
  endereco jsonb,
  contato_emergencia jsonb,
  observacoes text,
  ativo boolean not null default true,
  ultimo_acesso timestamptz,
  -- Segurança: bloqueio após senhas erradas e versão da sessão (trocar a senha derruba logins).
  falhas_login int not null default 0,
  bloqueado_ate timestamptz,
  sessao_versao int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists usuarios_padaria_idx on usuarios (padaria_id);
-- Aceite dos Termos de Uso e da Política de Privacidade (LGPD): versão aceita e quando.
alter table usuarios add column if not exists termos_versao varchar(20);
alter table usuarios add column if not exists termos_aceitos_em timestamptz;

-- Assinatura eletrônica do contrato pelo dono (MP 2.200-2/2001, art. 10, §2º; Lei 14.063/2020):
-- nome digitado, conta, data e hora, IP, navegador, versão e hash SHA-256 do texto assinado.
-- Nunca é apagada nem alterada pelo sistema (é a prova do que foi combinado).
create table if not exists assinaturas_contrato (
  id text primary key,
  padaria_id text not null references padarias (id),
  usuario_id text not null references usuarios (id),
  versao varchar(20) not null,
  nome_assinado varchar(255) not null,
  hash_contrato char(64) not null,
  ip varchar(64),
  navegador varchar(255),
  assinado_em timestamptz not null default now()
);
create index if not exists assinaturas_contrato_padaria_idx on assinaturas_contrato (padaria_id, assinado_em);
create index if not exists assinaturas_contrato_usuario_idx on assinaturas_contrato (usuario_id);
-- Retrato de quem assinou, para a prova valer sozinha mesmo se a conta mudar depois.
alter table assinaturas_contrato add column if not exists email_conta varchar(255);
alter table assinaturas_contrato add column if not exists padaria_nome varchar(255);

-- Texto inteiro de cada versão publicada do contrato, dos Termos e da Política, com o hash.
-- O servidor grava ao subir (server/legal.ts); cada aceite e assinatura aponta para o hash.
create table if not exists documentos_legais (
  tipo varchar(20) not null,
  versao varchar(20) not null,
  hash char(64) not null,
  texto text not null,
  publicado_em timestamptz not null default now(),
  primary key (tipo, hash)
);

-- Histórico de todos os aceites dos Termos e da Política (cadastro, novo aceite, contrato).
-- Nome e e-mail ficam copiados: a prova continua de pé mesmo se a conta mudar.
create table if not exists aceites_termos (
  id text primary key,
  padaria_id text references padarias (id),
  usuario_id text references usuarios (id),
  nome varchar(255) not null,
  email varchar(255) not null,
  versao varchar(20) not null,
  hash_termos char(64) not null,
  hash_privacidade char(64) not null,
  origem varchar(20) not null,
  ip varchar(64),
  navegador varchar(255),
  aceito_em timestamptz not null default now()
);
create index if not exists aceites_termos_usuario_idx on aceites_termos (usuario_id, aceito_em);
create index if not exists aceites_termos_email_idx on aceites_termos (email);

-- Liberação da padaria pela administração do Coffee Break. Padarias que já existiam ficam
-- aprovadas (padrão da coluna); o cadastro novo (POST /auth/setup) entra como 'pendente'.
-- pendente → aprovada | recusada; recusada → pendente (nova análise) | aprovada;
-- aprovada → suspensa; suspensa → aprovada.
alter table padarias add column if not exists status varchar(20) not null default 'aprovada';
alter table padarias add column if not exists status_motivo text;
alter table padarias add column if not exists status_em timestamptz;
create index if not exists padarias_status_idx on padarias (status, created_at);

-- Administração da plataforma: só quem tem esta marca (dada pelo script
-- scripts/plataforma-admin.ts, direto no banco). Nunca aparece para dono nem para a equipe.
alter table usuarios add column if not exists plataforma_admin boolean not null default false;

-- Documentos que o dono envia para a análise (cartão CNPJ, alvará, documento pessoal...).
create table if not exists padaria_documentos (
  id text primary key,
  padaria_id text not null references padarias (id),
  enviado_por text references usuarios (id),
  descricao varchar(120) not null,
  nome_arquivo varchar(160) not null,
  tipo varchar(40) not null,
  tamanho integer not null,
  conteudo bytea not null,
  created_at timestamptz not null default now()
);
create index if not exists padaria_documentos_padaria_idx on padaria_documentos (padaria_id, created_at);

-- O que a administração fez em cada padaria (aprovar, recusar, suspender...). Nunca é apagado.
create table if not exists plataforma_acoes (
  id text primary key,
  admin_id text not null references usuarios (id),
  padaria_id text not null references padarias (id),
  acao varchar(20) not null,
  status_anterior varchar(20),
  status_novo varchar(20) not null,
  motivo text,
  ip varchar(64),
  created_at timestamptz not null default now()
);
create index if not exists plataforma_acoes_padaria_idx on plataforma_acoes (padaria_id, created_at);
-- O histórico também guarda ações sobre pessoas e comunicados (sem padaria ou sem mudança de status).
alter table plataforma_acoes alter column padaria_id drop not null;
alter table plataforma_acoes alter column status_novo drop not null;
alter table plataforma_acoes add column if not exists alvo_usuario_id text references usuarios (id);
create index if not exists plataforma_acoes_data_idx on plataforma_acoes (created_at);

-- Um único administrador da plataforma: o banco recusa uma segunda conta com a marca.
create unique index if not exists usuarios_um_admin_idx on usuarios ((true)) where plataforma_admin;

-- Anotações internas da administração sobre cada padaria (o dono nunca vê).
create table if not exists plataforma_notas (
  id text primary key,
  padaria_id text not null references padarias (id),
  admin_id text not null references usuarios (id),
  texto text not null,
  created_at timestamptz not null default now()
);
create index if not exists plataforma_notas_padaria_idx on plataforma_notas (padaria_id, created_at);

-- Comunicados da administração para as padarias (faixa no topo do sistema).
create table if not exists plataforma_comunicados (
  id text primary key,
  titulo varchar(120) not null,
  texto varchar(600) not null,
  tom varchar(20) not null default 'info',
  publico varchar(20) not null default 'todos',
  ativo boolean not null default true,
  expira_em timestamptz,
  criado_por text references usuarios (id),
  created_at timestamptz not null default now()
);
create index if not exists plataforma_comunicados_ativo_idx on plataforma_comunicados (ativo, created_at);

-- Provas não se alteram: o banco recusa update e delete nessas três tabelas.
create or replace function bloquear_alteracao_prova() returns trigger language plpgsql as $$
begin
  raise exception 'Registro legal (%): não pode ser alterado nem apagado', tg_table_name;
end $$;
drop trigger if exists assinaturas_contrato_imutavel on assinaturas_contrato;
create trigger assinaturas_contrato_imutavel before update or delete on assinaturas_contrato
  for each row execute function bloquear_alteracao_prova();
drop trigger if exists aceites_termos_imutavel on aceites_termos;
create trigger aceites_termos_imutavel before update or delete on aceites_termos
  for each row execute function bloquear_alteracao_prova();
drop trigger if exists plataforma_acoes_imutavel on plataforma_acoes;
create trigger plataforma_acoes_imutavel before update or delete on plataforma_acoes
  for each row execute function bloquear_alteracao_prova();
drop trigger if exists documentos_legais_imutavel on documentos_legais;
create trigger documentos_legais_imutavel before update or delete on documentos_legais
  for each row execute function bloquear_alteracao_prova();
create index if not exists usuarios_cpf_idx on usuarios (cpf) where cpf is not null;

create table if not exists produtos (
  id text primary key,
  padaria_id text not null references padarias (id),
  nome varchar(255) not null,
  categoria varchar(255),
  -- Variedade de: produtos com o mesmo grupo (ex.: "Café") viram um card só no PDV.
  grupo varchar(80),
  unidade varchar(20) not null default 'un',
  preco_venda numeric(10, 2) not null check (preco_venda >= 0),
  preco_custo numeric(10, 2) check (preco_custo >= 0),
  estoque_atual numeric(10, 3) not null default 0,
  estoque_minimo numeric(10, 3) not null default 0,
  ativo boolean not null default true,
  emoji varchar(16),
  foto text,
  created_at timestamptz not null default now()
);
create index if not exists produtos_padaria_idx on produtos (padaria_id);

create table if not exists movimentacoes_estoque (
  id text primary key,
  padaria_id text not null,
  produto_id text not null references produtos (id),
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste')),
  quantidade numeric(10, 3) not null,
  motivo varchar(255),
  created_at timestamptz not null default now(),
  created_by text references usuarios (id)
);
create index if not exists movimentacoes_padaria_idx on movimentacoes_estoque (padaria_id, created_at);
create index if not exists movimentacoes_created_by_idx on movimentacoes_estoque (created_by, created_at);
create index if not exists movimentacoes_produto_idx on movimentacoes_estoque (produto_id);

-- Caixa (gaveta) de cada operador: abertura com fundo de troco, sangrias/suprimentos e fechamento.
create table if not exists caixas (
  id text primary key,
  padaria_id text not null,
  operador_id text not null references usuarios (id),
  aberto_em timestamptz not null default now(),
  fundo_troco numeric(10, 2) not null default 0,
  fechado_em timestamptz,
  -- Fechamento: o que o sistema esperava e o que foi contado, por forma de pagamento.
  esperado jsonb,
  contado jsonb,
  diferenca numeric(10, 2),
  observacoes varchar(500)
);
create index if not exists caixas_padaria_idx on caixas (padaria_id, aberto_em);
create index if not exists caixas_operador_idx on caixas (operador_id, fechado_em);

-- status: concluida | devolvida (devolvida não entra em nenhum total; o estoque já voltou).
create table if not exists vendas (
  id text primary key,
  padaria_id text not null,
  total numeric(10, 2) not null check (total >= 0),
  forma_pagamento text not null
    check (forma_pagamento in ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix')),
  -- Quanto o cliente entregou em dinheiro (para o troco na 2ª via do comprovante).
  valor_recebido numeric(10, 2),
  status varchar(20) not null default 'concluida',
  devolvida_em timestamptz,
  devolvida_por text,
  motivo_devolucao varchar(255),
  desconto_promocoes numeric(10, 2) not null default 0,
  desconto_manual numeric(10, 2) not null default 0,
  caixa_id text,
  created_at timestamptz not null default now(),
  created_by text references usuarios (id)
);
create index if not exists vendas_padaria_data_idx on vendas (padaria_id, created_at);
create index if not exists vendas_created_by_idx on vendas (created_by, created_at);
create index if not exists vendas_caixa_idx on vendas (caixa_id);

create table if not exists vendas_itens (
  id text primary key,
  venda_id text not null references vendas (id) on delete cascade,
  produto_id text not null references produtos (id),
  quantidade numeric(10, 3) not null check (quantidade > 0),
  preco_unitario numeric(10, 2) not null check (preco_unitario >= 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  -- Desconto do item (promoção e parte do desconto manual) e a promoção aplicada.
  desconto numeric(10, 2) not null default 0,
  promocao_id text
);
create index if not exists vendas_itens_venda_idx on vendas_itens (venda_id);
create index if not exists vendas_itens_produto_idx on vendas_itens (produto_id);

create table if not exists contas_financeiras (
  id text primary key,
  padaria_id text not null,
  tipo text not null check (tipo in ('pagar', 'receber')),
  descricao varchar(255) not null,
  categoria varchar(255),
  valor numeric(10, 2) not null check (valor >= 0),
  data_vencimento date not null,
  data_pagamento date,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  forma_pagamento varchar(50),
  observacoes text,
  created_at timestamptz not null default now(),
  created_by text references usuarios (id)
);
create index if not exists contas_padaria_idx on contas_financeiras (padaria_id, data_vencimento);

create table if not exists receitas (
  id text primary key,
  padaria_id text not null,
  produto_id text not null references produtos (id),
  nome varchar(255) not null,
  rendimento numeric(10, 3) not null check (rendimento > 0),
  modo_preparo text,
  created_at timestamptz not null default now()
);
create index if not exists receitas_padaria_idx on receitas (padaria_id);
create index if not exists receitas_produto_idx on receitas (produto_id);

create table if not exists receita_itens (
  id text primary key,
  receita_id text not null references receitas (id) on delete cascade,
  ingrediente_id text not null references produtos (id),
  quantidade numeric(10, 3) not null check (quantidade > 0)
);
create index if not exists receita_itens_receita_idx on receita_itens (receita_id);
create index if not exists receita_itens_ingrediente_idx on receita_itens (ingrediente_id);

create table if not exists producoes (
  id text primary key,
  padaria_id text not null,
  receita_id text not null references receitas (id),
  data date not null,
  status text not null default 'planejado' check (status in ('planejado', 'concluido', 'cancelado')),
  observacoes text,
  created_at timestamptz not null default now(),
  created_by text references usuarios (id),
  concluida_em timestamptz,
  concluida_por text references usuarios (id)
);
create index if not exists producoes_padaria_idx on producoes (padaria_id, data);
create index if not exists producoes_receita_idx on producoes (receita_id);
create index if not exists producoes_concluida_por_idx on producoes (concluida_por, concluida_em);

-- Configurações por padaria (ex.: meta de CMV).
create table if not exists padaria_config (
  padaria_id text not null,
  chave varchar(60) not null,
  valor text not null,
  primary key (padaria_id, chave)
);

-- Foto de uma categoria de produto, por padaria.
create table if not exists categorias_fotos (
  padaria_id text not null,
  nome varchar(255) not null,
  foto text not null,
  primary key (padaria_id, nome)
);

-- Histórico de mudanças de perfil (nome, cargo, papel, foto).
create table if not exists historico_perfil (
  id text primary key,
  padaria_id text,
  usuario_id text not null references usuarios (id),
  campo text not null check (campo in ('nome', 'cargo', 'papel', 'foto')),
  valor_antigo varchar(255),
  valor_novo varchar(255),
  alterado_por text references usuarios (id),
  created_at timestamptz not null default now()
);
create index if not exists historico_perfil_padaria_idx on historico_perfil (padaria_id, created_at);
create index if not exists historico_perfil_usuario_idx on historico_perfil (usuario_id);

-- Esqueci minha senha: código de 6 dígitos (só o hash), 15 minutos, poucas tentativas.
create table if not exists codigos_senha (
  usuario_id text primary key references usuarios (id) on delete cascade,
  codigo_hash char(64) not null,
  expira_em timestamptz not null,
  tentativas int not null default 0,
  created_at timestamptz not null default now()
);

-- Metas de vendas. alvo: 'geral' (padaria toda), 'pessoa' (padrão da equipe) ou id de usuário.
create table if not exists metas (
  padaria_id text not null,
  alvo varchar(36) not null,
  periodo text not null check (periodo in ('dia', 'semana', 'mes')),
  valor numeric(12, 2) not null check (valor > 0),
  primary key (padaria_id, alvo, periodo)
);

-- Perdas (sobra, vencido, queimado...). custo_unitario = preço de custo no momento.
create table if not exists perdas (
  id text primary key,
  padaria_id text not null,
  produto_id text not null references produtos (id),
  quantidade numeric(10, 3) not null check (quantidade > 0),
  motivo text not null check (motivo in ('sobra', 'vencido', 'queimado', 'quebra', 'outro')),
  observacao varchar(255),
  custo_unitario numeric(10, 2) not null default 0,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists perdas_padaria_data_idx on perdas (padaria_id, created_at);
create index if not exists perdas_produto_idx on perdas (produto_id);

-- Encomendas: número sequencial por padaria, sinal e status. Ao entregar vira venda (venda_id).
create table if not exists encomendas (
  id text primary key,
  padaria_id text not null,
  numero int not null,
  cliente_nome varchar(120) not null,
  cliente_telefone varchar(11),
  retirada_em timestamptz not null,
  entrega boolean not null default false,
  endereco varchar(255),
  status text not null default 'reservada'
    check (status in ('reservada', 'confirmada', 'em_producao', 'pronta', 'entregue', 'cancelada')),
  total numeric(10, 2) not null default 0,
  sinal numeric(10, 2) not null default 0,
  forma_sinal text check (forma_sinal in ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix')),
  observacoes text,
  venda_id text,
  caixa_sinal_id text,
  created_by text,
  created_at timestamptz not null default now(),
  unique (padaria_id, numero)
);
create index if not exists encomendas_retirada_idx on encomendas (padaria_id, retirada_em);
create index if not exists encomendas_venda_idx on encomendas (venda_id);
create index if not exists encomendas_caixa_sinal_idx on encomendas (caixa_sinal_id) where caixa_sinal_id is not null;

create table if not exists encomendas_itens (
  id text primary key,
  encomenda_id text not null references encomendas (id) on delete cascade,
  produto_id text not null references produtos (id),
  quantidade numeric(10, 3) not null check (quantidade > 0),
  preco_unitario numeric(10, 2) not null check (preco_unitario >= 0),
  subtotal numeric(10, 2) not null
);
create index if not exists encomendas_itens_encomenda_idx on encomendas_itens (encomenda_id);
create index if not exists encomendas_itens_produto_idx on encomendas_itens (produto_id);

create table if not exists caixa_movimentos (
  id text primary key,
  padaria_id text not null,
  caixa_id text not null references caixas (id) on delete cascade,
  tipo text not null check (tipo in ('sangria', 'suprimento')),
  valor numeric(10, 2) not null check (valor > 0),
  motivo varchar(255),
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists caixa_movimentos_caixa_idx on caixa_movimentos (caixa_id);

-- Promoções automáticas: %, R$ por unidade, preço fixo ou leve X pague Y; com período,
-- dias da semana (0 = domingo) e horário.
create table if not exists promocoes (
  id text primary key,
  padaria_id text not null,
  nome varchar(80) not null,
  tipo text not null check (tipo in ('percentual', 'valor', 'preco_fixo', 'leve_pague')),
  valor numeric(10, 2) not null default 0,
  leve int,
  pague int,
  abrangencia text not null check (abrangencia in ('produtos', 'categorias', 'tudo')),
  alvos jsonb,
  inicio timestamptz,
  fim timestamptz,
  dias_semana jsonb,
  hora_inicio char(5),
  hora_fim char(5),
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists promocoes_padaria_idx on promocoes (padaria_id);

-- Registro de acessos (logins, falhas, bloqueios, recuperação e troca de senha).
create table if not exists log_acessos (
  id text primary key,
  padaria_id text,
  usuario_id text,
  email varchar(255),
  evento varchar(30) not null,
  ip varchar(64),
  navegador varchar(255),
  created_at timestamptz not null default now()
);
create index if not exists log_acessos_padaria_idx on log_acessos (padaria_id, created_at);

-- Chaves estrangeiras que faltavam (achadas na engenharia reversa do banco, out/2026): o banco passa
-- a recusar, por exemplo, uma venda de uma padaria que não existe. Criadas uma vez; se alguma falhar
-- (dado antigo inconsistente), o servidor avisa no log e sobe mesmo assim.
-- log_acessos fica sem FK de propósito: o registro de acesso não pode depender de outras tabelas.
do $$
declare
  fk record;
begin
  for fk in
    select * from (values
      ('caixa_movimentos', 'padaria_id', 'padarias', ''),
      ('caixas', 'padaria_id', 'padarias', ''),
      ('categorias_fotos', 'padaria_id', 'padarias', ''),
      ('contas_financeiras', 'padaria_id', 'padarias', ''),
      ('encomendas', 'padaria_id', 'padarias', ''),
      ('historico_perfil', 'padaria_id', 'padarias', ''),
      ('metas', 'padaria_id', 'padarias', ''),
      ('movimentacoes_estoque', 'padaria_id', 'padarias', ''),
      ('padaria_config', 'padaria_id', 'padarias', ''),
      ('perdas', 'padaria_id', 'padarias', ''),
      ('producoes', 'padaria_id', 'padarias', ''),
      ('promocoes', 'padaria_id', 'padarias', ''),
      ('receitas', 'padaria_id', 'padarias', ''),
      ('vendas', 'padaria_id', 'padarias', ''),
      ('vendas', 'caixa_id', 'caixas', ''),
      ('vendas', 'devolvida_por', 'usuarios', ''),
      ('encomendas', 'venda_id', 'vendas', ''),
      ('encomendas', 'caixa_sinal_id', 'caixas', ''),
      ('encomendas', 'created_by', 'usuarios', ''),
      ('perdas', 'created_by', 'usuarios', ''),
      ('caixa_movimentos', 'created_by', 'usuarios', ''),
      -- Promoção apagada: a venda antiga continua, só perde o vínculo.
      ('vendas_itens', 'promocao_id', 'promocoes', 'on delete set null')
    ) as v(tabela, coluna, referencia, extra)
  loop
    if not exists (
      select 1 from pg_constraint
      where conname = fk.tabela || '_' || fk.coluna || '_fkey' and connamespace = 'padaria'::regnamespace
    ) then
      begin
        execute format(
          'alter table padaria.%I add constraint %I foreign key (%I) references padaria.%I (id) %s',
          fk.tabela, fk.tabela || '_' || fk.coluna || '_fkey', fk.coluna, fk.referencia, fk.extra
        );
      exception when others then
        raise warning 'FK %.% não criada: %', fk.tabela, fk.coluna, sqlerrm;
      end;
    end if;
  end loop;
end $$;

-- Segunda trava: RLS em todas as tabelas, sem políticas. O servidor conecta como dono das
-- tabelas (que ignora o RLS); qualquer outro papel do Supabase (anon, authenticated) não lê nada.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'padaria' loop
    execute format('alter table padaria.%I enable row level security', t);
  end loop;
end $$;

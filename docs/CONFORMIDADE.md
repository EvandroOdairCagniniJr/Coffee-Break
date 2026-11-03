# Conformidade legal: Coffee Break

Situação em **3 de novembro de 2026**. Responsável: Evandro Odair Cagnini Junior, MEI, CNPJ 63.702.108/0001-46. Contato de privacidade: evandroodaircagninijr@gmail.com.

> Este checklist organiza as obrigações que se aplicam a um sistema online de gestão (SaaS) no Brasil e mostra como o Coffee Break as atende. Ele **não substitui** um advogado e um contador: os textos legais e as decisões marcadas com 👤 devem ser revisados por eles.

Legenda: ✅ atendido no sistema · ⚠️ falta fazer · 👤 depende do responsável (você, contador ou advogado)

## 1. LGPD: Lei Geral de Proteção de Dados (Lei 13.709/2018)

| Exigência | Situação | Onde |
|---|---|---|
| Informar quem é o responsável, a finalidade, a base legal, o compartilhamento, a retenção e os direitos (art. 9º) | ✅ | `/privacidade` |
| Contrato assinado pelo dono (MP 2.200-2/2001, art. 10, §2º; Lei 14.063/2020) | ✅ Assinatura eletrônica simples: nome digitado, data e hora, IP, navegador, versão e hash SHA-256 do texto. Nova versão do contrato pede nova assinatura | `server/legal.ts`, `assinaturas_contrato`, `/contrato` |
| Análise e liberação da padaria (CDC, art. 6º, III; contrato, cláusula 10) | ✅ Padaria nova só usa o sistema depois da liberação; recusa e suspensão sempre com motivo visível ao dono e direito de contestar; documentos só para a administração, apagados 6 meses depois de recusa não corrigida; cada decisão fica num histórico imutável | `server/plataforma.ts`, `server/liberacao.ts`, `plataforma_acoes` |
| Guardar a prova do que foi aceito e assinado | ✅ Texto inteiro de cada versão do contrato, dos Termos e da Política no banco (`documentos_legais`), histórico de todos os aceites (`aceites_termos`), com nome, e-mail, IP e navegador. O banco recusa alterar ou apagar essas tabelas. Dossiê de uma pessoa: `npm run provas -- email` | `server/schema.sql`, `scripts/provas-legais.ts` |
| Registrar a ciência e o aceite, e poder provar (art. 8º, §2º) | ✅ Aceite com data e versão no cadastro; novo aceite quando a versão muda | `server/legal.ts`, `usuarios.termos_*` |
| Canal com o titular, ou encarregado (art. 41; Res. CD/ANPD 2/2022 para pequeno porte) | ✅ E-mail publicado nos Termos, na Política e no perfil | `src/lib/empresa.ts` |
| Acesso e portabilidade (art. 18, II e V) | ✅ "Baixar meus dados" no perfil | `GET /api/legal/meus-dados` |
| Correção (art. 18, III) | ✅ No próprio perfil; o dono corrige em Equipe | Perfil, Equipe |
| Eliminação, anonimização e oposição (art. 18, IV e VI) | 👤 Pedido pelo e-mail, resposta em até 15 dias (art. 19). Exclusão manual pelo responsável | Política, item 10 |
| Minimização (art. 6º, III) | ✅ Dados da equipe opcionais; nenhum dado sensível; CPF repetido não revela o titular | Cadastros |
| Segurança (art. 46) | ✅ HTTPS e HSTS, TLS verificado até o banco, senhas com bcrypt, isolamento entre padarias, papéis, bloqueio por tentativas, 180 testes, Checagem do GitHub, Dependabot, bloqueio de senhas no código | `docs/TESTES.md`, `.github/` |
| Papéis de controlador e operador | ✅ Definidos nos Termos (item 6) e na Política (item 2): a padaria é controladora dos dados da equipe e dos clientes, e o Coffee Break é operador | `/termos`, `/privacidade` |
| Transferência internacional (art. 33; Res. CD/ANPD 19/2024) | ⚠️👤 Informada na Política, mas faltam as cláusulas-padrão da ANPD (ver ação 2) | Render e Supabase nos EUA |
| Registro das operações de tratamento (art. 37) | ⚠️ Modelo abaixo, a manter atualizado | Item 6 deste documento |
| Comunicação de incidente (art. 48; Res. CD/ANPD 15/2024) | ⚠️ Plano abaixo. Prazo geral de 3 dias úteis; agente de pequeno porte pode ter prazo em dobro (confirmar no texto oficial) | Item 7 deste documento |

## 2. Marco Civil da Internet (Lei 12.965/2014)

| Exigência | Situação |
|---|---|
| Guardar os registros de acesso à aplicação (IP, data e hora) por **6 meses**, com sigilo (art. 15) | ✅ Entradas, falhas de login e trocas de senha com IP, data e hora, guardadas por **1 ano** e apagadas depois. Só o dono vê os acessos da própria padaria |
| Informar de forma clara a coleta e o uso de dados (art. 7º) | ✅ Política de Privacidade e aceite |
| Cookies | ✅ Só um cookie essencial de sessão (dispensa banner de consentimento) e preferências no navegador, tudo informado na Política, item 5 |

## 3. Código de Defesa do Consumidor e comércio eletrônico (Lei 8.078/1990; Decreto 7.962/2013)

| Exigência | Situação |
|---|---|
| Identificar quem oferece: nome, CNPJ e contato (Decreto 7.962, art. 2º) | ✅ Rodapé dos Termos e da Política |
| Regras claras de uso, preço e encerramento | ✅ Termos, itens 3, 4, 7 e 11 |
| Ao começar a cobrar: preço, forma de pagamento, recibo, cancelamento e **direito de arrependimento de 7 dias** em contratação online (CDC, art. 49) | ⚠️👤 Hoje o uso é gratuito. Atualizar os Termos **antes** de cobrar |

## 4. Fiscal

| Tema | Situação |
|---|---|
| Comprovante do sistema | ✅ "Documento sem valor fiscal" no comprovante (imagem, PDF e texto) |
| NFC-e e NF-e da padaria, incluindo os campos de **IBS e CBS da reforma tributária** (testes em 2026; Simples Nacional a partir de 2027, conforme as fontes consultadas) | ✅ Aviso nos Termos (item 5) e em Minha padaria. A emissão é **obrigação da padaria**, no sistema fiscal indicado pelo contador. 👤 Integrar emissão de NFC-e é um item do roadmap |
| Seu MEI pode oferecer software (SaaS)? | ⚠️👤 **Confirmar com o contador**: o MEI só pode exercer as ocupações da lista do Simples Nacional, e licenciamento ou desenvolvimento de software costuma ficar de fora. Pode ser preciso migrar para ME no Simples Nacional antes de cobrar |
| Nota fiscal do seu serviço | 👤 Quando houver cobrança: emitir NFS-e (padrão nacional) para cada assinatura |

## 5. Propriedade intelectual e acessibilidade

| Tema | Situação |
|---|---|
| Marca "Coffee Break" | ⚠️👤 É um termo comum: fazer **busca de anterioridade no INPI** e registrar (por exemplo, classes 9 e 42) antes de investir na marca |
| Software (Lei 9.609/1998) | ✅ Licença proprietária no repositório. Registro no INPI é opcional (serve como prova de autoria) |
| Acessibilidade (Lei 13.146/2015, art. 63) | ⚠️ Boa base (contraste, foco, legendas nos vídeos). Fazer auditoria WCAG 2.1 AA e corrigir |

## 6. Registro das operações de tratamento (art. 37): modelo

| Operação | Dados | Titulares | Finalidade | Base legal | Retenção | Operadores |
|---|---|---|---|---|---|---|
| Conta e login | nome, e-mail, hash da senha, foto, cargo, papel | donos e equipe | prestar o serviço | contrato (art. 7º, V) | enquanto a conta existir | Render, Supabase |
| Registros de acesso | IP, navegador, data e hora, evento | todos os usuários | segurança e Marco Civil | obrigação legal e legítimo interesse | 1 ano | Render, Supabase |
| Cadastro da equipe (pela padaria) | telefone, CPF, nascimento, endereço, contato de emergência | funcionários | gestão da equipe | definida pela padaria (controladora) | enquanto a padaria quiser | Render, Supabase |
| Encomendas | nome, telefone, endereço de entrega | clientes da padaria | entregar o pedido | definida pela padaria (controladora) | enquanto a padaria quiser | Render, Supabase |
| Recuperação de senha | e-mail, código (hash) | usuários | acesso à conta | contrato | 15 minutos | provedor de e-mail |
| Busca de CEP | CEP | quem preenche endereço | preencher endereço | contrato | não guardado pelo serviço | ViaCEP |

Atualize esta tabela sempre que o sistema passar a coletar um dado novo ou a usar um fornecedor novo.

## 7. Plano de resposta a incidente de segurança

1. **Conter:** trocar a senha do banco (Supabase), a `JWT_SECRET` (derruba todos os logins) e as chaves envolvidas. Se preciso, voltar a versão no Render.
2. **Avaliar:** quais dados, de quais padarias e pessoas, desde quando. Use os logs do Render e o `log_acessos`.
3. **Comunicar:** se houver **risco ou dano relevante**, avisar a **ANPD** pelo formulário oficial (gov.br/anpd) e as **pessoas afetadas**, em até **3 dias úteis** (confirmar se o prazo em dobro de agente de pequeno porte se aplica), com: o que aconteceu, quais dados, riscos, medidas tomadas e contato.
4. **Registrar:** escrever o pós-morte em `docs/incidentes/` (modelo: `2026-10-29-banco-lotado.md`) e guardar as evidências.

## 8. Ações em ordem de prioridade

1. 👤 **Contador:** confirmar se o MEI pode oferecer SaaS e planejar a emissão de NFS-e **antes de cobrar**.
2. ⚠️👤 **Transferência internacional:** aceitar os contratos de proteção de dados (DPA) do Render e do Supabase, incluir as cláusulas-padrão da ANPD (Res. 19/2024) **ou** migrar o banco para a região **São Paulo** do Supabase (grátis ao criar um projeto novo).
3. 👤 **Advogado:** revisar os Termos de Uso e a Política de Privacidade.
4. ⚠️👤 **INPI:** busca e registro da marca "Coffee Break".
5. ⚠️ **Backup** diário criptografado do banco (continuidade e segurança, LGPD art. 46).
6. ⚠️ Auditoria de **acessibilidade** WCAG 2.1 AA.
7. ⚠️ **Antes de cobrar:** atualizar os Termos com preço, pagamento, cancelamento e arrependimento de 7 dias.

## 9. Como manter em dia (toda mudança no sistema)

Antes de publicar qualquer funcionalidade nova, responda:

- [ ] Coleta **dado pessoal novo** ou muda a finalidade? → atualizar a Política, a tabela do item 6 e a **versão dos termos** (`server/legal.ts` e `src/lib/empresa.ts`). A troca de versão pede novo aceite a todos.
- [ ] Usa **fornecedor ou serviço externo novo** (e-mail, pagamento, IA, mapa)? → listar na Política (item 6) e avaliar a transferência internacional.
- [ ] Cria **cookie** ou rastreamento que não é essencial? → exige consentimento (banner).
- [ ] Mexe em **dinheiro, preço ou cobrança**? → CDC, Decreto 7.962 e fiscal (NFS-e, NFC-e, IBS e CBS).
- [ ] Mexe em **segurança ou acesso**? → `npm run teste` (180) e Checagem do GitHub verdes.
- [ ] A release cita o que mudou nos documentos legais.

## Fontes consultadas (novembro de 2026)

- Resoluções da ANPD em vigor e regime de pequeno porte: [Confidata](https://confidata.com.br/blog/resolucoes-anpd-dpo-2026), [LegalBR](https://legalbr.com.br/regulamento-da-lgpd/), [Global Suite](https://www.globalsuitesolutions.com/pt/lgpd/). Confirmar os prazos no site oficial da ANPD (gov.br/anpd).
- Reforma tributária no varejo (IBS e CBS na NFC-e): [Central do Varejo](https://centraldovarejo.com.br/ibs-e-cbs-o-que-muda-para-o-varejo-na-reforma-tributaria/), [Tax Group](https://www.taxgroup.com.br/intelligence/reforma-tributaria-2026-guia-completo-sobre-o-que-muda-e-a-transicao/), [Acerto de Contas](https://acertodecontas.blog.br/nfce-reforma-tributaria-pequeno-varejo-2026/).
- Termos e política em serviços online: [Jus.com.br](https://jus.com.br/artigos/73374/qual-a-importancia-da-politica-de-privacidade-e-termos-de-uso).
- Leis no texto oficial: LGPD (Lei 13.709/2018), Marco Civil (Lei 12.965/2014), CDC (Lei 8.078/1990), Decreto 7.962/2013, Lei 13.146/2015, Lei 9.609/1998 e Lei 9.279/1996, em planalto.gov.br.

## Serviços externos usados pelo sistema

| Serviço | Para quê | Dado pessoal enviado |
|---|---|---|
| Google Notícias (RSS público) | Manchetes do setor no Guia e dicas, buscadas pelo servidor e guardadas por 1 hora | Nenhum |
| GitHub (API pública de releases) | Novidades do Coffee Break no Guia e dicas | Nenhum |
| E-mail de suporte (mailto) | Dúvidas enviadas pelo próprio aplicativo de e-mail da pessoa; o sistema não guarda a mensagem | Só o que a pessoa escolher mandar, direto para o e-mail do responsável |
| Microsoft Edge TTS (edge-tts) | Só para gerar a narração dos vídeos, no computador do responsável | Nenhum (só o roteiro do vídeo) |

Referências oficiais (leis e guias da ANPD) ficam em [docs/referencias](referencias/README.md).

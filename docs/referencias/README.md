# Referências legais do Coffee Break

Cópias dos textos oficiais que o sistema precisa seguir, baixadas em 3 de novembro de 2026.
O que cada lei exige e onde o sistema atende está em [CONFORMIDADE.md](../CONFORMIDADE.md).
Antes de citar um artigo, confira a versão atual no site oficial: as leis mudam.

## Leis e normas

| Arquivo | O que é | Por que importa para o Coffee Break | Fonte oficial |
|---|---|---|---|
| [lei-13709-lgpd.htm](lei-13709-lgpd.htm) | LGPD, Lei 13.709/2018 (compilada) | Dados pessoais de donos, equipe e clientes: base legal, direitos do titular, segurança, incidentes | [planalto.gov.br](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm) |
| [resolucao-anpd-2-2022-pequeno-porte.htm](resolucao-anpd-2-2022-pequeno-porte.htm) | Resolução CD/ANPD 2/2022 | Regras mais simples para MEI e pequenas empresas (encarregado, prazos, registro) | [in.gov.br](https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-2-de-27-de-janeiro-de-2022-376562019) |
| [lei-12965-marco-civil.htm](lei-12965-marco-civil.htm) | Marco Civil da Internet, Lei 12.965/2014 | Guarda dos registros de acesso por 6 meses (o sistema guarda 1 ano) | [planalto.gov.br](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm) |
| [lei-8078-cdc.htm](lei-8078-cdc.htm) | Código de Defesa do Consumidor (compilado) | Cláusulas abusivas são nulas (art. 51), informação clara, oferta vincula | [planalto.gov.br](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm) |
| [decreto-7962-comercio-eletronico.htm](decreto-7962-comercio-eletronico.htm) | Decreto 7.962/2013 | Identificação do fornecedor (nome, CNPJ, contato) e atendimento em serviço online | [planalto.gov.br](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm) |
| [mp-2200-2-assinatura-digital.htm](mp-2200-2-assinatura-digital.htm) | MP 2.200-2/2001 | Validade da assinatura eletrônica do contrato (art. 10, §2º) | [planalto.gov.br](https://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm) |
| [lei-14063-assinatura-eletronica.htm](lei-14063-assinatura-eletronica.htm) | Lei 14.063/2020 | Tipos de assinatura eletrônica (simples, avançada, qualificada) | [planalto.gov.br](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14063.htm) |
| [lei-13146-acessibilidade-lbi.htm](lei-13146-acessibilidade-lbi.htm) | Lei Brasileira de Inclusão, Lei 13.146/2015 | Acessibilidade em sites e sistemas (art. 63) | [planalto.gov.br](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm) |

## Guias da ANPD

| Arquivo | O que é |
|---|---|
| [anpd-guia-seguranca-pequeno-porte.pdf](anpd-guia-seguranca-pequeno-porte.pdf) | Guia Orientativo de Segurança da Informação para Agentes de Tratamento de Pequeno Porte (ANPD, out. 2021, 21 páginas), cópia publicada pelo TCE-PB |
| [anpd-processo-do-guia-seguranca.pdf](anpd-processo-do-guia-seguranca.pdf) | Processo da ANPD que aprovou o guia (220 páginas), do site gov.br |

## O que o guia de segurança da ANPD pede, e como estamos

| Recomendação | Situação no Coffee Break |
|---|---|
| Controle de acesso com papéis e menor privilégio | ✅ Dono, gerente e funcionário, com rotas protegidas |
| Senhas com regra mínima e sem senha padrão | ✅ Mínimo de 8 caracteres com letras e números, guardadas com bcrypt |
| Não compartilhar contas | ✅ Cada pessoa tem o próprio login; "Sair de todos os aparelhos" |
| Registro do que foi feito (auditoria) | ✅ Registros de acesso, histórico do perfil, provas legais imutáveis |
| Conexões criptografadas | ✅ HTTPS, HSTS e TLS verificado até o banco |
| Atualização de software | ✅ Dependabot semanal e `npm audit` na Checagem |
| Cópias de segurança (backup) | 👤 Pendente: o plano grátis do Supabase não tem backup automático. Exportar o banco com frequência |
| Política de Segurança da Informação, mesmo simples | 👤 Pendente: escrever uma página curta com as regras acima |
| Termo de confidencialidade da equipe | 👤 Recomendado para quem tiver funcionários com acesso aos dados |
| Canal para avisar incidentes e comunicar a ANPD | ✅ E-mail de privacidade publicado; ⚠️ falta um roteiro escrito de resposta a incidentes |

👤 = depende do responsável pelo Coffee Break.

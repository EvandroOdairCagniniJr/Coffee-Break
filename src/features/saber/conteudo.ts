// Conteúdo do "Saber da padaria": leis, direitos, deveres e boas práticas, por público,
// e as dicas "Você sabia?" que aparecem em cada tela do sistema.
// Ao mudar uma lei citada aqui, atualize a data abaixo (veja docs/CONFORMIDADE.md).

export const ATUALIZADO_EM = '3 de novembro de 2026'

export type Publico = 'dono' | 'equipe' | 'clientes'

export interface Topico {
  id: string
  titulo: string
  itens: string[]
  base?: string
}

export interface Secao {
  publico: Publico
  titulo: string
  resumo: string
  topicos: Topico[]
}

export const secoes: Secao[] = [
  {
    publico: 'dono',
    titulo: 'Para o dono',
    resumo: 'O que a lei pede de quem abre e toca a padaria, e como se proteger de multas e processos.',
    topicos: [
      {
        id: 'abrir-e-manter',
        titulo: 'Documentos para funcionar',
        itens: [
          'CNPJ com a atividade (CNAE) certa: padaria e confeitaria. Atividade errada pode gerar imposto errado e problema na fiscalização.',
          'Alvará de funcionamento da prefeitura e licença da Vigilância Sanitária, renovados no prazo.',
          'Auto de Vistoria do Corpo de Bombeiros (AVCB ou CLCB, conforme o estado): extintores na validade, saídas livres e gás instalado conforme as regras.',
          'MEI pode ter no máximo 1 empregado, ganhando o salário mínimo ou o piso da categoria. Cresceu? Fale com o contador para mudar de enquadramento antes de contratar o segundo.',
          'Balanças usadas na venda por peso precisam ser aprovadas e verificadas pelo Inmetro (ou pelo órgão estadual, o Ipem), com o selo em dia.',
          'Tocar música ambiente para o público gera cobrança de direitos autorais (ECAD).',
        ],
        base: 'LC 123/2006, art. 18-C; Lei 9.610/1998, art. 68; normas municipais e estaduais',
      },
      {
        id: 'registro',
        titulo: 'Contratar do jeito certo',
        itens: [
          'Registre na carteira (CTPS digital, pelo eSocial) desde o primeiro dia, inclusive na experiência. "Bico" fixo sem registro é a causa mais comum de processo.',
          'Contrato de experiência: no máximo 90 dias, que podem ser divididos em até 2 períodos.',
          'Pague no mínimo o piso da convenção coletiva dos padeiros da sua cidade. Ela também traz regras como cesta básica, adicionais e feriados. Peça a convenção atual ao sindicato ou ao contador.',
          'Exame médico admissional (ASO) antes de começar, e os periódicos e o demissional depois.',
          'Vale-transporte quando o funcionário pedir: o desconto é de no máximo 6% do salário-base.',
          'Uniforme exigido pela padaria é fornecido de graça.',
        ],
        base: 'CLT, arts. 29, 41, 445, 451 e 456-A; NR-7; Lei 7.418/1985',
      },
      {
        id: 'jornada',
        titulo: 'Jornada, horas extras e madrugada',
        itens: [
          'Limite de 8 horas por dia e 44 por semana. Hora extra paga com no mínimo 50% a mais (a convenção pode dar mais), até 2 por dia.',
          'Intervalo de 1 a 2 horas para quem trabalha mais de 6 horas; 15 minutos de 4 a 6 horas. Intervalo cortado é pago com 50% a mais.',
          'Entre um dia de trabalho e o outro, no mínimo 11 horas de descanso.',
          'Trabalho das 22h às 5h é noturno: adicional de pelo menos 20%, e a hora vale 52 minutos e 30 segundos. Padeiro que começa às 3h ou 4h tem direito.',
          'Folga semanal de 24 horas. Padaria pode abrir domingo e feriado, mas feriado trabalhado sem folga compensatória é pago em dobro.',
          'Banco de horas: por acordo individual escrito, compensado em até 6 meses; por acordo coletivo, em até 1 ano.',
          'Ponto (papel, relógio ou aplicativo) é obrigatório acima de 20 funcionários, mas vale para todos: num processo, é a prova do dono.',
        ],
        base: 'CF, art. 7º, XIII e XVI; CLT, arts. 59, 66, 71, 73 e 74; Lei 605/1949; Súmula 146 do TST',
      },
      {
        id: 'pagamentos',
        titulo: 'Salário, férias, 13º e FGTS',
        itens: [
          'Salário até o 5º dia útil do mês seguinte, com recibo (holerite) assinado ou comprovante de depósito.',
          'FGTS de 8% todo mês, pelo FGTS Digital, até o dia 20. O funcionário consulta pelo aplicativo FGTS e percebe a falta.',
          '13º salário em duas parcelas: a primeira até 30 de novembro e a segunda até 20 de dezembro.',
          'Férias de 30 dias com 1/3 a mais, pagas até 2 dias antes de começarem. Concedidas fora do prazo, são pagas em dobro.',
          'Só desconte do salário o que a lei, a convenção ou o próprio funcionário autorizou por escrito. Prejuízo (quebra de caixa, louça quebrada) só pode ser descontado se estiver no contrato ou se houve intenção (dolo).',
        ],
        base: 'CLT, arts. 134, 137, 145, 459, 462 e 464; Lei 4.090/1962; Lei 8.036/1990',
      },
      {
        id: 'seguranca',
        titulo: 'Segurança e saúde no trabalho',
        itens: [
          'Cilindro, masseira, batedeira, modeladora e fatiadora seguem a NR-12 (Anexo VI é só de panificação): proteções fixas, botão de emergência e treinamento registrado. Acidente com cilindro é dos mais graves do setor.',
          'EPI de graça, com ficha de entrega assinada e o número do CA: luva térmica no forno, luva de malha no corte, calçado antiderrapante, avental.',
          'Programa de riscos (PGR, NR-1) e controle médico (PCMSO, NR-7). Micro e pequenas empresas com riscos baixos podem ter dispensas: confirme com um técnico de segurança.',
          'Calor do forno pode dar adicional de insalubridade: só um laudo técnico diz se é o caso.',
          'Menor de 18 anos não trabalha à noite nem opera máquinas perigosas, como cilindro e fatiadora.',
          'Assédio moral e sexual: tenha regras escritas, um canal para denúncias e trate cada caso. Empresas com CIPA são obrigadas a isso.',
        ],
        base: 'NR-1, NR-6, NR-7, NR-12 (Anexo VI), NR-15 e NR-17; CLT, arts. 404 e 405; Decreto 6.481/2008; Lei 14.457/2022',
      },
      {
        id: 'saida',
        titulo: 'Quando alguém sai da padaria',
        itens: [
          'Pedido de demissão: o funcionário cumpre o aviso de 30 dias ou tem esse valor descontado. Recebe saldo de salário, férias + 1/3 e 13º proporcional. Não saca o FGTS nem tem seguro-desemprego. Peça o pedido por escrito e assinado.',
          'Dispensa sem justa causa: aviso prévio de 30 dias + 3 por ano trabalhado, multa de 40% do FGTS e todas as verbas.',
          'Acordo entre as partes: metade do aviso, multa de 20% do FGTS, saque de 80% do FGTS e sem seguro-desemprego. Precisa ser vontade dos dois, nunca imposto.',
          'Justa causa só nos casos da lei (como roubo, abandono por mais de 30 dias, embriaguez em serviço ou insubordinação). É preciso provar, agir logo e ser proporcional. Na dúvida, fale com um advogado antes.',
          'Pague tudo e entregue os documentos em até 10 dias depois do fim do contrato. Atrasou, paga multa de um salário.',
          'Rescisão indireta é quando o funcionário "demite o patrão" e cobra tudo como se fosse dispensado. Acontece por salário atrasado, FGTS não depositado, humilhação ou risco à saúde. Pagar em dia evita a maioria dos casos.',
        ],
        base: 'CLT, arts. 477, 482, 483, 484-A e 487; Lei 12.506/2011; Súmula 32 do TST',
      },
      {
        id: 'guardar',
        titulo: 'Papéis para guardar (e não ter dor de cabeça)',
        itens: [
          'Um processo trabalhista pode cobrar os últimos 5 anos e ser aberto até 2 anos depois da saída. Guarde tudo por pelo menos 5 anos depois da saída.',
          'Contrato de trabalho, ficha de registro e acordos (banco de horas, compensação).',
          'Holerites assinados, comprovantes de salário, FGTS e INSS.',
          'Folhas de ponto assinadas, avisos e recibos de férias e de 13º.',
          'Fichas de EPI, atestados (ASO), certificados de treinamento (NR-12, boas práticas).',
          'Advertências e suspensões por escrito, com a assinatura do funcionário (ou de duas testemunhas se ele se recusar).',
          'Termo de rescisão e comprovante de pagamento.',
        ],
        base: 'CF, art. 7º, XXIX',
      },
      {
        id: 'alimentos',
        titulo: 'Alimentos e Vigilância Sanitária',
        itens: [
          'Manual de Boas Práticas e procedimentos escritos (POPs) para higiene, água, pragas e saúde dos manipuladores, com um responsável que fez curso de boas práticas.',
          'Caixa d\'água limpa a cada 6 meses e controle de pragas por empresa licenciada, com os comprovantes guardados.',
          'Alimento quente exposto acima de 60 °C; refrigerado abaixo de 5 °C (ou como o fabricante indicar).',
          'Produto embalado pela padaria para a prateleira precisa de rótulo: nome, ingredientes, validade, lote, "contém glúten" ou "não contém glúten" e os alergênicos (leite, ovos, trigo, castanhas etc.).',
          'Validade: não existe lei federal com um prazo fixo para pão (o "7 dias" é mito). Quem define a validade é a padaria, conforme a receita, a embalagem e a conservação. O que a lei proíbe é vender depois dela: isso é crime.',
          'Sobrou e ainda está na validade? Doar é permitido por lei, e quem doa de boa-fé não responde por danos.',
        ],
        base: 'RDC Anvisa 216/2004 e 727/2022; Lei 10.674/2003; CDC, art. 18, §6º; Lei 8.137/1990, art. 7º, IX; Lei 14.016/2020',
      },
    ],
  },
  {
    publico: 'equipe',
    titulo: 'Para a equipe',
    resumo: 'Direitos e deveres de quem trabalha na padaria: no balcão, na produção ou na gerência.',
    topicos: [
      {
        id: 'direitos',
        titulo: 'Seus direitos',
        itens: [
          'Carteira assinada desde o primeiro dia, inclusive na experiência.',
          'Salário até o 5º dia útil, nunca abaixo do piso da categoria.',
          'Hora extra com pelo menos 50% a mais; das 22h às 5h, adicional noturno de pelo menos 20%.',
          'Intervalo para refeição, 11 horas de descanso entre um dia e outro e uma folga por semana.',
          'Férias de 30 dias com 1/3 a mais, 13º salário e FGTS de 8% todo mês (confira no aplicativo FGTS).',
          'Uniforme e EPI de graça. Máquina sem proteção ou sem treinamento: você pode recusar e avisar o responsável.',
          'Ninguém pode descontar quebra de caixa ou prejuízo do seu salário, a não ser que isso esteja no contrato ou tenha havido intenção.',
          'Ser tratado com respeito: humilhação, ameaça e assédio não fazem parte do trabalho e podem ser denunciados.',
          'Gestante tem estabilidade da confirmação da gravidez até 5 meses depois do parto, e licença-maternidade de 120 dias.',
        ],
        base: 'CF, art. 7º; CLT; ADCT, art. 10, II, "b"',
      },
      {
        id: 'deveres',
        titulo: 'Seus deveres',
        itens: [
          'Cumprir o horário e marcar o ponto com honestidade: ele também protege você.',
          'Seguir as regras de higiene: cabelo preso e coberto, unhas curtas sem esmalte, sem anel, brinco ou relógio, e mãos lavadas sempre que mudar de tarefa.',
          'Avisar quando estiver com diarreia, febre, ferida nas mãos ou gripe forte: você deve ficar longe dos alimentos até melhorar.',
          'Usar o EPI. Recusar sem motivo é falta grave.',
          'Nunca vender produto vencido ou estragado, mesmo que alguém peça: além de risco ao cliente, é crime.',
          'Conferir o caixa na abertura e no fechamento e registrar toda sangria e suprimento.',
          'Cuidar das máquinas e avisar na hora qualquer defeito.',
        ],
        base: 'CLT, arts. 158 e 482; RDC Anvisa 216/2004; NR-6',
      },
      {
        id: 'sair',
        titulo: 'Se você quiser sair',
        itens: [
          'Avise por escrito. O aviso prévio é de 30 dias: você trabalha nesse período ou o valor é descontado (a padaria pode dispensar o cumprimento).',
          'Você recebe o saldo de salário, as férias vencidas e proporcionais com 1/3 e o 13º proporcional, em até 10 dias.',
          'Quem pede demissão não saca o FGTS nem recebe seguro-desemprego. Existe também o acordo entre as partes, que precisa da concordância dos dois.',
          'Problema com pagamento ou tratamento? Converse primeiro com o responsável. Se não resolver, procure o sindicato.',
        ],
        base: 'CLT, arts. 477, 484-A e 487',
      },
      {
        id: 'gerencia',
        titulo: 'Para quem gerencia a equipe',
        itens: [
          'Advertência e suspensão sempre por escrito, explicando o motivo, logo depois do fato e na proporção certa.',
          'Corrija em particular, nunca na frente de clientes ou colegas.',
          'Escala de trabalho publicada com antecedência, respeitando folgas e intervalos.',
          'Treine os novos no Manual de Boas Práticas e nas máquinas antes de deixá-los sozinhos, e registre o treinamento.',
        ],
      },
    ],
  },
  {
    publico: 'clientes',
    titulo: 'Para os clientes',
    resumo: 'O que todo cliente tem direito na padaria. Seguir isso evita reclamação no Procon.',
    topicos: [
      {
        id: 'balcao',
        titulo: 'No balcão',
        itens: [
          'Um exemplar do Código de Defesa do Consumidor em lugar visível e de fácil acesso.',
          'Preço visível em todos os produtos; pão francês e produtos a granel com o preço por quilo.',
          'Preço diferente no Pix, dinheiro ou cartão é permitido, desde que esteja informado de forma clara.',
          'Dinheiro em espécie não pode ser recusado. Falta de troco não autoriza arredondar para cima nem dar bala como troco sem o cliente concordar.',
          'Consumação mínima é proibida.',
          'Atendimento prioritário para pessoas de 60 anos ou mais (80 anos ou mais à frente), gestantes, lactantes, quem está com criança de colo, pessoas com deficiência, com autismo e com obesidade.',
          'O cliente tem direito à nota fiscal. O Coffee Break não emite nota fiscal: use o emissor que o seu contador indicar.',
        ],
        base: 'Lei 12.291/2010; Lei 10.962/2004; Decreto 5.903/2006; Lei 13.455/2017; Decreto-Lei 3.688/1941, art. 43; CDC, art. 39; Lei 10.048/2000; Lei 10.741/2003; Lei 12.764/2012',
      },
      {
        id: 'produtos',
        titulo: 'Produtos e encomendas',
        itens: [
          'Produto estragado ou fora da validade: o cliente pode pedir troca, devolução do dinheiro ou abatimento.',
          'Quem tem alergia pode perguntar os ingredientes, e a equipe deve saber responder ou mostrar a ficha.',
          'Encomenda por telefone ou WhatsApp: deixe por escrito o valor, o sinal, a data e as regras de cancelamento.',
          'Promoção anunciada tem que ser cumprida. Se houver limite de estoque ou prazo, ele precisa aparecer no anúncio.',
          'Câmeras são permitidas, com aviso visível. Os dados dos clientes (nome e telefone da encomenda) só podem ser usados para aquele fim.',
        ],
        base: 'CDC, arts. 18, 30, 35, 37 e 49; LGPD',
      },
    ],
  },
]

// ---------- Dicas "Você sabia?" de cada tela ----------

export type Tela =
  | 'estoque'
  | 'producao'
  | 'receitas'
  | 'perdas'
  | 'pdv'
  | 'caixa'
  | 'encomendas'
  | 'promocoes'
  | 'equipe'

export type TipoDica = 'lei' | 'tecnica' | 'gestao' | 'seguranca'

export const tiposDica: Record<TipoDica, string> = {
  lei: 'Lei',
  tecnica: 'Técnica',
  gestao: 'Gestão',
  seguranca: 'Segurança',
}

export interface Dica {
  id: string
  tipo: TipoDica
  telas: Tela[]
  titulo: string
  texto: string
  base?: string
}

export const dicas: Dica[] = [
  // Validade e estoque
  {
    id: 'validade-mito',
    tipo: 'lei',
    telas: ['estoque', 'producao', 'perdas'],
    titulo: 'Pão tem prazo fixo de 7 dias? Não.',
    texto:
      'Nenhuma lei federal fixa a validade do pão. A padaria define o prazo de cada produto, conforme a receita e a conservação. O que a lei proíbe é vender depois da validade: isso é crime, com pena de 2 a 5 anos.',
    base: 'CDC, art. 18, §6º; Lei 8.137/1990, art. 7º, IX',
  },
  {
    id: 'peps',
    tipo: 'gestao',
    telas: ['estoque'],
    titulo: 'Primeiro que entra, primeiro que sai',
    texto:
      'Coloque o que chegou agora atrás do que já estava na prateleira (método PEPS). Assim o mais antigo sai antes e quase nada vence esquecido no fundo.',
  },
  {
    id: 'etiqueta',
    tipo: 'gestao',
    telas: ['estoque', 'producao'],
    titulo: 'Etiqueta com data em tudo que foi aberto',
    texto:
      'Farinha, recheio, creme ou massa aberta: etiqueta com o nome, a data em que foi aberto ou feito e até quando pode ser usado. É o que a Vigilância Sanitária procura primeiro.',
    base: 'RDC Anvisa 216/2004',
  },
  {
    id: 'farinha',
    tipo: 'tecnica',
    telas: ['estoque'],
    titulo: 'Farinha gosta de lugar seco e fora do chão',
    texto:
      'Guarde a sacaria sobre estrados, afastada da parede e do chão, num lugar seco e ventilado. Umidade empelota a farinha e atrai carunchos e roedores.',
  },
  {
    id: 'estoque-minimo',
    tipo: 'gestao',
    telas: ['estoque'],
    titulo: 'Estoque mínimo evita compra de emergência',
    texto:
      'Para cada insumo, pense quanto você usa por dia e quantos dias o fornecedor demora para entregar. Multiplique os dois e some uma folga: esse é o estoque mínimo. Comprar na pressa quase sempre sai mais caro.',
  },
  {
    id: 'temperatura',
    tipo: 'lei',
    telas: ['estoque', 'producao'],
    titulo: 'Geladeira abaixo de 5 °C',
    texto:
      'Refrigerados abaixo de 5 °C e quentes expostos acima de 60 °C. Anote a temperatura das geladeiras duas vezes por dia numa planilha: é prova de cuidado numa fiscalização.',
    base: 'RDC Anvisa 216/2004',
  },
  // Produção
  {
    id: 'pao-amanhecido',
    tipo: 'gestao',
    telas: ['producao', 'perdas'],
    titulo: 'Pão de ontem pode virar dinheiro',
    texto:
      'Dentro da validade, o pão de ontem pode ser vendido com desconto, desde que isso esteja claro para o cliente. Também pode virar torrada, farinha de rosca, pudim ou crouton.',
  },
  {
    id: 'fornada-escalonada',
    tipo: 'gestao',
    telas: ['producao'],
    titulo: 'Fornadas menores, mais vezes',
    texto:
      'Em vez de uma fornada enorme de manhã, faça fornadas menores nos picos (manhã, almoço e fim da tarde). O pão sai sempre quentinho, vende mais e sobra menos no fim do dia.',
  },
  {
    id: 'agua-gelada',
    tipo: 'tecnica',
    telas: ['producao', 'receitas'],
    titulo: 'A temperatura da água muda o pão',
    texto:
      'No calor, a massa fermenta rápido demais e o pão fica ácido e sem volume. Use água gelada (ou parte em gelo) para a massa sair da masseira por volta de 24 a 26 °C.',
  },
  {
    id: 'cilindro',
    tipo: 'seguranca',
    telas: ['producao'],
    titulo: 'Cilindro só com proteção e treinamento',
    texto:
      'O cilindro de massa causa alguns dos acidentes mais graves das padarias. A NR-12 exige proteção, botão de emergência e treinamento registrado de quem opera. Menor de 18 anos não pode operar.',
    base: 'NR-12, Anexo VI; Decreto 6.481/2008',
  },
  {
    id: 'madrugada',
    tipo: 'lei',
    telas: ['producao', 'equipe'],
    titulo: 'Quem começa às 4h tem adicional noturno',
    texto:
      'O trabalho entre 22h e 5h é noturno: adicional de pelo menos 20% e hora de 52min30s. Padeiro da madrugada tem esse direito, e a convenção da categoria pode dar mais.',
    base: 'CLT, art. 73',
  },
  {
    id: 'higiene-manipulador',
    tipo: 'lei',
    telas: ['producao', 'receitas'],
    titulo: 'Sem anel, brinco ou relógio na produção',
    texto:
      'Quem manipula alimento trabalha com cabelo preso e coberto, unhas curtas sem esmalte e sem adornos. Lava as mãos sempre que muda de tarefa. Quem está doente ou com ferida nas mãos fica longe da massa.',
    base: 'RDC Anvisa 216/2004',
  },
  // Receitas
  {
    id: 'porcentagem-padeiro',
    tipo: 'tecnica',
    telas: ['receitas'],
    titulo: 'Porcentagem do padeiro',
    texto:
      'Escreva a receita com a farinha valendo 100% e os outros ingredientes em relação a ela (água 60%, sal 2%, fermento 1%). Para fazer mais ou menos massa, basta mudar a farinha: o resto acompanha.',
  },
  {
    id: 'ficha-tecnica',
    tipo: 'gestao',
    telas: ['receitas'],
    titulo: 'Ficha técnica é o preço certo',
    texto:
      'Com a receita cadastrada, o sistema sabe quanto custa cada unidade. Revise os custos sempre que um insumo subir: um aumento na farinha ou na manteiga come a margem sem você perceber.',
  },
  {
    id: 'alergenicos',
    tipo: 'lei',
    telas: ['receitas', 'pdv'],
    titulo: 'Saiba responder: tem leite? tem glúten?',
    texto:
      'O produto embalado na padaria precisa trazer "contém glúten" ou "não contém glúten" e os alergênicos (leite, ovo, trigo, soja, castanhas). No balcão, a equipe deve saber responder ou mostrar a receita.',
    base: 'Lei 10.674/2003; RDC Anvisa 727/2022',
  },
  {
    id: 'fermentacao-lenta',
    tipo: 'tecnica',
    telas: ['receitas'],
    titulo: 'Fermentação lenta dá mais sabor',
    texto:
      'Use menos fermento e deixe a massa descansar na geladeira de um dia para o outro (de 4 a 6 °C). O pão ganha sabor e casca melhor, e a madrugada fica mais leve: a massa já está pronta.',
  },
  {
    id: 'pesar',
    tipo: 'tecnica',
    telas: ['receitas'],
    titulo: 'Pese, não meça em xícara',
    texto:
      'Uma "xícara de farinha" pode variar mais de 20%. Pesar tudo em gramas deixa o pão igual todo dia, não importa quem faça.',
  },
  // Perdas
  {
    id: 'doacao',
    tipo: 'lei',
    telas: ['perdas'],
    titulo: 'Doar o que sobra é permitido',
    texto:
      'Alimento dentro da validade e em boas condições pode ser doado a instituições e pessoas. Quem doa de boa-fé só responde se agir com intenção de causar dano.',
    base: 'Lei 14.016/2020',
  },
  {
    id: 'medir-perda',
    tipo: 'gestao',
    telas: ['perdas'],
    titulo: 'O que não se mede não melhora',
    texto:
      'Registre toda perda com o motivo. Em poucas semanas aparece o padrão, por exemplo o pão doce que sobra toda segunda. Aí é só ajustar a produção daquele dia.',
  },
  // Balcão
  {
    id: 'preco-pagamento',
    tipo: 'lei',
    telas: ['pdv', 'promocoes'],
    titulo: 'Preço diferente no Pix é permitido',
    texto:
      'Você pode cobrar menos no Pix ou no dinheiro do que no cartão, desde que o preço de cada forma de pagamento esteja informado de forma clara.',
    base: 'Lei 13.455/2017',
  },
  {
    id: 'troco',
    tipo: 'lei',
    telas: ['pdv', 'caixa'],
    titulo: 'Bala não é troco',
    texto:
      'Falta de troco não autoriza arredondar para cima nem dar bala sem o cliente concordar. Abra o caixa com troco suficiente: isso evita reclamação e venda perdida.',
    base: 'CDC, art. 39',
  },
  {
    id: 'dinheiro',
    tipo: 'lei',
    telas: ['pdv'],
    titulo: 'Recusar dinheiro é contravenção',
    texto:
      'A padaria pode escolher se aceita cartão, mas não pode recusar dinheiro em espécie.',
    base: 'Decreto-Lei 3.688/1941, art. 43',
  },
  {
    id: 'prioridade',
    tipo: 'lei',
    telas: ['pdv'],
    titulo: 'Atendimento prioritário',
    texto:
      'Pessoas de 60 anos ou mais, gestantes, lactantes, quem está com criança de colo, pessoas com deficiência, com autismo e com obesidade têm prioridade. Quem tem 80 anos ou mais vem à frente de todos.',
    base: 'Lei 10.048/2000; Lei 10.741/2003; Lei 12.764/2012',
  },
  {
    id: 'venda-adicional',
    tipo: 'gestao',
    telas: ['pdv'],
    titulo: 'Uma pergunta que aumenta o ticket',
    texto:
      '"Vai um café para acompanhar?" Sugerir um item que combina, sem insistir, é a forma mais simples de vender mais para quem já está comprando.',
  },
  // Caixa
  {
    id: 'quebra-caixa',
    tipo: 'lei',
    telas: ['caixa'],
    titulo: 'Diferença no caixa não sai do salário automaticamente',
    texto:
      'Só se pode descontar falta no caixa do salário se isso estiver previsto no contrato ou se houver intenção (dolo). Muitas convenções dão um adicional de "quebra de caixa" a quem opera o caixa.',
    base: 'CLT, art. 462, §1º',
  },
  {
    id: 'sangria',
    tipo: 'seguranca',
    telas: ['caixa'],
    titulo: 'Sangria frequente é segurança',
    texto:
      'Pouco dinheiro na gaveta é menos risco em caso de assalto e menos tentação. Faça sangrias ao longo do dia e registre todas aqui: assim o fechamento fecha.',
  },
  // Encomendas
  {
    id: 'encomenda-escrita',
    tipo: 'lei',
    telas: ['encomendas'],
    titulo: 'Combine a encomenda por escrito',
    texto:
      'Valor, sinal, data, sabor e regra de cancelamento por escrito (vale mensagem de WhatsApp). Pedido feito fora da loja pode dar direito de arrependimento em 7 dias. Bolo personalizado já feito é discutido caso a caso, então deixe as regras claras antes.',
    base: 'CDC, arts. 30 e 49',
  },
  {
    id: 'lgpd-cliente',
    tipo: 'lei',
    telas: ['encomendas'],
    titulo: 'Telefone do cliente é só para a encomenda',
    texto:
      'O nome e o telefone anotados servem para avisar sobre o pedido. Para mandar promoções, peça autorização antes.',
    base: 'LGPD, arts. 6º e 7º',
  },
  // Promoções
  {
    id: 'de-por',
    tipo: 'lei',
    telas: ['promocoes'],
    titulo: '"De R$ 10 por R$ 8" tem que ser verdade',
    texto:
      'O preço "de" precisa ser o que era cobrado de fato. Promoção anunciada vincula: se tiver limite de estoque ou prazo, informe no anúncio.',
    base: 'CDC, arts. 30, 35 e 37',
  },
  {
    id: 'happy-hour',
    tipo: 'gestao',
    telas: ['promocoes'],
    titulo: 'Desconto no fim do dia',
    texto:
      'Uma promoção na última hora para o pão do dia transforma sobra em venda. Programe aqui com dia e horário e ela entra sozinha no PDV.',
  },
  // Equipe
  {
    id: 'registro-dia1',
    tipo: 'lei',
    telas: ['equipe'],
    titulo: 'Carteira assinada desde o primeiro dia',
    texto:
      'Inclusive na experiência. Trabalhar sem registro é a causa mais comum de processo trabalhista, e o juiz pode reconhecer o vínculo de todo o período.',
    base: 'CLT, arts. 29 e 41',
  },
  {
    id: 'mei-um',
    tipo: 'lei',
    telas: ['equipe'],
    titulo: 'MEI pode ter só 1 empregado',
    texto:
      'Se a padaria é MEI, só pode ter um empregado registrado, ganhando o mínimo ou o piso da categoria. Antes de contratar o segundo, fale com o contador.',
    base: 'LC 123/2006, art. 18-C',
  },
  {
    id: 'documentos-5anos',
    tipo: 'gestao',
    telas: ['equipe'],
    titulo: 'Guarde os papéis por 5 anos',
    texto:
      'Ponto, holerites, férias, EPI e advertências assinadas são a sua defesa num processo. Um processo pode cobrar até 5 anos para trás.',
    base: 'CF, art. 7º, XXIX',
  },
]

export function dicasDaTela(tela: Tela) {
  return dicas.filter((d) => d.telas.includes(tela))
}

// Conteúdo do Guia e dicas: os guias passo a passo e as perguntas frequentes.
// Também alimenta o assistente do botão "Dúvidas?" (src/features/ajuda).
import {
  Banknote,
  BarChart3,
  CalendarClock,
  ChefHat,
  KeyRound,
  Package,
  Percent,
  Receipt,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  Target,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import type { Papel } from '@/types/database'

export type Categoria = 'balcao' | 'producao' | 'gestao' | 'conta'

export const categorias: Record<Categoria, string> = {
  balcao: 'Balcão',
  producao: 'Produção e estoque',
  gestao: 'Gestão',
  conta: 'Conta e equipe',
}

export type Publico = 'equipe' | 'gestao'

export interface Guia {
  id: string
  // Para quem é o guia: a equipe do dia a dia ou quem administra (dono e gerente).
  publico: Publico
  categoria: Categoria
  titulo: string
  resumo: string
  icone: LucideIcon
  link?: { to: string; label: string }
  papeis: Papel[]
  passos: string[]
  dicas: string[]
}

export const todos: Papel[] = ['dono', 'admin', 'funcionario']
const gestao: Papel[] = ['dono', 'admin']

export const guias: Guia[] = [
  {
    id: 'primeiro-dia',
    publico: 'equipe',
    categoria: 'conta',
    titulo: 'Primeiro dia: entrando no sistema',
    resumo: 'Entrar, conferir sua conta e sair com segurança.',
    icone: KeyRound,
    papeis: todos,
    passos: [
      'Entre com o e-mail e a senha que o responsável pela padaria passou para você.',
      'Ainda não tem conta? Na tela de login, use "Criar conta", informe o código da padaria e aguarde o responsável liberar seu acesso.',
      'Confira no canto de baixo do menu se o nome e o papel são os seus.',
      'O menu da esquerda mostra só o que faz parte do seu trabalho.',
      'No fim do turno, clique em "Sair", principalmente em computador compartilhado.',
    ],
    dicas: [
      'Tudo o que você registra (vendas, estoque, produção) fica no seu nome. Não use a conta de outra pessoa, nem empreste a sua.',
      'Clique no seu nome, embaixo do menu, para trocar a foto, o nome e a senha.',
    ],
  },
  {
    id: 'pdv',
    publico: 'equipe',
    categoria: 'balcao',
    titulo: 'Vendendo no balcão (PDV)',
    resumo: 'Montar o pedido, cobrar e mandar o comprovante.',
    icone: ShoppingCart,
    link: { to: '/pdv', label: 'Abrir o PDV' },
    papeis: todos,
    passos: [
      'Digite o nome do produto na busca. Apertar Enter já adiciona o primeiro resultado.',
      'Ou toque no produto. Tocar de novo soma mais uma unidade. Produtos com variedades (como "Café") abrem as opções.',
      'No pedido, use − e + para ajustar a quantidade, ou a lixeira para tirar o item.',
      'Escolha a forma de pagamento. Em dinheiro, informe o valor recebido e o troco aparece sozinho.',
      'Confira o total com o cliente e clique em "Finalizar venda" (ou aperte F2).',
      'Quer mandar o comprovante? Digite o WhatsApp do cliente (com DDD) e toque em "Enviar". Também dá para baixar a imagem ou o PDF.',
    ],
    dicas: [
      'Promoções ativas entram sozinhas no pedido: não precisa calcular nada.',
      'Desconto manual: o funcionário pode dar até 10%. Mais que isso, só o gerente ou o dono.',
      'O estoque aparece embaixo do preço. Em vermelho, acabou ou está negativo: avise quem cuida do estoque.',
      'Preço errado? Avise o gerente em vez de "compensar" no troco.',
    ],
  },
  {
    id: 'caixa',
    publico: 'equipe',
    categoria: 'balcao',
    titulo: 'Abrindo e fechando o caixa',
    resumo: 'Fundo de troco, sangria, suprimento e conferência.',
    icone: Banknote,
    link: { to: '/caixa', label: 'Abrir o Caixa' },
    papeis: todos,
    passos: [
      'No começo do turno, abra o Caixa e informe o fundo de troco (o dinheiro que já está na gaveta).',
      'Tirou dinheiro da gaveta (cofre, pagar um fornecedor)? Registre uma "Sangria" com o motivo.',
      'Colocou dinheiro para troco? Registre um "Suprimento".',
      'No fim do turno, clique em "Fechar caixa" e conte as notas e as moedas: o sistema mostra na hora se bateu, sobrou ou faltou.',
    ],
    dicas: [
      'Cada pessoa abre e fecha o próprio caixa. As vendas entram no caixa de quem está logado.',
      'Diferença pequena e frequente costuma ser troco errado: confira com calma antes de entregar.',
    ],
  },
  {
    id: 'vendas',
    publico: 'equipe',
    categoria: 'balcao',
    titulo: 'Vendas anteriores, 2ª via e devoluções',
    resumo: 'Achar uma venda, reenviar o comprovante ou desfazer.',
    icone: Receipt,
    link: { to: '/vendas', label: 'Abrir Vendas' },
    papeis: todos,
    passos: [
      'Em Vendas, busque pelo número do comprovante, pelo produto ou por quem vendeu.',
      'Abra a venda para ver os itens e mandar a 2ª via do comprovante (WhatsApp, imagem ou PDF).',
      'Venda errada ou cliente desistiu: o gerente ou o dono abre a venda e clica em "Devolver", com o motivo.',
    ],
    dicas: [
      'Na devolução, o estoque volta sozinho e a venda sai de todos os totais.',
      'Depois de devolver, é só fazer a venda certa de novo no PDV.',
    ],
  },
  {
    id: 'encomendas',
    publico: 'equipe',
    categoria: 'balcao',
    titulo: 'Encomendas (bolos e pedidos de festa)',
    resumo: 'Anotar, cobrar o sinal e entregar no dia certo.',
    icone: CalendarClock,
    link: { to: '/encomendas', label: 'Abrir Encomendas' },
    papeis: todos,
    passos: [
      'Clique em "Nova encomenda": cliente, WhatsApp, dia e hora, retirada ou entrega.',
      'Adicione os itens. O preço do cadastro vem sugerido, mas pode ser ajustado ao combinado.',
      'Escreva os detalhes, como a frase do bolo ou restrições ("sem lactose").',
      'Recebeu sinal? Informe o valor (o botão "50%" calcula metade) e a forma de pagamento.',
      'Acompanhe pelos botões: Confirmar → Iniciar produção → Marcar pronta.',
      'Na retirada, clique em "Entregar": o sistema cobra só o que falta e registra a venda.',
    ],
    dicas: [
      'Use "Enviar confirmação" e "Avisar que está pronta" para mandar a mensagem pronta no WhatsApp do cliente.',
      'Encomendas atrasadas aparecem no topo, em vermelho.',
    ],
  },
  {
    id: 'metas',
    publico: 'equipe',
    categoria: 'balcao',
    titulo: 'Metas de vendas',
    resumo: 'Quanto já vendeu e quanto falta no dia, semana e mês.',
    icone: Target,
    link: { to: '/metas', label: 'Abrir Metas' },
    papeis: todos,
    passos: [
      'Em Metas você acompanha quanto já vendeu hoje, na semana e no mês, e quanto falta.',
      'Dono: clique em "Definir metas" e escolha de quem é a meta: a padaria toda, o padrão de cada pessoa ou uma pessoa específica.',
      'Preencha o valor do dia e use "Preencher semana e mês a partir do dia" para o sistema fazer a conta. Depois ajuste se quiser.',
    ],
    dicas: [
      'A semana nunca pode ter meta menor que o dia, nem o mês menor que a semana: o sistema avisa na hora.',
      'Na semana e no mês aparece a projeção "no ritmo atual": dá para saber cedo se vai bater.',
    ],
  },
  {
    id: 'estoque',
    publico: 'equipe',
    categoria: 'producao',
    titulo: 'Recebendo mercadoria (Estoque)',
    resumo: 'Entradas, contagens e ajustes do estoque.',
    icone: Warehouse,
    link: { to: '/estoque', label: 'Abrir Estoque' },
    papeis: todos,
    passos: [
      'Chegou mercadoria: em Estoque, clique em "Ajustar" no produto e escolha "Entrada" com a quantidade recebida.',
      'Contagem do estoque: use "Ajuste" e informe o total que você contou na prateleira.',
      'Sobra, vencido ou queimado: registre em Produção → Perdas.',
    ],
    dicas: [
      'Estoque negativo quer dizer que saiu mais do que entrou no sistema: lance a entrada que faltou ou faça um ajuste.',
      'Vendas e produções já mexem no estoque sozinhas. Não lance de novo.',
      'Preencha sempre o motivo nas saídas: ajuda o dono a entender as perdas.',
    ],
  },
  {
    id: 'sugestao',
    publico: 'equipe',
    categoria: 'producao',
    titulo: 'Quanto produzir e as perdas do dia',
    resumo: 'A sugestão de fornadas e por que registrar as sobras.',
    icone: ChefHat,
    link: { to: '/producao', label: 'Abrir Produção' },
    papeis: todos,
    passos: [
      'Em Produção → Sugestão do dia, veja quanto produzir de cada item hoje ou amanhã.',
      'A conta usa as vendas das últimas 4 semanas no mesmo dia da semana e as sobras registradas, e já desconta o estoque.',
      'Clique em "Planejar" (ou "Planejar todas as fornadas") para mandar direto para o planejamento.',
      'No fechamento, em Produção → Perdas, registre o que sobrou, venceu ou queimou.',
    ],
    dicas: [
      'Quase nunca sobra? O sistema sugere um pouco a mais: provavelmente estava faltando.',
      'Registrar as sobras todo dia é o segredo de uma sugestão certeira.',
    ],
  },
  {
    id: 'producao',
    publico: 'equipe',
    categoria: 'producao',
    titulo: 'Produção do dia e fichas técnicas',
    resumo: 'Planejar e concluir fornadas com as receitas.',
    icone: ChefHat,
    link: { to: '/producao', label: 'Abrir Produção' },
    papeis: todos,
    passos: [
      'Em Produção → Planejamento, veja o que precisa ser feito hoje.',
      'Para planejar uma fornada: "Planejar produção", escolha a receita e a data.',
      'Quando a fornada estiver pronta: no menu ⋯ da linha, clique em "Concluir produção". O sistema dá baixa nos ingredientes e soma o produto pronto no estoque.',
      'Gerente ou dono: em Receitas, cadastre a ficha técnica (produto final, rendimento e ingredientes).',
    ],
    dicas: [
      'Conclua só quando a fornada estiver realmente pronta: não dá para desfazer.',
      'Com as fichas certas, o custo de cada produto aparece sozinho em Margens e CMV.',
    ],
  },
  {
    id: 'produtos',
    publico: 'gestao',
    categoria: 'gestao',
    titulo: 'Cadastrando produtos e preços',
    resumo: 'Produtos, variedades, ingredientes e estoque mínimo.',
    icone: Package,
    link: { to: '/produtos', label: 'Abrir Produtos' },
    papeis: gestao,
    passos: [
      'Em Produtos, clique em "Novo produto".',
      'Preencha nome, unidade (un, kg...) e preço de venda. O preço de custo é opcional, mas mostra a margem.',
      'Defina o estoque mínimo: abaixo disso o produto aparece em alerta no Dashboard e no Estoque.',
      'Variedades: produtos com o mesmo "Variedade de" (ex.: Café → Coado, Cappuccino) viram um cartão só no PDV, com as opções.',
      'Ingredientes (farinha, fermento...) também são produtos: cadastre-os para usar nas receitas.',
    ],
    dicas: [
      'Mudar o preço vale para as próximas vendas; as antigas mantêm o preço da época.',
      'Remover um produto só o esconde: o histórico de vendas continua intacto.',
    ],
  },
  {
    id: 'promocoes',
    publico: 'gestao',
    categoria: 'gestao',
    titulo: 'Promoções automáticas',
    resumo: 'Descontos que o PDV aplica sozinho, no dia e horário certos.',
    icone: Tag,
    link: { to: '/promocoes', label: 'Abrir Promoções' },
    papeis: gestao,
    passos: [
      'Em Promoções, clique em "Nova promoção" e dê um nome que o cliente entenda (ex.: "Café da manhã").',
      'Escolha o tipo: porcentagem, valor em reais, preço fixo ou leve X pague Y.',
      'Diga a quais produtos ou categorias ela vale, ou se vale para tudo.',
      'Se quiser, limite o período, os dias da semana e o horário (ex.: dias úteis, das 6h às 9h).',
    ],
    dicas: [
      'O nome da promoção aparece no comprovante, junto com quanto o cliente economizou.',
      'Desative em vez de apagar uma promoção sazonal: no ano seguinte é só ligar de novo.',
    ],
  },
  {
    id: 'analise',
    publico: 'gestao',
    categoria: 'gestao',
    titulo: 'Análise de vendas',
    resumo: 'Os mais vendidos, os horários fortes e os combos.',
    icone: BarChart3,
    link: { to: '/analise', label: 'Abrir Análise' },
    papeis: gestao,
    passos: [
      'Escolha o período: dia, semana ou mês. Tudo é comparado com o período anterior.',
      'Veja o faturamento, o ticket médio, os produtos que mais venderam e os que caíram.',
      'Confira os horários mais fortes e os produtos que saem juntos: são boas ideias de combo.',
    ],
    dicas: [
      'Use os horários fortes para planejar fornadas e escala de equipe.',
      'Produto caindo toda semana? Teste uma promoção ou reduza a produção.',
    ],
  },
  {
    id: 'margens',
    publico: 'gestao',
    categoria: 'gestao',
    titulo: 'Margens, CMV e preço certo',
    resumo: 'Quanto cada produto realmente dá de lucro.',
    icone: Percent,
    link: { to: '/margens', label: 'Abrir Margens e CMV' },
    papeis: gestao,
    passos: [
      'Em Margens e CMV, veja faturamento, custo dos produtos vendidos, lucro bruto e CMV do período.',
      'O custo vem da ficha técnica (ingredientes ÷ rendimento) ou do custo cadastrado no produto.',
      'Produtos com custo acima da meta ficam em vermelho, com o preço sugerido: "Usar R$ X" aplica na hora.',
    ],
    dicas: [
      'Mantenha o custo dos ingredientes atualizado a cada compra: a margem de todos os produtos se ajusta sozinha.',
      'Referência de mercado: padaria com produção própria trabalha com CMV entre 35% e 42%.',
    ],
  },
  {
    id: 'financeiro',
    publico: 'gestao',
    categoria: 'gestao',
    titulo: 'Contas a pagar e a receber',
    resumo: 'Boletos, fornecedores e vendas a prazo.',
    icone: Wallet,
    link: { to: '/financeiro', label: 'Abrir Financeiro' },
    papeis: gestao,
    passos: [
      'Lance cada boleto, fornecedor ou aluguel em "Novo lançamento" → Conta a pagar.',
      'Vendas a prazo e valores a receber vão em Conta a receber.',
      'Quando pagar ou receber, use o menu ⋯ → "Marcar como pago".',
    ],
    dicas: ['O Dashboard avisa as contas que vencem nos próximos 7 dias e as atrasadas.'],
  },
  {
    id: 'minha-padaria',
    publico: 'gestao',
    categoria: 'conta',
    titulo: 'Minha padaria: logo e comprovante',
    resumo: 'Os dados da empresa, a logo e o comprovante do seu jeito.',
    icone: Store,
    link: { to: '/padaria', label: 'Abrir Minha padaria' },
    papeis: ['dono'],
    passos: [
      'Preencha nome, CNPJ, endereço, telefone, WhatsApp, Instagram e horário: eles vão para o comprovante.',
      'Envie a logo: ela aparece no menu, no comprovante e no ícone da aba do navegador.',
      'Em "Personalizar comprovante", escolha a cor do cabeçalho, o título, um recado extra (ex.: senha do Wi-Fi) e o que aparece ou não.',
      'Confira na prévia ao lado e clique em "Salvar".',
    ],
    dicas: ['A prévia mostra uma venda de exemplo completa: o cupom real sai igual.'],
  },
  {
    id: 'equipe',
    publico: 'gestao',
    categoria: 'conta',
    titulo: 'Coordenando a equipe',
    resumo: 'Convidar, liberar acesso e acompanhar cada pessoa.',
    icone: Users,
    link: { to: '/equipe', label: 'Abrir Equipe' },
    papeis: ['dono'],
    passos: [
      'Convide a equipe: mostre o código de convite que aparece em Equipe. A pessoa cria a conta e você libera o acesso.',
      'Ou cadastre direto: em Equipe, clique em "Novo membro", preencha nome, e-mail e uma senha inicial, e escolha o papel.',
      'Funcionário: PDV, caixa, estoque, produção e encomendas. Gerente: toda a operação, menos a página Equipe.',
      'Acompanhe por período quanto cada um vendeu, as produções e os ajustes de estoque, e veja a linha do tempo de cada pessoa.',
    ],
    dicas: [
      'Quando alguém sair da padaria, use "Desativar acesso": a pessoa perde o acesso na hora e o histórico continua.',
      'Senha esquecida? Em Equipe, "Editar / redefinir senha" e passe a nova para a pessoa.',
      'Mostre este Guia (e o vídeo) a cada pessoa no primeiro dia.',
    ],
  },
  {
    id: 'leis',
    publico: 'equipe',
    categoria: 'conta',
    titulo: 'Leis e boas práticas da padaria',
    resumo: 'Direitos e deveres de quem trabalha, regras do balcão e da Vigilância Sanitária.',
    icone: Scale,
    link: { to: '/saber', label: 'Abrir Leis e boas práticas' },
    papeis: todos,
    passos: [
      'No menu, abra "Leis e boas práticas". A página tem abas para o dono, para a equipe e para os clientes.',
      'Use a busca para achar um assunto: férias, troco, validade, adicional noturno.',
      'Cada item mostra a lei que o garante, para você conferir ou mostrar a alguém.',
      'Nas telas de Estoque, Produção, Caixa e outras, o cartão "Você sabia?" traz uma dica ligada ao que você está fazendo.',
    ],
    dicas: [
      'É um resumo de orientação: em caso de dúvida, confirme com o contador, o sindicato ou a Vigilância Sanitária.',
      'Não gostou do cartão "Você sabia?"? Toque no X para escondê-lo neste aparelho.',
    ],
  },
  {
    id: 'privacidade',
    publico: 'equipe',
    categoria: 'conta',
    titulo: 'Seus dados, senha e privacidade',
    resumo: 'Proteger a conta, baixar seus dados e entender o que o sistema guarda.',
    icone: ShieldCheck,
    papeis: todos,
    passos: [
      'Clique no seu nome, embaixo do menu, para trocar a foto, o nome e a senha.',
      'Use uma senha só sua, com letras e números, e nunca passe para colegas: cada pessoa tem o próprio login.',
      'Esqueceu a conta aberta em outro aparelho? Use "Sair de todos os aparelhos".',
      'Em "Baixar meus dados" vem um arquivo com o seu perfil, os seus acessos e os termos que você aceitou.',
    ],
    dicas: [
      'Ao sair do computador do balcão, saia da conta ou bloqueie a tela.',
      'Desconfie de mensagens pedindo a sua senha: o Coffee Break nunca pede senha por e-mail ou WhatsApp.',
      'Os Termos de Uso, a Política de Privacidade e o contrato ficam nos links do rodapé da tela de login.',
    ],
  },
]

export const duvidas: { pergunta: string; resposta: string; papeis: Papel[] }[] = [
  {
    pergunta: 'Registrei uma venda errada. E agora?',
    resposta:
      'Não se preocupe: chame o gerente ou o dono. Em Vendas, ele abre a venda e clica em "Devolver" (o estoque volta sozinho). Depois é só fazer a venda certa no PDV.',
    papeis: todos,
  },
  {
    pergunta: 'Esqueci de abrir o caixa e já vendi.',
    resposta:
      'Abra o caixa agora: as próximas vendas entram nele. Avise o gerente sobre as vendas de antes, para a conferência do fim do dia bater.',
    papeis: todos,
  },
  {
    pergunta: 'A internet caiu no meio de uma venda.',
    resposta:
      'Espere voltar e confira em Vendas se a venda entrou antes de fazer de novo. Assim o cliente não é cobrado duas vezes.',
    papeis: todos,
  },
  {
    pergunta: 'O estoque de um produto ficou negativo.',
    resposta:
      'Saiu mais do que foi lançado de entrada. Em Estoque, lance a entrada que faltou ou faça um ajuste com a quantidade contada na prateleira.',
    papeis: todos,
  },
  {
    pergunta: 'Esqueci minha senha.',
    resposta:
      'Na tela de login, use "Esqueci minha senha": chega um código no seu e-mail. Se o e-mail não chegar, peça ao dono para criar uma senha nova em Equipe.',
    papeis: todos,
  },
  {
    pergunta: 'O cliente pediu o comprovante depois.',
    resposta: 'Em Vendas, abra a venda e mande a 2ª via pelo WhatsApp, ou baixe a imagem ou o PDF.',
    papeis: todos,
  },
  {
    pergunta: 'Posso usar no celular ou no tablet?',
    resposta:
      'Pode. O Coffee Break funciona no navegador de qualquer computador, tablet ou celular: é só entrar com seu e-mail e senha.',
    papeis: todos,
  },
  {
    pergunta: 'Alguém viu minha senha ou esqueci a conta aberta em outro aparelho.',
    resposta:
      'Clique no seu nome, embaixo do menu, troque a senha e use "Sair de todos os aparelhos". Os outros logins caem na hora.',
    papeis: todos,
  },
  {
    pergunta: 'O Coffee Break emite nota fiscal (NFC-e)?',
    resposta:
      'Ainda não. O comprovante do sistema é um recibo sem valor fiscal. Para a nota fiscal, use o emissor que o seu contador indicar.',
    papeis: todos,
  },
  {
    pergunta: 'Posso cobrar um preço no Pix e outro no cartão?',
    resposta:
      'Pode, desde que os preços de cada forma de pagamento estejam informados de forma clara para o cliente (Lei 13.455/2017). Veja mais em Leis e boas práticas.',
    papeis: todos,
  },
  {
    pergunta: 'O cliente quer pagar uma parte no dinheiro e outra no cartão.',
    resposta:
      'Por enquanto, cada venda tem uma forma de pagamento. Para dividir, separe os itens em duas vendas: uma no dinheiro e outra no cartão.',
    papeis: todos,
  },
  {
    pergunta: 'Como coloco a logo da padaria no sistema e no comprovante?',
    resposta:
      'Em Minha padaria, envie a imagem da logo. Ela aparece no menu, na tela de login da equipe e no comprovante. Lá também dá para mudar a cor e o recado do comprovante.',
    papeis: gestao,
  },
  {
    pergunta: 'Como coloco uma pessoa nova na equipe?',
    resposta:
      'Em Equipe, cadastre a pessoa ou passe o código da padaria para ela criar a conta em "Criar conta". Depois, libere o acesso e escolha o papel: gerente ou funcionário.',
    papeis: ['dono'],
  },
  {
    pergunta: 'Qual a diferença entre dono, gerente e funcionário?',
    resposta:
      'O funcionário usa o balcão, o caixa, as encomendas, o estoque e a produção. O gerente também vê os números, os produtos e as promoções. Só o dono cuida da equipe, mexe em Minha padaria e assina o contrato.',
    papeis: todos,
  },
  {
    pergunta: 'Alguém saiu da padaria. Como tiro o acesso?',
    resposta:
      'Em Equipe, abra a pessoa e desative o acesso. O histórico de vendas dela continua guardado, mas ela não entra mais no sistema.',
    papeis: ['dono'],
  },
  {
    pergunta: 'Por que o sistema pediu para eu aceitar os termos de novo?',
    resposta:
      'Quando os Termos de Uso, a Política de Privacidade ou o contrato mudam, a lei pede um novo aceite. As versões anteriores e os seus aceites continuam guardados.',
    papeis: todos,
  },
  {
    pergunta: 'Como baixo todos os meus dados pessoais?',
    resposta:
      'Clique no seu nome, embaixo do menu, e use "Baixar meus dados". Vem um arquivo com o seu perfil, os seus acessos e os seus aceites (LGPD, art. 18).',
    papeis: todos,
  },
  {
    pergunta: 'Pão tem validade de 7 dias por lei?',
    resposta:
      'Não. Nenhuma lei federal fixa o prazo do pão: a padaria define a validade de cada produto. O que a lei proíbe é vender depois da validade. Veja em Leis e boas práticas.',
    papeis: todos,
  },
  {
    pergunta: 'Como faço uma promoção só no fim da tarde?',
    resposta:
      'Em Promoções, crie a promoção e escolha os dias da semana e o horário de início e de fim. No horário certo, o PDV aplica o desconto sozinho.',
    papeis: gestao,
  },
  {
    pergunta: 'A meta da semana não bate com as vendas.',
    resposta:
      'A meta conta as vendas concluídas no período (vendas devolvidas saem da conta). Confira em Vendas se há devoluções ou vendas registradas em outro dia.',
    papeis: todos,
  },
  {
    pergunta: 'Como sei quanto lucro cada produto dá?',
    resposta:
      'Cadastre o custo ou a ficha técnica do produto. Em Margens e CMV aparecem o lucro de cada um e o preço sugerido quando o custo passa da meta.',
    papeis: gestao,
  },
  {
    pergunta: 'O cliente da encomenda desistiu. E o sinal?',
    resposta:
      'Siga o que foi combinado por escrito na encomenda. Em Encomendas, cancele o pedido e, se devolver o sinal, registre a saída no caixa.',
    papeis: todos,
  },
  {
    pergunta: 'Funciona sem internet?',
    resposta:
      'Não. O Coffee Break precisa de internet para salvar as vendas com segurança. Se a conexão cair, espere voltar e confira em Vendas antes de repetir uma venda.',
    papeis: todos,
  },
  {
    pergunta: 'Tenho uma dúvida que não está aqui.',
    resposta:
      'Use o botão "Dúvidas?" no canto da tela do Guia: o assistente procura a resposta, e se não achar, você manda a pergunta por e-mail para o suporte do Coffee Break.',
    papeis: todos,
  },
]

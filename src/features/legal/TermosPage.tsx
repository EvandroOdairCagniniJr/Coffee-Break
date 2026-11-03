import { Link } from 'react-router-dom'
import { PaginaLegal, Secao } from '@/features/legal/PaginaLegal'
import { empresa } from '@/lib/empresa'

export function TermosPage() {
  return (
    <PaginaLegal titulo="Termos de Uso">
      <p>
        Estes Termos explicam as regras para usar o {empresa.produto}, sistema de gestão para padarias
        e cafeterias acessado pela internet. Ao criar a conta ou continuar usando o sistema, você
        declara que leu e aceita estes Termos e a{' '}
        <Link to="/privacidade" className="underline underline-offset-2">
          Política de Privacidade
        </Link>
        .
      </p>

      <Secao titulo="1. Quem oferece o serviço">
        <p>
          O {empresa.produto} é oferecido por <strong>{empresa.responsavel}</strong>, {empresa.tipo},
          inscrito no CNPJ <strong>{empresa.cnpj}</strong>. Atendimento, dúvidas e pedidos sobre
          dados pessoais: <strong>{empresa.email}</strong>.
        </p>
      </Secao>

      <Secao titulo="2. O que o sistema faz">
        <p>
          Ponto de venda (PDV), caixa, estoque, produção e fichas técnicas, encomendas, promoções,
          metas, análise de vendas, margens, contas a pagar e receber, cadastro da equipe e
          comprovantes de venda. As funções podem mudar e melhorar com o tempo; mudanças que
          tirem algo importante serão avisadas antes.
        </p>
      </Secao>

      <Secao titulo="3. Contas e acesso">
        <ul>
          <li>
            Quem cadastra a padaria (o <strong>dono</strong>) responde pela conta da padaria, pelas
            informações que cadastra e por quem convida para a equipe.
          </li>
          <li>
            Cada pessoa usa a <strong>própria conta</strong>. Não compartilhe a senha: tudo o que é
            registrado fica no nome de quem está logado.
          </li>
          <li>
            Suspeita de uso indevido? Troque a senha e use "Sair de todos os aparelhos" no seu
            perfil, e avise o responsável.
          </li>
          <li>O sistema é destinado a maiores de 18 anos, para uso profissional.</li>
        </ul>
      </Secao>

      <Secao titulo="4. Uso permitido">
        <p>É proibido usar o {empresa.produto} para:</p>
        <ul>
          <li>atividades ilegais, fraude ou sonegação;</li>
          <li>tentar acessar dados de outras padarias, burlar a segurança ou sobrecarregar o sistema;</li>
          <li>copiar, revender ou fazer engenharia reversa do software sem autorização.</li>
        </ul>
        <p>Contas que descumprirem estas regras podem ser suspensas.</p>
      </Secao>

      <Secao titulo="5. Documentos fiscais (importante)">
        <p>
          O {empresa.produto} <strong>não emite documentos fiscais</strong> (NFC-e, NF-e, SAT, cupom
          fiscal). O comprovante de venda do sistema traz a frase "Documento sem valor fiscal" e
          serve só como recibo para o cliente.
        </p>
        <p>
          Cada padaria continua responsável por emitir os documentos fiscais exigidos pelo seu estado
          e município, inclusive as mudanças da reforma tributária (IBS e CBS), e por conferir os
          relatórios com o seu contador. Os números do sistema ajudam na gestão, mas não substituem
          a contabilidade.
        </p>
      </Secao>

      <Secao titulo="6. Dados e privacidade">
        <p>
          Os dados que a padaria cadastra (vendas, produtos, clientes de encomendas, equipe) são da
          padaria. Para esses dados, a <strong>padaria é a controladora</strong> e o{' '}
          {empresa.produto} é o <strong>operador</strong>: trata os dados só para prestar o serviço,
          seguindo as instruções da padaria e a Lei Geral de Proteção de Dados (Lei 13.709/2018).
        </p>
        <p>
          O dono deve cadastrar só os dados necessários da equipe e dos clientes, com uma base legal
          (por exemplo, o contrato de trabalho ou a encomenda), e informar essas pessoas. Detalhes na{' '}
          <Link to="/privacidade" className="underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </p>
      </Secao>

      <Secao titulo="7. Preço">
        <p>
          O uso está gratuito neste momento. Se houver cobrança no futuro, os valores e as condições
          serão informados com pelo menos 30 dias de antecedência, e ninguém será cobrado sem
          concordar.
        </p>
      </Secao>

      <Secao titulo="8. Disponibilidade e suporte">
        <p>
          Fazemos o possível para manter o sistema no ar e seguro, mas podem ocorrer interrupções
          por manutenção, falhas da internet ou dos provedores de hospedagem. Recomendamos que a
          padaria exporte periodicamente os dados importantes. Problemas: {empresa.email}.
        </p>
      </Secao>

      <Secao titulo="9. Propriedade intelectual">
        <p>
          O software, a marca e o visual do {empresa.produto} pertencem ao seu responsável (Lei
          9.609/1998 e Lei 9.279/1996). A padaria recebe uma licença de uso, pessoal e não
          exclusiva, enquanto usar o serviço. Os dados cadastrados continuam sendo da padaria.
        </p>
      </Secao>

      <Secao titulo="10. Responsabilidades">
        <p>
          Respondemos pelos danos causados por falhas do serviço, nos termos do Código de Defesa do
          Consumidor (Lei 8.078/1990), quando aplicável. Não respondemos por decisões de negócio
          tomadas com base nos relatórios, por dados cadastrados errado pelos usuários, por falta
          de emissão de documentos fiscais pela padaria ou por uso da conta por terceiros com a
          senha do usuário.
        </p>
      </Secao>

      <Secao titulo="11. Encerramento da conta">
        <p>
          A padaria pode parar de usar o sistema quando quiser e pedir a exclusão dos dados pelo
          e-mail {empresa.email}. Antes, cada pessoa pode baixar seus dados em "Editar perfil →
          Baixar meus dados". Os dados são apagados em até 30 dias, exceto o que a lei obriga a
          guardar, como os registros de acesso (Marco Civil da Internet, Lei 12.965/2014, art. 15),
          que ficam guardados com sigilo pelo prazo legal.
        </p>
      </Secao>

      <Secao titulo="12. Mudanças nestes Termos">
        <p>
          Podemos atualizar estes Termos. Mudanças relevantes são avisadas no sistema e pedem um novo
          aceite no próximo acesso. A versão e a data em vigor aparecem no topo desta página.
        </p>
      </Secao>

      <Secao titulo="13. Lei e foro">
        <p>
          Valem as leis do Brasil. Para clientes que sejam consumidores, o foro é o do domicílio do
          consumidor; nos demais casos, as partes escolhem o foro do domicílio do responsável pelo{' '}
          {empresa.produto}.
        </p>
      </Secao>
    </PaginaLegal>
  )
}

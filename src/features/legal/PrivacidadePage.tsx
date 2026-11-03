import { Link } from 'react-router-dom'
import { PaginaLegal, Secao } from '@/features/legal/PaginaLegal'
import { empresa } from '@/lib/empresa'

export function PrivacidadePage() {
  return (
    <PaginaLegal titulo="Política de Privacidade">
      <p>
        Esta Política explica, em linguagem simples, quais dados pessoais o {empresa.produto} trata,
        para quê, com quem compartilha, por quanto tempo guarda e como você exerce seus direitos,
        conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018) e o Marco Civil da Internet
        (Lei 12.965/2014).
      </p>

      <Secao titulo="1. Quem é o responsável e como falar com a gente">
        <p>
          {empresa.responsavel}, {empresa.tipo}, CNPJ {empresa.cnpj}. Canal para assuntos de
          privacidade e proteção de dados (encarregado): <strong>{empresa.email}</strong>.
        </p>
      </Secao>

      <Secao titulo="2. Quem decide sobre cada dado">
        <ul>
          <li>
            <strong>Dados da conta do dono e da padaria</strong> (cadastro, login, e-mail): o{' '}
            {empresa.produto} é o <strong>controlador</strong>.
          </li>
          <li>
            <strong>Dados que a padaria cadastra</strong> sobre a equipe e os clientes (por exemplo,
            CPF de um funcionário ou o telefone de quem fez uma encomenda): a{' '}
            <strong>padaria é a controladora</strong> e o {empresa.produto} é o{' '}
            <strong>operador</strong>, que trata esses dados só para prestar o serviço, conforme as
            instruções da padaria.
          </li>
        </ul>
      </Secao>

      <Secao titulo="3. Quais dados tratamos">
        <ul>
          <li>
            <strong>Conta:</strong> nome, e-mail, senha (guardada só como código irreversível, o hash),
            foto e cargo, se a pessoa quiser, e o papel no sistema (dono, gerente ou funcionário).
          </li>
          <li>
            <strong>Dados da equipe cadastrados pela padaria</strong> (todos opcionais): telefone, CPF,
            data de nascimento, data de admissão, turno, endereço, contato de emergência e observações.
          </li>
          <li>
            <strong>Clientes de encomendas:</strong> nome, telefone e, se for entrega, endereço.
          </li>
          <li>
            <strong>Dados da padaria:</strong> nome, razão social, CNPJ, endereço, contatos e logo.
          </li>
          <li>
            <strong>Documentos para a liberação:</strong> os arquivos que o dono envia na análise do
            cadastro, como o cartão CNPJ, o alvará e um documento com foto do responsável.
          </li>
          <li>
            <strong>Uso do sistema:</strong> vendas, caixa, estoque, produção e quem registrou cada ação.
          </li>
          <li>
            <strong>Registros de acesso:</strong> data e hora de entradas, falhas de login e trocas de
            senha, com o endereço IP e o navegador usado.
          </li>
        </ul>
        <p>Não tratamos dados sensíveis (saúde, religião, biometria etc.) e não pedimos esses dados.</p>
      </Secao>

      <Secao titulo="4. Para que usamos e com qual base legal">
        <ul>
          <li>
            <strong>Prestar o serviço</strong> (login, vendas, caixa, comprovantes, equipe): execução
            de contrato (LGPD, art. 7º, V).
          </li>
          <li>
            <strong>Segurança</strong> (bloquear tentativas de invasão, registrar acessos, impedir
            fraude): legítimo interesse (art. 7º, IX) e cumprimento de obrigação legal (art. 7º, II).
          </li>
          <li>
            <strong>Guardar os registros de acesso</strong> pelo prazo da lei: obrigação legal (Marco
            Civil, art. 15).
          </li>
          <li>
            <strong>Recuperar a senha</strong> (envio de código por e-mail): execução de contrato.
          </li>
          <li>
            <strong>Analisar e liberar o cadastro da padaria</strong> (conferir os dados e os
            documentos enviados e prevenir fraude): procedimentos preliminares do contrato (art. 7º,
            V) e legítimo interesse (art. 7º, IX). Só a administração do Coffee Break vê esses
            documentos.
          </li>
          <li>
            Para os dados da equipe e dos clientes, a base legal é definida pela padaria, por exemplo o
            contrato de trabalho ou a própria encomenda.
          </li>
        </ul>
        <p>Não vendemos dados pessoais e não usamos dados para publicidade.</p>
      </Secao>

      <Secao titulo="5. Cookies e armazenamento no navegador">
        <p>
          Usamos <strong>um único cookie, essencial</strong>, para manter você logado
          ("padaria_token": protegido contra leitura por scripts, válido por até 7 dias). Também
          guardamos no seu navegador preferências simples, como "já vi o vídeo de boas-vindas" e "guias
          que já aprendi". Não usamos cookies de publicidade, de rastreamento ou de terceiros.
        </p>
      </Secao>

      <Secao titulo="6. Com quem compartilhamos">
        <p>Só com fornecedores necessários para o sistema funcionar (operadores), sob contrato:</p>
        <ul>
          <li>
            <strong>Render</strong> (hospedagem do sistema, Estados Unidos).
          </li>
          <li>
            <strong>Supabase</strong> (banco de dados, servidores da Amazon Web Services nos Estados
            Unidos).
          </li>
          <li>
            <strong>Provedor de e-mail</strong> (envio do código de recuperação de senha).
          </li>
          <li>
            <strong>ViaCEP</strong> (o CEP digitado num cadastro é consultado para preencher o endereço;
            só o CEP é enviado).
          </li>
        </ul>
        <p>Também podemos compartilhar dados quando a lei ou uma ordem judicial exigir.</p>
      </Secao>

      <Secao titulo="7. Transferência internacional">
        <p>
          Como a hospedagem e o banco de dados ficam nos Estados Unidos, os dados são transferidos
          para fora do Brasil (LGPD, art. 33). Usamos fornecedores com compromissos contratuais de
          proteção de dados, e os dados trafegam e ficam guardados criptografados.
        </p>
      </Secao>

      <Secao titulo="8. Como protegemos os dados">
        <ul>
          <li>Conexões sempre com HTTPS, e com verificação do certificado também até o banco de dados.</li>
          <li>Senhas guardadas só como hash (bcrypt); ninguém, nem a equipe do sistema, vê a sua senha.</li>
          <li>Cada padaria só enxerga os próprios dados; cada papel só vê o que precisa.</li>
          <li>Bloqueio após várias senhas erradas e limite de tentativas contra robôs.</li>
          <li>Testes automáticos de segurança a cada mudança no sistema.</li>
        </ul>
        <p>
          Se acontecer um incidente de segurança que possa trazer risco ou dano relevante, avisaremos
          a Autoridade Nacional de Proteção de Dados (ANPD) e as pessoas afetadas, nos prazos da lei.
        </p>
      </Secao>

      <Secao titulo="9. Por quanto tempo guardamos">
        <ul>
          <li>Dados da conta e da padaria: enquanto a conta existir.</li>
          <li>
            Registros de acesso: 1 ano (o Marco Civil exige no mínimo 6 meses), depois são apagados
            automaticamente.
          </li>
          <li>Código de recuperação de senha: 15 minutos.</li>
          <li>
            Documentos enviados para a liberação: enquanto a conta existir. Se o cadastro for recusado
            e não for corrigido, são apagados automaticamente depois de 6 meses.
          </li>
          <li>
            Aceites dos Termos e da Política e assinaturas do contrato (nome, e-mail, data e hora, IP,
            navegador, versão e código de integridade do texto), junto com o texto inteiro de cada
            versão: guardados mesmo depois do encerramento da conta, sem alteração, enquanto puderem
            servir de prova (até 10 anos), para o exercício regular de direitos (LGPD, arts. 7º, VI,
            e 16).
          </li>
          <li>
            Vendas e registros da padaria: enquanto a padaria usar o sistema. Prazos fiscais (em geral, 5
            anos) são responsabilidade da padaria, que pode exportar os dados.
          </li>
          <li>
            Ao encerrar a conta, apagamos os dados em até 30 dias, exceto o que a lei obriga a guardar.
          </li>
        </ul>
      </Secao>

      <Secao titulo="10. Seus direitos">
        <p>Pela LGPD (art. 18), você pode pedir:</p>
        <ul>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, errados ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei;</li>
          <li>portabilidade e informação sobre com quem compartilhamos;</li>
          <li>revisão de decisões automatizadas, eliminação de dados tratados com consentimento e revogação do consentimento.</li>
        </ul>
        <p>Como fazer:</p>
        <ul>
          <li>
            <strong>Baixar seus dados:</strong> no sistema, clique no seu nome, embaixo do menu →
            "Baixar meus dados".
          </li>
          <li>
            <strong>Corrigir:</strong> no próprio perfil. Dados cadastrados pela padaria podem ser
            corrigidos pelo dono, em Equipe.
          </li>
          <li>
            <strong>Outros pedidos:</strong> pelo e-mail {empresa.email}. Respondemos em até 15 dias.
          </li>
          <li>
            Funcionários e clientes de uma padaria podem falar direto com a padaria, que é a
            controladora; nós ajudamos a padaria a atender.
          </li>
        </ul>
        <p>
          Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD), em gov.br/anpd.
        </p>
      </Secao>

      <Secao titulo="11. Mudanças nesta Política">
        <p>
          Quando esta Política mudar de forma relevante, avisamos no sistema e pedimos um novo aceite.
          A versão e a data em vigor aparecem no topo desta página. Veja também os{' '}
          <Link to="/termos" className="underline underline-offset-2">
            Termos de Uso
          </Link>
          .
        </p>
      </Secao>
    </PaginaLegal>
  )
}

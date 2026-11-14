# Stock & Order — starter

Aplicação PWA inicial para preparar encomendas a vários fornecedores.

## O que já está nesta primeira base
- Interface responsiva refinada para computador, tablet e telemóvel, com ajustes específicos para ecrãs estreitos.
- Encomenda atual com quantidades, confirmação e remoção.
- Catálogo local de produtos.
- Associação de produto a fornecedor.
- Campo para código de barras.
- Fotografia do produto pela câmara ou galeria.
- Persistência local no dispositivo para demonstração.

## Estado desta versão
- Foi feita uma primeira passagem de aperfeiçoamento do layout responsivo, incluindo a lista de encomenda em cartões mais legíveis em telemóvel, grelha do catálogo adaptável e estados de foco visíveis.
- A indicação de cloud foi clarificada para não sugerir que existe sincronização ativa: as credenciais, por si só, ainda não ligam a aplicação às operações Supabase.

## O que ainda precisa de ligação/configuração
Esta é uma base inicial de desenvolvimento, não uma aplicação multiutilizador publicada. A interface ainda usa dados locais de demonstração. Para sincronizar entre até 5 pessoas, é necessário:
1. Criar um projeto Supabase gratuito.
2. Executar `supabase/schema.sql` no SQL Editor.
3. Configurar autenticação e convite dos membros.
4. Ligar as operações do frontend às tabelas Supabase e ao Storage.
5. Configurar as variáveis `.env` a partir de `.env.example`.
6. Publicar a aplicação num alojamento HTTPS.

Nunca colocar a chave `service_role` no frontend. Usar apenas a chave pública/anon com políticas RLS corretamente configuradas.

## Executar localmente
Requer Node.js 20 ou superior.

```bash
npm install
cp .env.example .env
npm run dev
```

Sem credenciais Supabase, a aplicação abre em modo demonstração e guarda os dados apenas no browser/dispositivo atual.

## Leitura de códigos de barras e reconhecimento
A captura de fotografia já está preparada. A leitura EAN pela câmara e a identificação automática ainda não estão implementadas. Próxima etapa recomendada:
- integrar um leitor EAN compatível com browsers móveis;
- procurar o código no catálogo local primeiro;
- permitir preencher/confirmar nome, marca, formato e fornecedor quando não houver correspondência;
- só depois avaliar uma API externa de identificação de produtos.

## Segurança e limites
- O esquema SQL inicial inclui isolamento por espaço de trabalho via RLS, mas precisa de um fluxo seguro de criação do espaço e convites antes de produção.
- O limite de cinco membros deve ser validado no processo de convite/entrada, não apenas na interface.
- Fotografias devem ser guardadas no Supabase Storage, não como base64 na base de dados.
- Para utilização real, testar permissões, cópias de segurança, sincronização simultânea e recuperação de conta.

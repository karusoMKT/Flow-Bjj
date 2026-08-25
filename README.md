# Jiu-Jitsu Flow

Atue como um Desenvolvedor Front-end Sênior e Especialista em UI/UX. Estamos construindo o Flow, um SaaS social focado em praticantes de Jiu-Jitsu.

Contexto da Arquitetura: Já conectei meu projeto Supabase via Connectors. Não use o Lovable Cloud. Todo o frontend deve ser construído em React com Tailwind CSS, consumindo diretamente as minhas tabelas existentes no Supabase (profiles, gyms, sessions, follows, likes, comments).

Diretrizes de Design:

Abordagem Mobile-first.

Tema estritamente Dark Mode (#121212 para fundos, tons de cinza escuro para cards, azul vibrante para botões de ação).

Siga fielmente o layout e a identidade visual das imagens PNG anexadas.

Tarefas Iniciais (Construção das Telas e Lógica):

Tela de Autenticação (Login/Cadastro):

Crie uma tela de entrada limpa.

Use Email e Senha para autenticação utilizando supabase.auth.signInWithPassword e supabase.auth.signUp.

Após o login com sucesso, redirecione o usuário para a rota /home.

Tela Principal (Home/Feed):

Crie um feed vertical rolável.

O feed deve exibir os treinos (sessions) recentes, mostrando quem treinou, a academia, faixa e há quanto tempo.

Inclua uma barra de navegação inferior (Bottom Navigation) com ícones para Home, Check-in (Treino) e Perfil.

Tela de Perfil:

Exiba os dados vindos da tabela profiles (Nome, Equipe, Professor, Faixa e Graus).

Mostre um resumo ou histórico dos treinos do usuário.

Por favor, crie as rotas, monte a estrutura base do projeto e construa a Tela de Autenticação primeiro para testarmos a conexão.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/84386ec2-62df-4069-85f2-9597ddb962d6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

# Inventário de telas e perfis

Este inventário relaciona cada papel do domínio com a experiência disponível na demonstração.

| Perfil | Entrada | Principais capacidades | Estado |
| --- | --- | --- | --- |
| Administrador da plataforma | `#/admin-plataforma` | Organizadoras, planos, implantação e saúde dos serviços | Implementado |
| Administrador da organizadora | `#/` | Sala de Guerra, eventos, expositores, fornecedores, equipes, importação e configurações | Implementado |
| Gestor da feira | `#/gestor` | Decisões críticas, riscos, escalonamentos e avaliação de fornecedores | Implementado |
| Produtor da organizadora | `#/organizador/producao` | Rondas, triagem presencial, reaberturas e intervenção em chamados | Implementado |
| Atendimento da organizadora | `#/organizador/atendimento` | Relacionamento, validações, impedimentos e exceções de fornecedores | Implementado |
| Administrador do fornecedor | `#/fornecedor` | Clientes, escopos, equipe e desempenho da empresa | Implementado |
| Atendimento do fornecedor | `#/fornecedor/atendimento` | Aceite, distribuição de produtores, comunicação e impedimentos | Implementado |
| Produtor do fornecedor | `#/fornecedor/producao` | Fila inteligente, deslocamento, aceite, execução, causa técnica e conclusão | Implementado |
| Responsável do expositor | `#/portal` | Documentos, responsáveis, chamados e validação de solução | Implementado |
| Equipe do expositor | `#/portal` | Mesma experiência do expositor, com permissões limitadas pelo backend | Implementado em interface compartilhada |

## Acesso e navegação

- `#/entrar`: entrada white label do evento.
- `#/perfis`: seletor de perfis para testar todas as experiências sem autenticação real.
- O avatar do painel administrativo abre o seletor de perfis.
- Os painéis operacionais possuem navegação responsiva e atalho para trocar de perfil.

## Módulos transversais concluídos

- Sala de Guerra e fila inteligente.
- Gestão de eventos e períodos operacionais.
- Chamados, SLA, escalonamento, reabertura e correção da causa técnica.
- Expositores, documentos e criticidade interna.
- Fornecedores e matriz de responsabilidade por categoria e fase.
- Equipes, disponibilidade, produtor secundário e cobertura.
- Relatórios e ranking de fornecedores.
- Usuários e matriz de permissões.
- Central de notificações e canais.
- Importação CSV e API de lotes.
- Portal white label do expositor em três idiomas.

## Módulos previstos para etapas posteriores

Estes itens são módulos adicionais do produto e não representam perfis sem tela:

- Mapa interativo da feira com leitura de PDF/DWG.
- Marketplace e pagamento de itens extras.
- Autenticação real e aplicação das permissões no Firebase.
- Integrações de produção com Resend e WhatsApp.
- Sincronização em tempo real dos painéis com Firestore.

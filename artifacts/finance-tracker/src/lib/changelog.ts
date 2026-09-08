export interface Release {
  version: string;
  date?: string;
  changes: { type: "feat" | "fix"; text: string }[];
}

// Entrada nova sempre no topo — a versão exibida no app vem daqui.
export const CHANGELOG: Release[] = [
  {
    version: "2.7",
    date: "2026-09-08",
    changes: [
      {
        type: "feat",
        text: "Botão \"Ler patch notes\" ao lado da versão, em Configurações, com o histórico de mudanças de cada versão.",
      },
    ],
  },
  {
    version: "2.6",
    date: "2026-09-08",
    changes: [
      {
        type: "fix",
        text: "Lançar uma despesa na categoria \"Contas\" criava a transação e a conta ao mesmo tempo. Se você marcasse essa conta como paga, o valor era descontado duas vezes do saldo. Agora cria apenas a conta, já marcada como paga.",
      },
    ],
  },
  {
    version: "2.5",
    date: "2026-09-08",
    changes: [
      {
        type: "fix",
        text: "Contas marcadas como pagas podiam voltar a aparecer como não pagas ao recarregar o app. O estado de pagamento não era gravado na nuvem, e o valor da conta reaparecia somado ao Saldo Disponível.",
      },
    ],
  },
  {
    version: "2.4",
    date: "2026-09-08",
    changes: [
      {
        type: "feat",
        text: "O card \"Economizado mês anterior\" agora pode ser editado direto no Dashboard. O Saldo Disponível acompanha a alteração.",
      },
      {
        type: "feat",
        text: "O backup exportado em Configurações passou a incluir também as contas fixas e o saldo inicial.",
      },
    ],
  },
  {
    version: "2.3",
    changes: [
      {
        type: "feat",
        text: "Registro rápido no Dashboard: escreva ou fale a frase (\"gastei 32,90 no uber ontem\") e a IA monta os lançamentos para você conferir antes de salvar.",
      },
      {
        type: "feat",
        text: "Gráfico de rosca dos gastos por categoria, com ícone em cada fatia e barra de progresso do limite.",
      },
      {
        type: "feat",
        text: "Limite de gastos por categoria, com painel de filtro recolhível e menu de contexto nos chips.",
      },
      {
        type: "fix",
        text: "\"Economizado mês anterior\" passou a somar o acumulado real de todos os meses anteriores, e não apenas o mês imediatamente anterior.",
      },
    ],
  },
];

export const APP_VERSION = CHANGELOG[0].version;

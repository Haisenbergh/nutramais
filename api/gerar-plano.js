import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Garantir que seja um método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Obter cabeçalhos do ambiente ou do arquivo .env.local
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Configuração do Supabase ausente no servidor.' });
  }

  if (!googleApiKey) {
    return res.status(500).json({ error: 'Chave da API do Google Gemini ausente no servidor.' });
  }

  // Extrair o token JWT do cabeçalho de autorização para segurança em RLS
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Não autorizado. Cabeçalho de autorização ausente.' });
  }

  const { pacienteId } = req.body;
  if (!pacienteId) {
    return res.status(400).json({ error: 'ID do paciente é obrigatório.' });
  }

  try {
    // Inicializar o cliente do Supabase passando o cabeçalho Authorization do usuário autenticado.
    // Isso garante segurança absoluta: se o nutricionista não tiver acesso a este paciente, o RLS impedirá a leitura.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Buscar dados completos do paciente
    const { data: paciente, error: pacienteError } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', pacienteId)
      .single();

    if (pacienteError || !paciente) {
      console.error('Erro ao buscar paciente:', pacienteError);
      return res.status(404).json({ error: 'Paciente não encontrado ou acesso não autorizado.' });
    }

    // Calcular idade do paciente para enriquecer os dados do prompt
    let idadeStr = 'Não informada';
    if (paciente.data_nascimento) {
      const hoje = new Date();
      const nascimento = new Date(paciente.data_nascimento);
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const m = hoje.getMonth() - nascimento.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }
      idadeStr = `${idade} anos`;
    }

    // Formatar arrays para strings legíveis
    const formatarArray = (arr) => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) return 'Nenhum';
      return arr.filter(item => item !== 'Nenhum').join(', ') || 'Nenhum';
    };

    // Montar o perfil detalhado do paciente para a IA
    const dadosPacienteFormatados = `
- Nome: ${paciente.nome}
- Idade: ${idadeStr}
- Sexo: ${paciente.sexo || 'Não informado'}
- Peso Inicial: ${paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não informado'}
- Altura: ${paciente.altura ? `${paciente.altura} cm` : 'Não informado'}
- Nível de Atividade Física: ${paciente.nivel_atividade || 'Não informado'}
- Pratica Atividade Física: ${paciente.atividade_fisica ? `Sim (${paciente.atividade_fisica_descricao || 'Sem descrição'})` : 'Não'}
- Objetivos Alimentares: ${formatarArray(paciente.objetivos)}
- Detalhamento do Objetivo: ${paciente.objetivo_texto || 'Nenhum detalhe adicional'}
- Patologias / Condições de Saúde: ${formatarArray(paciente.patologias)} ${paciente.patologia_livre ? `(Outra: ${paciente.patologia_livre})` : ''}
- Restrições Alimentares: ${formatarArray(paciente.restricoes_alimentares)} ${paciente.restricao_livre ? `(Outra: ${paciente.restricao_livre})` : ''}
- Alergias Alimentares: ${formatarArray(paciente.alergias)} ${paciente.alergia_livre ? `(Outra: ${paciente.alergia_livre})` : ''}
- Medicamentos em Uso: ${paciente.medicamentos || 'Nenhum'}
- Suplementos em Uso: ${paciente.suplementos || 'Nenhum'}
- Refeições Desejadas por Dia: ${paciente.refeicoes_por_dia || 5} refeições
- Consumo de Água Estimado: ${paciente.litros_agua ? `${paciente.litros_agua} L/dia` : 'Não informado'}
- Rotina Diária: Acorda às ${paciente.horario_acorda || 'Não informado'} / Dorme às ${paciente.horario_dorme || 'Não informado'}
- Observações Adicionais: ${paciente.observacoes || 'Nenhuma'}
`.trim();

    // Inicializar o SDK do Google Generative AI
    const genAI = new GoogleGenerativeAI(googleApiKey);
    
    // Configurar o modelo gemini-2.5-flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const prompt = `
Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosPacienteFormatados}

⚠️ Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    },
    {
      "dia": "Terça-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    },
    {
      "dia": "Quarta-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    },
    {
      "dia": "Quinta-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    },
    {
      "dia": "Sexta-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    },
    {
      "dia": "Sábado",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    },
    {
      "dia": "Domingo",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}
`.trim();

    // Executar a chamada ao Gemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Adicionar um try/catch no parse do JSON para resiliência extra
    try {
      const planoJson = JSON.parse(responseText);
      
      // Retornar o JSON de sucesso
      return res.status(200).json(planoJson);
    } catch (parseError) {
      console.error('Erro de parseamento do JSON retornado pela IA:', parseError, responseText);
      return res.status(500).json({
        error: 'A IA gerou um plano estruturado incorretamente. Por favor, tente novamente.',
        rawResponse: responseText
      });
    }

  } catch (error) {
    console.error('Erro na geração do plano com IA:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor ao gerar plano alimentício.' });
  }
}

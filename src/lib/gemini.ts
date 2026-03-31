import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateAIContent(prompt: string, systemInstruction?: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: systemInstruction || "Você é um assistente especializado em licitações públicas brasileiras.",
    },
  });
  return response.text;
}

export async function analyzeEdict(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            text: `Você é um especialista em licitações públicas brasileiras (Lei 14.133/2021). 
            Analise o seguinte texto de edital e extraia as informações estruturadas em JSON:
            
            - title: Um título curto para o edital (ex: Pregão 08/2024 - Prefeitura de SP)
            - organ: O órgão licitante
            - object: Descrição clara do objeto da licitação
            - items: Lista de itens com { description, quantity, estimatedValue }
            - documents: Lista de documentos exigidos com { name, category (Jurídica, Fiscal, Técnica, Econômica, Especial), required (boolean) }
            - deadlines: Datas importantes com { event, date, description }
            
            Texto do Edital:
            ${text}`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          organ: { type: Type.STRING },
          object: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                estimatedValue: { type: Type.STRING }
              }
            }
          },
          documents: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                required: { type: Type.BOOLEAN }
              }
            }
          },
          deadlines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                event: { type: Type.STRING },
                date: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          }
        },
        required: ["title", "organ", "object", "items", "documents", "deadlines"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function extractCompanyData(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      {
        parts: [
          {
            text: `Você é um assistente especializado em extrair dados cadastrais de empresas brasileiras a partir de documentos (como cartões CNPJ, contratos sociais, etc.).
            Extraia as seguintes informações em JSON:
            
            - name: Razão Social ou Nome Fantasia
            - cnpj: CNPJ formatado
            - address: Endereço completo
            - phone: Telefone de contato
            
            Texto do Documento:
            ${text}`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          cnpj: { type: Type.STRING },
          address: { type: Type.STRING },
          phone: { type: Type.STRING }
        },
        required: ["name", "cnpj", "address", "phone"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function getAIConsultantResponse(message: string, context?: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      {
        parts: [
          {
            text: `Você é o "Licitador IA", um consultor sênior especializado em licitações públicas brasileiras. 
            Seu objetivo é ajudar o usuário a vencer licitações, explicando termos técnicos, sugerindo estratégias e tirando dúvidas sobre a Lei 14.133/2021.
            
            Contexto Atual (se houver):
            ${context || "Nenhum contexto específico fornecido."}
            
            Pergunta do Usuário:
            ${message}`
          }
        ]
      }
    ],
    config: {
      systemInstruction: "Seja profissional, direto e use termos técnicos quando necessário, mas explique-os de forma simples.",
    },
  });
  return response.text;
}

export async function generateDashboardInsights(proposals: any[], edicts: any[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      {
        parts: [
          {
            text: `Analise o resumo das atividades da empresa em licitações e forneça 3 insights estratégicos curtos (máximo 150 caracteres cada).
            
            Propostas: ${JSON.stringify(proposals)}
            Editais Analisados: ${JSON.stringify(edicts)}
            
            Retorne em JSON:
            - insights: [string, string, string]
            - overallStatus: "Excelente", "Bom", "Atenção" ou "Crítico"
            - recommendation: Uma recomendação principal acionável.`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          insights: { type: Type.ARRAY, items: { type: Type.STRING } },
          overallStatus: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        },
        required: ["insights", "overallStatus", "recommendation"]
      }
    }
  });
  return JSON.parse(response.text);
}

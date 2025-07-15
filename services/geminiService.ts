
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Category, AISettings } from '../types';

const getAIClient = (apiKey: string) => {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const suggestCategoriesForTransaction = async (
  payee: string,
  description: string,
  categories: Category[],
  settings: AISettings
): Promise<string | null> => {
  if (!settings.enabled || !settings.apiKey) return null;

  const ai = getAIClient(settings.apiKey);
  if (!ai) return null;
  
  if (settings.provider === 'gemini') {
      const model = "gemini-2.5-flash";
      const categoryNames = categories.map(c => c.name).join(', ');

      const prompt = `
        Based on the following transaction details, which of these categories is the best fit?
        Payee: "${payee}"
        Description: "${description}"
        
        Available categories: ${categoryNames}
        
        Respond with ONLY the name of the most appropriate category from the list. If no category fits well, respond with "Uncategorized".
      `;

      try {
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            temperature: 0.1,
            thinkingConfig: { thinkingBudget: 0 }
          }
        });

        const suggestedCategoryName = response.text.trim();
        const foundCategory = categories.find(c => c.name.toLowerCase() === suggestedCategoryName.toLowerCase());
        
        return foundCategory ? foundCategory.id : 'uncategorized';

      } catch (error) {
        console.error("Error calling Gemini API:", error);
        return null;
      }
  }
  // Future providers can be added here
  // else if (settings.provider === 'deepseek') { ... }
  
  return null;
};

export const suggestCategoriesForTransactionsBatch = async (
    transactions: { id: string; payee: string; description: string }[],
    categories: Category[],
    settings: AISettings
): Promise<{ id: string; suggestedCategoryName: string }[] | null> => {
    if (!settings.enabled || !settings.apiKey || transactions.length === 0) return null;
    const ai = getAIClient(settings.apiKey);
    if (!ai) return null;

    if (settings.provider === 'gemini') {
        const model = "gemini-2.5-flash";
        const categoryNames = categories.map(c => c.name).join(', ');
        const transactionsJsonString = JSON.stringify(transactions);

        const prompt = `
            Given the following list of bank transactions and a list of available categories,
            suggest the most appropriate category for each transaction.

            Available Categories:
            ${categoryNames}

            Transactions (JSON format):
            ${transactionsJsonString}

            Respond with a JSON array where each object contains the original transaction "id"
            and the "suggestedCategoryName". The category name must be one of the available categories.
            If no category is a good fit, use "Uncategorized".
        `;
        
        const schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              suggestedCategoryName: { type: Type.STRING },
            },
            required: ['id', 'suggestedCategoryName'],
          }
        };

        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    temperature: 0.1,
                }
            });
            
            return JSON.parse(response.text);

        } catch (error) {
            console.error("Error calling Gemini API for batch processing:", error);
            return null;
        }
    }
    return null;
};


export const testAIApiKey = async (settings: AISettings): Promise<{success: boolean, message: string}> => {
    if (!settings.apiKey) {
        return { success: false, message: "API Key is missing." };
    }
    const ai = getAIClient(settings.apiKey);
    if (!ai) {
        return { success: false, message: "Failed to initialize AI client." };
    }

    if (settings.provider === 'gemini') {
        try {
            await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "hello" });
            return { success: true, message: "Gemini API key is valid!" };
        } catch (error: any) {
            console.error("Gemini API test failed:", error);
            return { success: false, message: `Gemini API test failed: ${error.message || 'Check console for details.'}` };
        }
    }

    return { success: false, message: "Selected AI provider is not supported yet." };
};

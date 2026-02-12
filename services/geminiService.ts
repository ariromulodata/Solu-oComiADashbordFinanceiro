
import { GoogleGenAI } from "@google/genai";
import { VexpensesDashboardData } from "../types";

/**
 * Generates financial insights using Gemini API based on the Vexpenses dashboard data.
 * Fixes the DashboardData import error and aligns with the @google/genai guidelines.
 */
export const getFinancialInsights = async (data: VexpensesDashboardData): Promise<string> => {
  // Always use { apiKey: process.env.API_KEY } for initialization.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    As a senior financial analyst, provide a concise executive summary of this corporate expense performance.
    Data:
    - Total Expenses: R$ ${data.summary.totalExpenses.toLocaleString('pt-BR')}
    - Pending Refunds Count: ${data.summary.pendingRefunds.value} (Trend: ${data.summary.pendingRefunds.trend})
    - Savings Generated: ${data.summary.savingsGenerated.value} (Trend: ${data.summary.savingsGenerated.trend})
    - Corporate Card Expenses: R$ ${data.summary.corporateCardExpenses.toLocaleString('pt-BR')}
    - Average Approval Time: ${data.summary.avgApprovalTime}
    
    Format your response in Markdown with:
    1. A short overall assessment of the expense management efficiency.
    2. 3 key bullet points identifying risks or opportunities based on the trends and spending volume.
    3. One strategic recommendation for optimizing corporate spending for the next quarter.
    
    Keep it professional, concise, and data-driven.
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning/analysis tasks.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });
    
    // Access response.text as a property, not a method.
    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Error connecting to AI advisor. Please check your configuration.";
  }
};

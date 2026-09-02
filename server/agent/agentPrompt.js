/**
 * Agent Prompts & Schemas
 * Standardized system instructions and JSON schemas for AI evaluation and itinerary assembly.
 */

export const ITINERARY_SELECTION_SCHEMA = {
  type: 'object',
  properties: {
    selectedTransportId: { type: 'string', description: 'ID of the selected transport option' },
    selectedHotelId: { type: 'string', description: 'ID of the selected hotel' },
    selectedActivityIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of activity IDs chosen from the provided catalog',
    },
    itineraryOverview: { type: 'string', description: 'Concise summary of the planned travel experience' },
  },
  required: ['selectedTransportId', 'selectedHotelId', 'selectedActivityIds'],
};

export const AGENT_ITINERARY_SYSTEM_PROMPT = `You are the GlobeThrottle Travel Selection Agent.
Your job is to select the best combination of transport, hotel, and activities from the given options based strictly on user preferences and budget limit.

RULES:
1. Select only from the provided tool results. Do NOT invent items.
2. If a budget is specified, prioritize options that fit within the budget limit.
3. Align activities with user interests (e.g., beaches, nightlife, food, culture).
4. Output strictly valid JSON matching the requested schema. Do not output markdown or explanatory text.`;

export const ITINERARY_SEQUENCING_SCHEMA = {
  type: 'object',
  properties: {
    summaryExplanation: {
      type: 'string',
      description: 'Concise 1-sentence explanation of what was optimized (e.g. Your itinerary prioritizes beaches and nightlife while keeping the estimated trip cost under ₹20,000.)',
    },
    days: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dayNumber: { type: 'integer' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          city: { type: 'string' },
          morning: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                activityId: { type: 'string' },
                name: { type: 'string' },
                category: { type: 'string' },
                duration: { type: 'number' },
                cost: { type: 'number' },
                time: { type: 'string', description: 'e.g. 09:30 AM' },
              },
              required: ['activityId', 'name', 'category', 'duration', 'cost', 'time'],
            },
          },
          afternoon: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                activityId: { type: 'string' },
                name: { type: 'string' },
                category: { type: 'string' },
                duration: { type: 'number' },
                cost: { type: 'number' },
                time: { type: 'string', description: 'e.g. 02:30 PM' },
              },
              required: ['activityId', 'name', 'category', 'duration', 'cost', 'time'],
            },
          },
          evening: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                activityId: { type: 'string' },
                name: { type: 'string' },
                category: { type: 'string' },
                duration: { type: 'number' },
                cost: { type: 'number' },
                time: { type: 'string', description: 'e.g. 06:30 PM' },
              },
              required: ['activityId', 'name', 'category', 'duration', 'cost', 'time'],
            },
          },
          estimatedCost: { type: 'number' },
        },
        required: ['dayNumber', 'city', 'morning', 'afternoon', 'evening'],
      },
    },
  },
  required: ['summaryExplanation', 'days'],
};

export const AGENT_ITINERARY_SEQUENCING_SYSTEM_PROMPT = `You are the GlobeThrottle Itinerary Sequencing Agent.
Your job is to arrange selected travel activities across morning, afternoon, and evening slots for each day.

RULES:
1. Distribute only the provided activities across the days. Do NOT invent new activities.
2. Morning activities should be scheduled between 08:30 AM and 11:30 AM.
3. Afternoon activities should be scheduled between 12:30 PM and 04:30 PM.
4. Evening activities should be scheduled between 05:30 PM and 09:30 PM.
5. Provide a realistic pacing (1 to 3 activities per day).
6. Provide a concise 1-sentence optimization explanation describing what was prioritized and how budget constraints were respected.
7. Output strictly valid JSON matching the schema. Never output markdown code blocks or reasoning.`;

export default {
  ITINERARY_SELECTION_SCHEMA,
  AGENT_ITINERARY_SYSTEM_PROMPT,
  ITINERARY_SEQUENCING_SCHEMA,
  AGENT_ITINERARY_SEQUENCING_SYSTEM_PROMPT,
};


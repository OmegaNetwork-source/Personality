import { personalities } from '../data/personalities';

export interface ChatMessage {
    role: string;
    content: string;
}

export class OfflineService {
    // Simulate finding a model
    async getModels() {
        return [{ name: "offline-mode", modified_at: new Date().toISOString() }];
    }

    // Simulate chat streaming
    async *chatStream(
        message: string,
        personalityId: string,
        context: ChatMessage[] = []
    ) {
        // 1. Find the personality
        const personality = personalities.find(p => p.id === personalityId);
        let responseText = "I don't have anything to say about that.";

        if (personality) {
            // Check for Greeting Condition
            // If context is empty, it's the first message
            const isStart = !context || context.length === 0;

            if (isStart && personality.greeting_response) {
                responseText = personality.greeting_response;
            } else if (personality.canned_responses && personality.canned_responses.length > 0) {
                const randomIndex = Math.floor(Math.random() * personality.canned_responses.length);
                responseText = personality.canned_responses[randomIndex];
            }
        }

        // 2. Simulate "Thinking" (Network Latency)
        const thinkingDelay = 500 + Math.random() * 1000; // 0.5s - 1.5s
        await new Promise(resolve => setTimeout(resolve, thinkingDelay));

        // 3. Simulate "Typing" (Streaming)
        const words = responseText.split(" ");

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const prefix = i > 0 ? " " : "";
            const chunk = prefix + word;

            // Yield chunk in format mimicking backend
            const data = {
                model: "offline",
                created_at: new Date().toISOString(),
                message: { role: "assistant", content: chunk },
                done: false
            };

            yield JSON.stringify(data);

            // Simulate typing speed
            // Faster for short words, slower for long
            const typingDelay = 20 + Math.random() * 60; // 20ms - 80ms
            await new Promise(resolve => setTimeout(resolve, typingDelay));
        }

        // 4. Send Done Signal
        const finalData = {
            model: "offline",
            created_at: new Date().toISOString(),
            message: { role: "assistant", content: "" },
            done: true
        };
        yield JSON.stringify(finalData);
    }
}

export const offlineService = new OfflineService();

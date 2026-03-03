export function analyzeSentiment(text: string): { score: number; tag: string } {
  const posWords = ['love', 'amazing', 'great', 'excellent', 'awesome', 'beautiful', 'perfect', 'incredible', 'fantastic', 'wonderful', 'brilliant'];
  const negWords = ['hate', 'terrible', 'awful', 'bad', 'horrible', 'worst', 'disgusting', 'pathetic', 'ugly', 'annoying', 'boring'];

  const lowerText = text.toLowerCase();
  let score = 0.5;

  for (const word of posWords) {
    if (lowerText.includes(word)) score += 0.1;
  }

  for (const word of negWords) {
    if (lowerText.includes(word)) score -= 0.1;
  }

  score = Math.max(0, Math.min(1, score));

  let tag = 'neutral';
  if (score > 0.65) tag = 'positive';
  else if (score < 0.35) tag = 'negative';

  return { score, tag };
}

export function analyzeToxicity(text: string): number {
  const toxicPatterns = [
    /\b(hate|suck|stupid|idiot|moron|trash|garbage|disgusting|vile)\b/gi,
  ];

  let toxicityScore = 0;
  let matches = 0;

  for (const pattern of toxicPatterns) {
    const found = text.match(pattern);
    if (found) {
      matches += found.length;
    }
  }

  if (matches > 0) {
    toxicityScore = Math.min(0.9, 0.3 + (matches * 0.1));
  }

  return toxicityScore;
}

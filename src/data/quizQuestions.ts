export type Q = {
  q: string;
  opts: string[];
  answerIndex: number;
};

export const questions: Q[] = [
  {
    q: "Where did they go on their first date?",
    opts: ["Italian restaurant", "Roller rink", "Coffee shop", "Hiking trail"],
    answerIndex: 2,
  },
  {
    q: "What is the groom's go-to karaoke song?",
    opts: ["Bohemian Rhapsody", "Wonderwall", "Uptown Funk", "Total Eclipse of the Heart"],
    answerIndex: 1,
  },
  {
    q: "Who said 'I love you' first?",
    opts: ["Bride", "Groom", "It was mutual", "Their dog"],
    answerIndex: 0,
  },
];

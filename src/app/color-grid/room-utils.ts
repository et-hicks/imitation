import { WORD_LISTS } from "@/app/sevodal/word-lists";

const threeLetterWords = WORD_LISTS[3];

export function generateRoomCode(): string {
  const pick = () =>
    threeLetterWords[Math.floor(Math.random() * threeLetterWords.length)];
  return `${pick()}-${pick()}`;
}

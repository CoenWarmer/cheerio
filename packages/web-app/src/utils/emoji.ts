// Helper to check if a string is a single emoji
export const isEmoji = (str: string): boolean => {
  const emojiRegex =
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Extended_Pictographic})$/u;
  return emojiRegex.test(str.trim());
};

import { mediumPosts } from "../data/medium";
import { notes } from "../data/notes";
import { posts } from "../data/posts";

// Words a typing game shouldn't bother with — common English glue words.
const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "day", "get", "has", "him", "his",
  "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy",
  "did", "its", "let", "put", "say", "she", "too", "use", "that", "with",
  "have", "this", "will", "your", "from", "they", "know", "want", "been",
  "good", "much", "some", "time", "very", "when", "come", "here", "just",
  "like", "long", "make", "many", "more", "only", "over", "such", "take",
  "than", "them", "well", "were", "what", "into", "also", "back", "even",
  "first", "going", "their", "there", "these", "thing", "think", "those",
  "through", "where", "which", "while", "would", "about", "above", "after",
  "again", "being", "below", "between", "both", "could", "does", "doing",
  "down", "during", "each", "other", "ours", "same", "should", "then",
  "under", "until", "most", "still", "every", "because", "before", "might",
  "since", "another", "without", "however", "really", "instead", "something",
  "anything", "always", "around", "actually", "thats", "youre", "dont",
  "doesnt", "isnt", "wont", "cant", "didnt", "heres", "lets", "youll",
]);

export interface WordBuckets {
  short: string[];
  medium: string[];
  long: string[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

// Harvest the game's vocabulary from the site's actual writing — every word
// the player shoots down came from one of Rameez's posts or notes.
export function buildWordPool(): WordBuckets {
  const corpus = [
    ...posts.map((p) => `${p.title} ${p.tags.join(" ")} ${stripHtml(p.content)}`),
    ...mediumPosts.map((p) => `${p.title} ${p.tags.join(" ")} ${stripHtml(p.content)}`),
    ...notes.map((n) => `${n.title} ${n.tags.join(" ")} ${stripHtml(n.content)}`),
  ]
    .join(" ")
    .toLowerCase();

  const unique = new Set<string>();
  for (const match of corpus.matchAll(/[a-z][a-z-]{2,11}(?![a-z-])/g)) {
    const word = match[0].replace(/-+$/, "");
    if (word.length < 3 || STOPWORDS.has(word)) continue;
    unique.add(word);
  }

  const buckets: WordBuckets = { short: [], medium: [], long: [] };
  for (const word of unique) {
    if (word.length <= 5) buckets.short.push(word);
    else if (word.length <= 8) buckets.medium.push(word);
    else buckets.long.push(word);
  }
  return buckets;
}

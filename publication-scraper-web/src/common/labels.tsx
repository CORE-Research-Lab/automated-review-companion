import { Author } from "@/types";

export const getAuthorLabel = (author: Author) => {
  let authorName = author.name;
  if (author.affiliation) {
    const affiliations = author.affiliation.map((affiliate: string) => affiliate.replace(",", ", "))
    authorName += ` (${affiliations.join(", ")})`;
  }
  return authorName;
}
 
export const parseAuthors = (authors: Author[] | undefined) => {
  try {
    return authors?.map((author) => getAuthorLabel(author)).join(', ') ?? "-"
  } catch {
    // Crossref may produce empty string for author names
    return "-"
  }
}

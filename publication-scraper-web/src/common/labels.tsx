import { Author } from "@/types";

export const getAuthorLabel = (author: Author) => {
  let authorName = author.name;
  if (author.affiliation) {
    let affiliations = author.affiliation.map((affiliate: string) => affiliate.replace(",", ", "))
    authorName += ` (${affiliations.join(", ")})`;
  }
  return authorName;
}
 
export const parseAuthors = (authors: Author[] | undefined) => {
  try {
    return authors?.map((author) => getAuthorLabel(author)).join(', ') ?? "-"
  } catch (e) {
    // Crossref may produce empty string for author names
    return "-"
  }
}
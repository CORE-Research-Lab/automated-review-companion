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
  return authors?.map((author) => getAuthorLabel(author)).join(', ') ?? "-"
}
import { SearchForm, SearchMode } from '@/types';
import { toast } from 'react-toastify';

/**
 * Validates search form based on the search mode
 * @param searchForm search form to validate
 * @param searchMode search mode to validate
 * @returns valid or not
 */
export const validateSearchForm = (searchForm: SearchForm, searchMode: SearchMode) => {
  if (searchForm.search_terms.primary.length === 0 && searchMode === SearchMode.SIMPLE) {
    toast.error('Primary search term is required');
    return false;
  }
  if (searchForm.sources.length === 0) {
    toast.error('At least one database must be selected');
    return false;
  }
  if (searchForm.search_terms.advanced == "" && searchMode === SearchMode.ADVANCED) {
    toast.error('Advanced search term is required');
    return false;
  }
  if (searchForm.search_terms.advanced != "" && searchMode === SearchMode.ADVANCED) {
    return validateAdvancedKeywordSearch(searchForm.search_terms.advanced);
  }
  return true;
}

/**
 * Validate the advanced keyword search
 * 
 * 1. Brackets must be in sets - ( and )
 * 2. Keywords must be separated by operators - and, or, not
 * 3. Keywords must be in quotes if they are valid phrases, 
 *    separated by spaces and surrounded by ' ' or " "
 * 
 * @param searchPhrase search phrase to validate
 * @returns boolean indicating if the search phrase is valid
 */
const validateAdvancedKeywordSearch = (searchPhrase: string) => {
  
  if (!validateBracketSets(searchPhrase)) {
    console.log("Bracket sets are not valid");
    return false;
  }

  if (!validateBooleanOperators(searchPhrase)) {
    console.log("Boolean operators are not valid");
    return false;
  }
  
  if (!validatePhrases(searchPhrase)) {
    console.log("Phrases are not valid");
    return false;
  }

  return true;
}

/**
 * Validate if the brackets are in sets
 * 
 * 1. If the brackets are not in sets, show an error
 * 2. If the brackets are in sets, return true
 * 
 * @param searchPhrase search phrase to validate
 * @returns boolean indicating if the brackets are in sets
 */
const validateBracketSets = (searchPhrase: string) => {
  const stack = [];
  for (let i = 0; i < searchPhrase.length; i++) {
    if (searchPhrase[i] === '(') {
      stack.push('(');
    } else if (searchPhrase[i] === ')') {
      if (stack.length === 0) {
        toast.error('Brackets are not in sets');
        return false;
      }
      stack.pop();
    }
  }
  if (stack.length !== 0) {
    toast.error('Brackets are not in sets');
    return false;
  }
  return true;
}

const validateBooleanOperators = (searchPhrase: string) => {
  const operators = ['and', 'or', 'not', 'AND', 'OR', 'NOT'];
  const matches = searchPhrase.match(/(?:\bnot\b|\band\b|\bor\b|\bNOT\b|\bAND\b|\bOR\b|".+?"|'.+?'|\b\w+\b)/gi) || [];
  const keywords = matches.map(str => str.replace(/'/g, ""));
  
  const startsWithOperator = operators.includes((keywords[0] as string));
  const endsWithOperator = operators.includes(keywords[keywords.length - 1]);
  
  if (startsWithOperator) {
    toast.error('Must start with a keyword');
    return false;
  }

  if (endsWithOperator) {
    toast.error('Must end with a keyword');
    return false;
  }
  
  let hasOperatorInBetween = false;
  for (let i = 0; i < keywords.length; i++) {
    if (operators.includes(keywords[i])) {
      hasOperatorInBetween = true;
    } else {
      if (!hasOperatorInBetween && i !== 0) {
        toast.error('Keywords must be separated by operators');
        return false;
      }
      hasOperatorInBetween = false;
    }
  }
  return true;
}

/**
 * Validate phrases in the search phrase based on the following rules:
 * 
 * 1. Phrases must be closed with a quote
 * 2. Keywords must be separated by operators
 * 
 * @param searchPhrase search phrase to validate
 * @returns boolean indicating if the phrases are valid
 */
const validatePhrases = (searchPhrase: string) => {
  const bracketlessPhrases = searchPhrase.replace(/[(|)]/g, '');
  const keywords = bracketlessPhrases.match(/(['"]([^'"]+)['"]|(\S+))/g) || [];
  const phrases = keywords.filter((word) => word !== '');

  // ensure all phrases are surrounded by ' ' or " "
  for (let i = 0; i < phrases.length; i++) {

    const hasStartingQuote = phrases[i][0] === "'" || phrases[i][0] === '"';
    const hasEndingQuote = phrases[i][phrases[i].length - 1] === "'" || phrases[i][phrases[i].length - 1] === '"';

    // Case example: 'AI
    if (hasStartingQuote && !hasEndingQuote) {
      toast.error('Phrases must have a closing quote');
      return false;
    }

    // Case example: AI'
    if (!hasStartingQuote && hasEndingQuote) {
      toast.error('Phrases must have an opening quote');
      return false;
    }
  }
  return true;
}

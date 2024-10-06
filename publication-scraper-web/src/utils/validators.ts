import { SearchForm, SearchMode } from '@/types';
import { toast } from 'react-toastify';

export const validateSearchForm = (searchForm: SearchForm, searchMode: SearchMode) => {
  if (searchForm.search_terms.primary.length === 0 && searchMode === SearchMode.SIMPLE) {
    toast.error('Primary search term is required');
    return false;
  }
  if (searchForm.sources.length === 0) {
    toast.error('At least one database must be selected');
    return false;
  }
  if (searchForm.search_terms.advanced != "") {
    return validateAdvancedKeywordSearch(searchForm.search_terms.advanced);
  }
  return true;
}

/**
 * Validate the advanced keyword search
 * 1. Brackets must be in sets - ( and )
 * 2. Keywords must be separated by operators - and, or, not
 * 3. Keywords must be in quotes if they are phrases
 * 4. Keywords must be separated by spaces
 * 5. Keywords must be separated by operators
 * @param searchPhrase
 * @returns boolean
 */
const validateAdvancedKeywordSearch = (searchPhrase: string) => {
  
  console.log("validating search phrase: ", searchPhrase);
  if (!validateBracketSets(searchPhrase)) {
    console.log("bracket sets are not valid");
    return false;
  }

  if (!validateBooleanOperators(searchPhrase)) {
    console.log("boolean operators are not valid");
    return false;
  }
  
  if (!validatePhrases(searchPhrase)) {
    console.log("phrases are not valid");
    return false;
  }
  console.log("search phrase is valid");

  return true;
}

const validateBracketSets = (searchPhrase: string) => {
  let stack = [];
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
  let operators = ['and', 'or', 'not', 'AND', 'OR', 'NOT'];
  var matches = searchPhrase.match(/(?:\bnot\b|\band\b|\bor\b|\bNOT\b|\bAND\b|\bOR\b|".+?"|'.+?'|\b\w+\b)/gi) || [];
  var keywords = matches.map(str => str.replace(/'/g, "")) || [];

  if (keywords.length === 0) {
    return false;
  }
  
  let startsWithOperator = operators.includes((keywords[0] as string));
  let endsWithOperator = operators.includes(keywords[keywords.length - 1]);
  if (startsWithOperator || endsWithOperator) {
    return false;
  }
  
  var hasOperatorInBetween = false;
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

const validatePhrases = (searchPhrase: string) => {
  let keywords = searchPhrase.split(/[\s()]/).filter((word) => word !== '') 
  let operators = [
    'and', 'or', 'not',
    'AND', 'OR', 'NOT'
  ];
  let phrases = [];
  
  // Extract phrases
  for (let i = 0; i < keywords.length; i++) {
    if (keywords[i].startsWith('"') && keywords[i].endsWith('"')) {
      phrases.push(keywords[i]);
    }
  }

  // Validate phrases are separated by spaces
  for (let i = 0; i < phrases.length; i++) {
    let phrase = phrases[i];
    let words = phrase.split(' ');
    if (words.length === 1) {
      toast.error('Keywords must be separated by spaces');
      return false;
    }
    if (operators.includes(words[0]) || operators.includes(words[words.length - 1])) {
      toast.error('Keywords must be separated by operators');
      return false;
    }
  }

  return true;
}
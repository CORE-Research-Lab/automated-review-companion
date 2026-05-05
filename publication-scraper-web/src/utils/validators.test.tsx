import { SearchEngineType, SearchForm, SearchMode } from '@/types';
import { afterEach, describe, expect, it, jest } from '@jest/globals'; // Import jest
import { toast } from 'react-toastify';
import { validateSearchForm } from './validators';

// Mock the react-toastify module
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(), // Mock the error method
  },
}));

const DEFAULT_SEARCH_FORM: SearchForm = {
  validation_papers: [],
  search_terms: {
    advanced: "",
    primary: [],
    secondary: [],
    tertiary: [],
  },
  start_date: new Date("2023-01-01"),
  end_date: new Date("2024-01-01"),
  sources: [SearchEngineType.DBLP],
};

function searchFormWithSearchTerm(searchTermKey: string, searchTermValue: string | string[]) {
  return {
    ...DEFAULT_SEARCH_FORM,
    search_terms: {
      ...DEFAULT_SEARCH_FORM.search_terms,
      [searchTermKey]: searchTermValue
    }
  }
}

describe('validateSearchForm', () => {
  // Clear mocks after each test
  afterEach(() => { jest.clearAllMocks() });


  it('should return false and show error if primary search term is missing in SIMPLE mode', () => {
    const searchForm: SearchForm = DEFAULT_SEARCH_FORM;
    const isValid = validateSearchForm(searchForm, SearchMode.SIMPLE);
    
    expect(isValid).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Primary search term is required');
  });


  it('should return false and show error if no sources are selected', () => {
    const searchForm = { 
      ...DEFAULT_SEARCH_FORM,
      search_terms: {
        ...DEFAULT_SEARCH_FORM.search_terms,
        primary: ["AI"]
      },
      sources: [] 
    }
    const isValid = validateSearchForm(searchForm, SearchMode.SIMPLE);
    
    expect(isValid).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('At least one database must be selected');
  });

  it('should return true if simple search terms is provided', () => {
    
    const searchForm = searchFormWithSearchTerm("primary", ["AI", "machine learning"]);
    const isValid = validateSearchForm(searchForm, SearchMode.SIMPLE);

    expect(isValid).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });


  it('should return false if no keywords exist', () => {
    const searchForm = searchFormWithSearchTerm("advanced", "");
    const isValid = validateSearchForm(searchForm, SearchMode.ADVANCED);

    expect(isValid).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Advanced search term is required');
  });

  describe('validateAdvancedKeywordSearch', () => {

      it('should validate advanced search term if provided', () => {
        const searchForm = searchFormWithSearchTerm("advanced", "(AI and 'machine learning')");
        const isValid = validateSearchForm(searchForm, SearchMode.ADVANCED);
    
        expect(isValid).toBe(true);
        expect(toast.error).not.toHaveBeenCalled();
      });
    
      // validateBracketSets
      it('should return false if advanced search phrase has incorrect startin bracket', () => {
        const searchForm = searchFormWithSearchTerm("advanced", ")AI and 'machine learning'");
        const isValid = validateSearchForm(searchForm, SearchMode.ADVANCED);
    
        expect(isValid).toBe(false);
        expect(toast.error).toHaveBeenCalledWith('Brackets are not in sets');
      });
    
      it('should return false if advanced search phrase has unmatched brackets', () => {
        const searchForm = searchFormWithSearchTerm("advanced", "(AI and machine learning");
        const isValid = validateSearchForm(searchForm, SearchMode.ADVANCED);
    
        expect(isValid).toBe(false);
        expect(toast.error).toHaveBeenCalledWith('Brackets are not in sets');
      });
      
      // validateBooleanOperators
      it('should return false if advanced search term starts with boolean operator', () => {
        const searchForm = searchFormWithSearchTerm("advanced", "and Education");
        const isValid = validateSearchForm(searchForm, SearchMode.ADVANCED);
    
        expect(isValid).toBe(false);
        expect(toast.error).toHaveBeenCalledWith('Must start with a keyword');
      });

      it('should return false if advanced search term ends with boolean operator', () => {
        const searchForm = searchFormWithSearchTerm("advanced", "Education and");
        const isValid = validateSearchForm(searchForm, SearchMode.ADVANCED);
    
        expect(isValid).toBe(false);
        expect(toast.error).toHaveBeenCalledWith('Must end with a keyword');
      });

      it('should return false if keywords are not separated by operators', () => {
        const searchForm = searchFormWithSearchTerm("advanced", "AI 'machine learning'");
        const isValid = validateSearchForm(searchForm, SearchMode.ADVANCED);
    
        expect(isValid).toBe(false);
        expect(toast.error).toHaveBeenCalledWith('Keywords must be separated by operators');
      });

      // validatePhrases
      it('should return true if no keywords are matched', () => {
        const searchForm = searchFormWithSearchTerm("advanced", "()");
        const isValid = validateSearchForm(searchForm, SearchMode.ADVANCED);
        
        expect(isValid).toBe(true);
        expect(toast.error).not.toHaveBeenCalled();
      });

      it('should return false if keyword phrases are not separated by spaces', () => {
        const searchForm = searchFormWithSearchTerm("advanced", "'AI")
        const isValid = validateSearchForm(searchForm, SearchMode.ADVANCED);
        
        expect(isValid).toBe(false);
        expect(toast.error).toHaveBeenCalledWith('Phrases must have a closing quote');
      });

      it('should return false if keyword phrases are not surrounded by quotes', () => {
        const searchForm = searchFormWithSearchTerm("advanced", "AI'")
        const isValid = validateSearchForm(searchForm, SearchMode.ADVANCED);
        
        expect(isValid).toBe(false);
        expect(toast.error).toHaveBeenCalledWith('Phrases must have an opening quote');
      });
    });
});

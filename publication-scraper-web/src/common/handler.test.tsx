import { afterEach, describe, expect, it, jest } from '@jest/globals'; // Import jest
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import { handleError } from './handler';

// Mock the react-toastify module
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(), // Mock the error method
  },
}));

const AXIOS_CONFIG = {
  url: 'http://localhost:5000/api/search',
  method: 'post',
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json;charset=utf-8',
  },
}

const AXIOS_RESPONSE_BODY = {
  status: 400,
  statusText: "Bad Request",
  headers: { 'Content-Type': 'application/json' },
  data: { error: "error message" }
} as AxiosResponse

function generateAxiosResponse(data: any): AxiosResponse
{
  return {
    ...AXIOS_RESPONSE_BODY,
    data: data
  }
}

function generateAxiosError(response?: AxiosResponse): AxiosError
{
  return new AxiosError(
    "Request failed with status code 400",
    "ERR_BAD_REQUEST",
    AXIOS_CONFIG as InternalAxiosRequestConfig,
    null,
    response
  )
}

describe('handleError', () => {
  // Clear mocks after each test
  afterEach(() => { jest.clearAllMocks() });

  it('should show error message if response data is empty', () => {
    const error = generateAxiosError();
    const expectedErrorMessage = 'Error: \"Request failed with status code 400\"'
    handleError(error);
    expect(toast.error).toHaveBeenCalledWith(expectedErrorMessage);
  });

  it('should show error message if response data is a string', () => {
    const errorData = generateAxiosResponse("Field 'search_term' is required");
    const error = generateAxiosError(errorData);
    const expectedErrorMessage = 'Error: "Field \'search_term\' is required"'
    handleError(error);
    expect(toast.error).toHaveBeenCalledWith(expectedErrorMessage);
  });

  it('should show error message if response data is a dictionary', () => {
    const errorData = generateAxiosResponse({"Rate limit exceeded": "Try again later."});
    const error = generateAxiosError(errorData);
    const expectedErrorMessage = 'Error: Rate limit exceeded: Try again later.'
    handleError(error);
    expect(toast.error).toHaveBeenCalledWith(expectedErrorMessage);
  });

  it('should show error message if response data is a dictionary with array', () => {
    const errorData = generateAxiosResponse({"Rate limit exceeded": ["You have reached the maximum number of filter request for the day (20).", "Try again later."]});
    const error = generateAxiosError(errorData);
    const expectedErrorMessage = 'Error: Rate limit exceeded: You have reached the maximum number of filter request for the day (20). Try again later.'
    handleError(error);
    expect(toast.error).toHaveBeenCalledWith(expectedErrorMessage);
  });

  it('should show error message if response data is a dictionary with an inner dictionary', () => {
    const errorData = generateAxiosResponse({"Rate limit exceeded": {"message": "You have reached the maximum number of filter request for the day (20).", "suggestion": "Try again later."}});
    const error = generateAxiosError(errorData);
    const expectedErrorMessage = 'Error: Rate limit exceeded: {"message":"You have reached the maximum number of filter request for the day (20).","suggestion":"Try again later."}'
    handleError(error);
    expect(toast.error).toHaveBeenCalledWith(expectedErrorMessage);
  });

  it('should show error message if response data is a dictionary with not handled', () => {
    const errorData = generateAxiosResponse({"Code": 105});
    const error = generateAxiosError(errorData);
    const expectedErrorMessage = 'Error: Code: 105'
    handleError(error);
    expect(toast.error).toHaveBeenCalledWith(expectedErrorMessage);
  });
});

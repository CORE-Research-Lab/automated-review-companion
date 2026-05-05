import { AxiosError } from "axios";
import { toast } from "react-toastify";

export const handleError = (error: AxiosError) => {
    console.error(error);
    if (error.response?.data) {
      // if response data is a dictionary, parse it as key=value
      if (typeof error.response.data === 'object') {
        const errorString = [];
        for (const key in error.response.data) {
          const val = error.response.data[(key as keyof typeof error.response.data)];
          const value = parseValue(val);
          errorString.push(`${key}: ${value}`);
        }
        toast.error(`Error: ${errorString.join(', ')}`);
        return;
      }

      toast.error(`Error: ${JSON.stringify(error.response.data)}`);
      return
    }
  toast.error(`Error: ${JSON.stringify(error.message)}`);
  return;
}

const parseValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.replace(/"/g, '');
  }
  
  if (Array.isArray(value)) {
    const parsedValue: string[] = [];
    value.forEach((v) => {
      parsedValue.push(parseValue(v));
    });
    return parsedValue.join(' ');
  }

  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  } 

  return String(value);
}

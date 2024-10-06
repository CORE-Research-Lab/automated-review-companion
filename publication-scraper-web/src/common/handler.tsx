import { AxiosError } from "axios";
import { toast } from "react-toastify";

export const handleError = (error: AxiosError) => {
    if (error.response?.data) {
      // if response data is a dictionary, parse it as key=value
      if (typeof error.response.data === 'object') {
        let errorString = [];
        for (const key in error.response.data) {
          let val = error.response.data[(key as keyof typeof error.response.data)];
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

const parseValue = (value: any) => {
  if (typeof value === 'string') {
    // remove \" from string
    value = value.replace(/\"/g, '');
    value = value.replace(/"/g, '');
    return value;
  }
  
  if (Array.isArray(value)) {
    let parsedValue: string[] = [];
    value.forEach((v) => {
      parsedValue.push(parseValue(v));
    });
    return parsedValue.join(' ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  } 

  return value;
}
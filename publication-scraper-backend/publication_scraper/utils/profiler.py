import time
from functools import wraps
from typing import Callable


class Color:
    WHITE = '\033[97m'
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def Profiler(process_name: str):
  """
  Decorator factory to profile a function, logging its start and end time
  
  :params process_name (str): The name of the process to profile.
  :rettype: function
  """
  def decorator(func: Callable):
    
    @wraps(func)
    def wrapper(*args, **kwargs):
      print(f"{Color.HEADER}──────────────────────── {process_name} [START] ────────────────────────{Color.ENDC}")
      
      start_time = time.time()
      try: 
        result = func(*args, **kwargs)
      except Exception as e:
        print(f"An error occurred: {e}")
        raise e
      finally:
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f"{Color.HEADER}──────────────────────── {process_name} [END] ──────────────────────────{Color.ENDC}")
        print(f"{Color.HEADER}Elapsed time: {elapsed_time:.2f} seconds{Color.ENDC}")
        
      return result
    return wrapper
  
  return decorator
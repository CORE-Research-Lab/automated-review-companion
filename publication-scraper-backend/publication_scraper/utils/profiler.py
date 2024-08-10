import time
from functools import wraps
from typing import Callable

def Profiler(process_name: str):
  """
  Decorator factory to profile a function, logging its start and end time
  
  :params process_name (str): The name of the process to profile.
  :rettype: function
  """
  def decorator(func: Callable):
    
    @wraps(func)
    def wrapper(*args, **kwargs):
      print(f"XXXXXXXXXXXXXXXXXXXXXXX {process_name} [START] XXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
      
      start_time = time.time()
      try: 
        result = func(*args, **kwargs)
      except Exception as e:
        print(f"An error occurred: {e}")
        raise e
      finally:
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f"XXXXXXXXXXXXXXXXXXXXXXX {process_name} [END] XXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
        print(f"Elapsed time: {elapsed_time:.2f} seconds")
        
      return result
    return wrapper
  
  return decorator
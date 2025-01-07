import environ
from langchain_openai import ChatOpenAI

env = environ.Env()
environ.Env.read_env()


class OpenAILLM:
  
    def __init__(self):
        self.llm: ChatOpenAI = None

        self.API_KEY = env('OPENAI_API_KEY')
        self.init_llm()


    def init_llm(self, model_name: str = "gpt-4o"):
        
        self.llm = ChatOpenAI(
                openai_api_key      = self.API_KEY,
                model_name          = model_name
            )
import langchain
from typing import List, Tuple, Union, Optional
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.pydantic_v1 import BaseModel
from publication.interfaces.llm.azure import AzureLLM
from publication.models import Publication, PublicationMetadata
from utils import Logger

log = Logger(__name__)

class FilterResponse(BaseModel):
    id: str
    question: str
    answer: str
    rationale: Optional[str]

class FilterAnswer(BaseModel):
    id: str
    answer: str
    rationale: str

class FilterAnswerExamples(BaseModel):
    paper_id: str
    responses: List[FilterAnswer]

class LLMFilterResponse(BaseModel):
    paper_id: str
    responses: List[FilterResponse]


class LLMFilter:
    def __init__(self):
        self.model = AzureLLM()
        self.llm = self.model.llm
        self.results: List[LLMFilterResponse] = []

    def parse(
        self, 
        paper_data: List[Union[Publication, PublicationMetadata]], 
        qna: List[FilterResponse],
        examples: List[FilterAnswerExamples] = [],
        include_rationale: bool = False,
        include_examples: bool = False
    ) -> None:
        self.include_rationale = include_rationale
        self.include_examples  = include_examples

        self.raw_papers         = paper_data
        self.paper_data         = self._parse_paper_data(paper_data)
        self.qna                = self._parse_qna(qna)
         
        if self.include_examples or examples == []:
            self.examples = self._parse_examples(examples)
            self.example_paper_ids  = [example.paper_id for example in examples]
        else:
            self.examples = ""
            self.example_paper_ids  = []

        self.init_prompt()

    def init_prompt(self):
        self.prompt = "Based on the following information provided for a paper along with its metadata, provide answers to the following questions"
        if self.include_rationale:
            self.prompt += "with justification and rationale"
        self.prompt += ":"
        
        self.prompt += "\n\nThese are the questions to be answered with a list of comma-separated possible answer. Only one can be chosen:\n{qna}"
        if self.include_examples:
            self.prompt += "\n\nExamples:\n {examples}"
        self.prompt += "\n\nThis is the publication's data to answer the questions:\n{paper_data}"
        self.prompt += "\n\n{format_instructions}"
            

    def completion(self):
        """ Complete the LLM filter """
        for pid, paper in self.paper_data:
            if pid not in self.example_paper_ids:
                self._complete_llm_filter(pid, paper)
        return self.results
    

    def _complete_llm_filter(self, paper_id: str, paper_data: str):
        """ Complete the LLM filter for a single paper """

        assert self.paper_data, "Paper data is required"
        assert self.qna, "QnA is required"

        self.input_variables        = ["paper_data", "qna"]
        self.invocation_variables   = {"paper_data": paper_data, "qna": self.qna}

        if self.include_examples:
            self.input_variables.append("examples")
            self.invocation_variables["examples"] = self.examples

        parser = JsonOutputParser(pydantic_object=LLMFilterResponse)
        filter_prompt = PromptTemplate(
            template        = self.prompt,
            input_variables = self.input_variables,
            partial_variables = {"format_instructions": parser.get_format_instructions()}
        )
        chain = filter_prompt | self.llm | parser
        response = chain.invoke(self.invocation_variables)

        response["paper_id"] = paper_id
        log.info(f"Completed LLM filter for paper: {paper_data}, response: {response}")
        self.results.append(response)

    def _parse_paper_data(self, paper_data: List[Union[PublicationMetadata, Publication]]) -> List[Tuple[str, str]]:
        """ 
        Parse the publication & metadata in the format:
        - field_name: field_value

        Returns a list of tuples with 
        1. publication_id and the 
        2. formatted paper data
        """
        all_paper_data = []
        for paper in paper_data:
            if isinstance(paper, PublicationMetadata):
                paper_data_dict = paper.to_dict(show_publication=True)
                paper_id = paper.publication_id
            else:
                paper_data_dict = paper.to_dict()
                paper_id = paper.paper_id
            paper_data_str = "\n".join([f"{field}: {value}" for field, value in paper_data_dict.items()])
            all_paper_data.append((paper_id, paper_data_str))
        return all_paper_data
        
    def _parse_qna(self, qna: List[FilterResponse]):
        """ 
        Parse the question and answers in the format:
        
            id: number
            question: question
            answer: possible list of answers, separated by a comma
        """
        qna_str = "\n".join([f"{qa.id}: {qa.question} | Possible Answers: {qa.answer}" for qa in qna])
        return qna_str
    
    def _parse_examples(self, examples: List[FilterAnswerExamples]) -> str:
        """ 
        Parse the examples in the format:
        
            paper_id: paper_id
            responses: 
                - id: number
                - answer: possible list of answers, separated by a comma
                - rationale: rationale for the answer
        """
        self.raw_papers: List[Union[Publication, PublicationMetadata]]
        examples_str = ""
        for index, example in enumerate(examples):
            examples_str += f"\n\nExample {index + 1}:\n"
            for p in self.raw_papers:
                if isinstance(p, PublicationMetadata):
                    if p.publication_id == example.paper_id:
                        paper = p
                        break
                else:
                    if p.paper_id == example.paper_id:
                        paper = p
                        break
            if paper:
                paper_data_dict = paper.to_dict(show_publication=True)
                paper_id = paper.publication_id
            else:
                paper_data_dict = paper.to_dict()
                paper_id = paper.paper_id
            examples_str += "\n".join([f"{field}: {value}" for field, value in paper_data_dict.items()])
            
            if not self.include_rationale:
                examples_str += "\n".join([f"\nQuestion {response.id}: {response.answer}" for response in example.responses])
            else:
                examples_str += "\n".join([f"\nQuestion {response.id}: {response.answer} | Rationale: {response.rationale}" for response in example.responses])
            example.paper_id = paper_id
        log.info(examples_str)
        return examples_str
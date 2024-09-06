import CloseIcon from '@mui/icons-material/Close';
import { IconButton, Tooltip } from "@mui/material";

export interface UsabilityGuideProps {
  handleClose: () => void
} 

const UsabilityGuide: React.FC<UsabilityGuideProps> = (props) => {
  const { handleClose } = props;
  return (
    <div className="container p-5 bg-white" style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      height: '80%',
      overflow: 'scroll',
      borderRadius: '5px'
    }}>
      <div className="d-flex justify-content-between">
        <h3>Usability Guide</h3>
        <Tooltip title="Close">
          <IconButton onClick={handleClose} color="error" className="pb-3">
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </div>

      <h4>Search Bar</h4>
      <div className="divider border-bottom my-3"></div>
      <div className="d-flex flex-column pb-3">
        <span>The search bar allows you to search for publications based on the search terms, year range, and databases selected.</span>
        <span>There are two search modes:</span>
        <ol>
          <li>Simple mode, you can enter primary, secondary, and tertiary search terms.</li>
          <li>Advanced mode, you can enter a case-insensitive boolean search string.
            <ul>
              <li>Use 'AND', 'OR', 'NOT' operators to combine search terms. (Case insensitive) </li>
              <li>Use quotations to search for exact phrases.</li>
            </ul>
          </li>
        </ol>
        <div className="ps-3">
          <li>Year range allows you to filter publications based on the publication year.</li>
          <li>Databases: at least one source must be selected to proceed in searching.</li>
          <li>Validation papers allow you to enter the DOI of the known existing papers to validate if the search configurations result in the validation papers.</li>
          <li>Clear button resets and clears all search parameters and results.</li>
        </div>
        <span>To start searching, simply press the Search button.</span>
      </div>
      
      
      <h4>Search Results</h4>
      <div className="divider border-bottom mb-3"></div>
      <div className="d-flex flex-column pb-3">
        <span>The search results display the matched papers based on the search configurations.</span>
        <span>Each row represents a publication with the following columns:</span>
        <ol>
          <li>Checkbox: allows you to select the paper</li>
          <li>Paper ID: the unique identifier of the paper</li>
          <li>Paper Title: the title of the paper</li>
          <li>Searched From: the source where the paper was searched from</li>
          <li>Search String: the search string used to find the paper</li>
          <li>Formatted Search String: the formatted search string</li>
          <li>Status: the status of the paper</li>
        </ol>
        <div className="ps-3">
          <li>Metadata columns are hidden by default. To show the metadata, click on the Metadata button.</li>
          <li>LLM Questions columns are hidden by default. To show the LLM Questions, click on the LLM Questions button.</li>
          <li>Click on the checkbox to select the paper. You can select all papers by clicking on the Select All button.</li>
          <li>Click on the Export button to export the selected papers in CSV/BibTex/RIS format.</li>
        </div>
      </div>

      <h4>Metadata</h4>
      <div className="divider border-bottom"></div>
      <div className="d-flex flex-column pb-3">
        <span>The metadata columns display the metadata of the selected papers.</span>
        <span>The metadata columns include:</span>
        <ol>
          <li>Abstract</li>
          <li>Authors</li>
          <li>Citations Count</li>
          <li>Conference/Journal</li>
          <li>DOI</li>
          <li>DOI URL</li>
          <li>Keywords</li>
          <li>Publication Date</li>
          <li>Publication Type</li>
          <li>Publisher</li>
          <li>Semantic Scholar URL</li>
        </ol>
      </div>

      <h4 className="d-flex justify-content-between">
        <span>Paper Filtering (LLM-Powered)</span>
        <span className="badge bg-primary d-flex justify-content">⭐ Advanced Functionality</span>
      </h4>
      <div className="divider border-bottom"></div>
      <div className="d-flex flex-column pb-3">
        <span>The Paper Filtering functionality can further filter the papers provided with more insight by the user.</span>
        <span>The LLM engine (GPT-4) further filters the papers based on the user's preferences.</span>
        <span className="pb-3">In order to provide a more accurate classification result, it is recommended to ensure metadata for the selected papers are populated.</span>
    
        <ol>
          <li>Question: Each question would be shown as a distinct column for each resulting paper.</li>
          <li>Response: This denotes the possible classifications the LLM can categorize the paper as, based on the metadata</li>
        </ol>
        <span>Click on the LLM Filter button to filter the papers based on the LLM Questions.</span>
    
      </div>

      <h4 className='d-flex justify-content-between'>
        <span>Forward and Backward Search (Snowballing)</span>
        <span className="badge bg-primary d-flex justify-content">⭐ Advanced Functionality</span>
      </h4>
      <div className="divider border-bottom"></div>
      <div className="d-flex flex-column pb-3">
        <span>The Snowballing Search allows you to search for papers that the selected papers cite or that cite the selected papers.</span>
        <span className="pb-3">To perform Snowballing Search, follow the following steps:</span>
        <ol>
          <li>Click on the Forward Search or Backward Search button to start the snowballing search.</li>
          <li>Click on the Expand/Collapse button on the original paper that has undergone snowballing search to view the references and citations of the paper.</li>
        </ol>
        
        <li>References: the papers that the selected paper cites.</li>
        <li>Citations: the papers that cite the selected paper.</li>
      </div>
      
    </div>
  )
};

export default UsabilityGuide;
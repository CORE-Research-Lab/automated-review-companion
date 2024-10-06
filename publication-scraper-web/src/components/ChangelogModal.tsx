import { tooltipText } from '@/data/tooltip';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import { IconButton, Modal, Tooltip } from "@mui/material";
import { Button } from './ui/button';

export interface ChangelogModalProps {
  showChangelog: boolean,
  setShowChangelog: React.Dispatch<React.SetStateAction<boolean>>,
  handleClose: () => void,
} 

const ChangelogModal: React.FC<ChangelogModalProps> = (props) => {
  const { 
    showChangelog,
    setShowChangelog,
    handleClose,
  } = props;

  return (
    <>
      <Tooltip title={tooltipText.changelog}>
        <Button className="bg-slate-500/60 hover:bg-slate-600/60" onClick={() => setShowChangelog(true)}>
          <HistoryIcon style={{ fontSize: "1.5rem" }} />
        </Button>
      </Tooltip>
      <Modal open={showChangelog} onClose={handleClose}>
        <div className="container p-5 z-10 bg-white" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          overflow: 'scroll',
          borderRadius: '5px'
        }}>
          <div className="d-flex justify-content-between mb-3">
            <h3 className="text-4xl font-medium ">Welcome to Automated Review Companion (ARC)</h3>
            <Tooltip title="Close" className="flex">
              <IconButton onClick={handleClose} color="error">
                <CloseIcon aria-label="Close changelog" />
              </IconButton>
            </Tooltip>
          </div>

          <div className="divider border-bottom my-3"></div>

          <div>
            <p>
              <strong>Note:</strong> This is a demo software built for the anonymous review process.
              We are actively working on fixing bugs and improving UI aesthetics.
            </p>
            <br/>
            <p>
              <strong>Rate Limits:</strong> To ensure a smooth experience for everyone while we host the site on a
              resource-constrained cloud environment, we have applied the following limitations:
            </p>
            <p><strong>Rate Limit - search results:</strong> Each search platform will return a maximum of 1000 papers.
              This limitation will be lifted once the review process is completed.
            </p>
            <p><strong>Rate Limit - LLM based paper filtering:</strong>The LLM-powered paper filtering functionality,
              powered by OpenAI's GPT-4 API, is rate limited to 20 interactions per user per day (i.e., 20 papers tagged).
            </p>
            <br/>
            <p>
            These limitations are not barriers on the software side but are due to our current hosting resources and
              the fact that we are actively paying for all OpenAI API usage.
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
};

export default ChangelogModal;
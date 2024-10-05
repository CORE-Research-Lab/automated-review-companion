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
            <h3 className="text-4xl font-medium ">Changelog</h3>
            <Tooltip title="Close" className="flex">
              <IconButton onClick={handleClose} color="error">
                <CloseIcon aria-label="Close changelog" />
              </IconButton>
            </Tooltip>
          </div>
          
          <div className="divider border-bottom my-3"></div>

          <p>Version 1.0.0</p>
          <ul>
            <li>Initial release</li>
          </ul>
        </div>
      </Modal>
    </>
  )
};

export default ChangelogModal;
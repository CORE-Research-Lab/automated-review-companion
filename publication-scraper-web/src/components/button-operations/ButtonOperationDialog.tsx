import { PublicationOperation } from "@/types";
import { DialogContent } from "@mui/material";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

export interface ButtonOperationDialogProps {
  showDialogPrompt: PublicationOperation | null
  setShowDialogPrompt: React.Dispatch<React.SetStateAction<PublicationOperation | null>>
  selectedPapers: string[]
}

const ButtonOperationDialog: React.FC<ButtonOperationDialogProps> = (props) => {
  const { 
    showDialogPrompt, 
    setShowDialogPrompt,
    selectedPapers 
  } = props

  if (showDialogPrompt == null) {
    return <></>
  }

  const getDialogTitle = () => {
    switch (showDialogPrompt) {
      case PublicationOperation.POPULATE_METADATA:
        return "Populate Metadata"
      case PublicationOperation.HIDE_METADATA:
        return "Hide Metadata"
      case PublicationOperation.FORWARD_SEARCH:
        return "Forward Search"
      case PublicationOperation.BACKWARD_SEARCH:
        return "Backward Search"
      case PublicationOperation.DELETE:
        return "Delete"
      default:
        return ""
    }
  }

  return ( 
    <Dialog>
      <DialogTrigger>Open Dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {getDialogTitle()} for {selectedPapers.length} papers
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
 
export default ButtonOperationDialog;
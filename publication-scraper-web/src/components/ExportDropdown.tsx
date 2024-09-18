import { handleError } from "@/common/handler";
import { tooltipText } from "@/data/tooltip";
import { ButtonState } from "@/types";
import { BASE_URL } from "@/utils/common";
import { Tooltip } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

export interface ExportDropdownProps {
  selectedPapers: string[];
  buttonState: ButtonState;
  diffMode: boolean;
}

const ExportDropdown: React.FC<ExportDropdownProps> = (props) => {

  const { selectedPapers, diffMode } = props;
  const isExportDisabled = selectedPapers.length === 0 || diffMode;
  const exportFormats = [
    {
      label: "CSV",
      format: "CSV",
    },
    {
      label: "BibTex",
      format: "BIBTEX",
    },
    {
      label: "RIS",
      format: "RIS",
    }
  ];

  const handleExport = async (format: string) => {
    await axios.post(`${BASE_URL}/scraper/export`, {
      paper_ids: selectedPapers,
      format
    })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        const contentDisposition = res.headers['content-disposition'];
        const filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        toast.success("Exported papers successfully");
      })
      .catch(handleError);
  }

  return ( 
    <DropdownMenu>
      <Tooltip
        title={
          isExportDisabled
          ? tooltipText.results.export.disabled
          : tooltipText.results.export.enabled
        }
        placement="bottom"
      > 
        <DropdownMenuTrigger disabled={isExportDisabled}>
          <Button
            disabled={isExportDisabled}
            className="bg-slate-500 hover:bg-slate-600 active:border-none dropdown-toggle"
          >
            Export
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent>

        {exportFormats.map((exportFormat) => (
          <DropdownMenuItem 
            key={exportFormat.format} 
            onClick={() => handleExport(exportFormat.format)}
          >
            {exportFormat.label}
          </DropdownMenuItem>
        ))}

      </DropdownMenuContent>
    </DropdownMenu>
   );
}
 
export default ExportDropdown;
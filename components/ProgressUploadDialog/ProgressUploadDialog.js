import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import LinearProgress from "@material-ui/core/LinearProgress";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";

const ProgressUploadDialog = ({ onCancel, open, loaded, total}) => {
    return (
        <Dialog
            open={open}
        >
            <DialogTitle>Прогресс загрузки</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {`Прогресс отправки формы: ${(loaded / 1024 / 1024).toFixed(1)}МБ из ${(total / 1024 / 1024).toFixed(1)}МБ (${Math.round(loaded * 100 / total)}%)`}
                </DialogContentText>
                <LinearProgress
                    variant={loaded < total ? "determinate" : "indeterminate"}
                    value={Math.round(loaded * 100 / total)}
                />
            </DialogContent>
            <DialogActions>
                <Button color="primary" autoFocus onClick={onCancel}>
                    Отмена
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProgressUploadDialog;

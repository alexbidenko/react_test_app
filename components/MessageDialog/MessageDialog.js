import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";

const MessageDialog = ({ open, onClose, message }) => {
    return (
        <Dialog
            open={open}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            onClose={onClose}
        >
            <DialogTitle id="alert-dialog-title">{message}</DialogTitle>
            <DialogActions>
                <Button color="primary" autoFocus onClick={onClose}>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MessageDialog;

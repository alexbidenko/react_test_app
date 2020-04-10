import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Input from "@material-ui/core/Input";
import FormHelperText from "@material-ui/core/FormHelperText";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import React from "react";

const VideoChooser = ({ open, save, choosesVideo, handleChangeId, getVideoPreview, videoPreviewData, isChooserError, videoRefId, onCancel }) => {
    if(choosesVideo && choosesVideo.master)
        loadVideo(document.getElementById('videoChooser'), `${process.env.API_URL}videos${choosesVideo.master}`);
    if(choosesVideo && choosesVideo.preview && !videoPreviewData)
        getVideoPreview(choosesVideo.preview);

    return (
        <Dialog
            open={open}
        >
            <DialogTitle>Выбор видео</DialogTitle>
            <DialogContent>
                <h4>{choosesVideo ? choosesVideo.title : ''}</h4>
                {choosesVideo && <div className="container-fluid">
                    <div className="row">
                        <div className="col-12 col-md-6 p-0">
                            {videoPreviewData ? <img src={videoPreviewData} alt="Video preview" className="w-100"/> : null}
                        </div>
                        <div className="col-12 col-md-6 p-0">
                            {choosesVideo.master ? <video id="videoChooser" className="w-100" controls/> : null}
                        </div>
                    </div>
                </div>}
                <FormControl className="w-100 mb-3">
                    <InputLabel>ID видео</InputLabel>
                    <Input
                        onChange={handleChangeId}
                        value={videoRefId}
                        type="number"
                        error={isChooserError}
                    />
                    <FormHelperText>{isChooserError === '' ? 'Видео не существует' : ''}</FormHelperText>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button color="primary" autoFocus onClick={onCancel}>
                    Отмена
                </Button>
                <Button color="primary" autoFocus onClick={save} disabled={isChooserError}>
                    Выбрать
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VideoChooser;

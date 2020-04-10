import React, {useEffect, useState} from "react";
import Layout from "../../components/Layout/Layout";
import MessageDialog from "../../components/MessageDialog/MessageDialog";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import Router from "next/router";
import IconButton from "@material-ui/core/IconButton";
import Icon from "@material-ui/core/Icon";
import {DragDropContext, Draggable, Droppable, resetServerContext} from "react-beautiful-dnd";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import TextField from "@material-ui/core/TextField";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import {reorder} from "../../scripts/sorting";

resetServerContext();

const Playlists = () => {
    const [playlists, setPlaylists] = useState([]);
    const [isRedactDialogOpen, setIsRedactDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [isOpenDialog, setIsOpenDialog] = useState(false);
    const [playlistToOpen, setPlaylistToOpen] = useState(null);
    const [playlistToUpdate, setPlaylistToUpdate] = useState(null);

    const onDragEnd = (result) => {
        if (!result.destination) {
            return;
        }
        setPlaylists(reorder(
            playlists,
            result.source.index,
            result.destination.index
        ));
    };

    const openDialog = (playlist = null) => {
        setPlaylistToUpdate(playlist);
        setPlaylistToOpen(Object.assign({}, playlist));
        setIsRedactDialogOpen(true);
    };

    const handleChangeName = (event) => {
        event.persist();
        setPlaylistToOpen(prev => ({...prev, ...{name: event.target.value}}));
    };

    const toDeletePlaylist = (playlist) => {
        setPlaylistToUpdate(playlist);
        setPlaylistToOpen(Object.assign({}, playlist));
        setIsDeleteDialogOpen(true);
    };

    const saveOrder = () => {
        fetch(`${process.env.API_URL}admin/playlists/change-order`, {
            method: 'POST',
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({idByOrder: playlists.map(el => el.id)})
        }).then(response => response.json()).then(body => {
            setDialogMessage('Последовательность успешно сохранена');
            setIsOpenDialog(true);
        });
    };

    const handleSave = () => {
        const url = new URL(`${process.env.API_URL}admin/playlists/${playlistToUpdate ? playlist.id : ''}`);
        url.searchParams.append('name', playlistToOpen.name);
        fetch(url.toString(), {
            method: playlistToUpdate ? 'PATCH' : 'POST',
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({name: playlistToOpen.name})
        }).then(response => response.json()).then(body => {
            setIsRedactDialogOpen(false);
        });
    };

    const deletePlaylist = () => {
        fetch(`${process.env.API_URL}admin/playlists/${playlist.id}`, {
            method: 'DELETE',
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => {
            if(response.ok) {
                setPlaylists(playlists.filter(el => el.id !== playlist.id));
                setIsRedactDialogOpen(false);
            }
        });
    };
    
    useEffect(() => {
        fetch(`${process.env.API_URL}admin/playlists`, {
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => response.json()).then(body => {
            setPlaylists(body.data);
        });
    }, []);

    return (
        <Layout>
            <Paper className="container p-0">
                <div  className="p-3">
                    <Button onClick={() => {Router.push("/")}} className="link">Назад</Button>
                    <Button onClick={() => openDialog(null)} className="mr-3">Создать плейлист</Button>
                    <Button onClick={saveOrder}>Сохранить последовательность</Button>
                </div>

                <Divider />


                <div className="row px-3 py-2">
                    <div
                        className="col-2">
                        ID
                    </div>
                    <div align="left" className="col-6">
                        Название
                    </div>
                    <div align="right" className="col-2">
                        Количество видео
                    </div>
                    <div align="right" className="col-2">Действия</div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="droppable" index={0}>
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {playlists.map((row, index) => {
                                    return (
                                        <Draggable key={row.id} draggableId={row.id.toString()} index={index}>
                                            {(provided) => (
                                                <Paper
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    key={row.id} className="container-fluid rounded-0 border"
                                                >
                                                    <div className="row py-2">
                                                        <div className="col-2">
                                                            {row.id}
                                                        </div>
                                                        <div className="col-6" style={{wordBreak: 'break-word'}}>{row.name}</div>
                                                        <div className="col-2" align="right">{row.videoCount || 0}</div>
                                                        <div className="pl-0 col-2" align="right">
                                                            <IconButton aria-label="edit" onClick={() => openDialog(row)}>
                                                                <Icon>edit</Icon>
                                                            </IconButton>
                                                            <IconButton aria-label="edit" onClick={() => toDeletePlaylist(row)}>
                                                                <Icon>delete</Icon>
                                                            </IconButton>
                                                        </div>
                                                    </div>
                                                </Paper>
                                            )}
                                        </Draggable>
                                    )
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                {playlistToOpen && (playlistToOpen.videoCount === 0
                    ? <ConfirmDialog
                        open={isDeleteDialogOpen}
                        title={'Подтвердите удаление'}
                        description={`Выдействительно хотите удалить плейлист: "${playlistToOpen.name}"?`}
                        onClose={() => setIsRedactDialogOpen(false)}
                        positiveAction={deletePlaylist}
                    />
                    : <MessageDialog
                        open={isDeleteDialogOpen}
                        message={`Вы не можете удалить плейлист в котором есть видео (${playlistToOpen.videoCount} шт.) Перед удалением необходимо удалить видео из плейлиста или перенести в другой плейлист`}
                        onClose={() => setIsRedactDialogOpen(false)}
                    />
                )}

                <Dialog open={isRedactDialogOpen} aria-labelledby="form-dialog-title" onClose={() => setIsRedactDialogOpen(false)}>
                    <DialogTitle id="form-dialog-title">Плейлист</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="name"
                            label="Название плейлиста"
                            type="test"
                            fullWidth
                            value={!!playlistToOpen ? playlistToOpen.name : ''}
                            onChange={handleChangeName}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button color="primary" onClick={() => setIsRedactDialogOpen(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleSave} color="primary">
                            Сохранить
                        </Button>
                    </DialogActions>
                </Dialog>

                <MessageDialog message={dialogMessage} open={isOpenDialog} onClose={() => {setIsOpenDialog(false)}}/>
            </Paper>
        </Layout>
    );
};

export default Playlists;

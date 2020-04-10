import {reorder} from "../../scripts/sorting";
import React, {useEffect, useState} from "react";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Router from "next/router";
import {DragDropContext, Draggable, Droppable, resetServerContext} from "react-beautiful-dnd";
import Divider from "@material-ui/core/Divider";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Input from "@material-ui/core/Input";
import MessageDialog from "../../components/MessageDialog/MessageDialog";
import axios from "axios";
import Layout from "../../components/Layout/Layout";
import VideoChooser from "../../components/VideoChooser/VideoChooser";
import Hls from "hls.js";

const filesAccept = 'image/jpeg,image/jpg,image/png,video/mp4,video/h264,video/3gp';

let timer = null;

resetServerContext();

const Carousel = () => {
    const [originItems, setOriginItems] = useState([]);
    const [items, setItems] = useState([]);
    const [dialogMessage, setDialogMessage] = useState('');
    const [isOpenDialog, setIsOpenDialog] = useState(false);
    const [isOpenChooser, setIsOpenChooser] = useState(false);
    const [itemToChooseVideo, setItemToChooseVideo] = useState(null);
    const [choosesVideo, setChoosesVideo] = useState(null);
    const [isChooserError, setIsChooserError] = useState(false);
    const [videoPreviewData, setVideoPreviewData] = useState(null);
    const [videoRefId, setVideoRefId] = useState(0);
    const [hls, setHls] = useState(null);

    const onDragEnd = (result) => {
        if (!result.destination) {
            return;
        }
        setItems(reorder(
            items,
            result.source.index,
            result.destination.index
        ));
    };

    const addItem = () => {
        setItems(prev => ([...prev, {
            id: new Date().getTime(),
            file: null,
            fileData: null
        }]))
    };

    const uploadFile = (event, id) => {
        if(event.target.files.length > 0) {
            const file = event.target.files[0];
            if(filesAccept.split(',').indexOf(file.type) < 0) {
                setDialogMessage(`Недопустимый формат файла (Доступны только ${filesAccept})`);
                setIsOpenDialog(true);
                return;
            }

            const items = items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].id === id) {
                    const cashFile = items[i].file;
                    const cashFileData = items[i].fileData;

                    items[i].file = file;
                    items[i].fileData = URL.createObjectURL(file);

                    if(file.type.startsWith('image')) {
                        const img = new Image();
                        img.onload = () => {
                            if (img.width !== 1440 || img.height !== 810) {
                                setDialogMessage('Элементы карусели могут быть разрешением только 1440х810');
                                setIsOpenDialog(true);
                                items[i].file = cashFile;
                                items[i].fileData = cashFileData;
                            } else {
                                items[i].fileType = 'image';
                            }
                            setItems(items);
                        };
                        img.src = URL.createObjectURL(file);
                    } else if(file.type.startsWith('video')) {
                        const video = document.createElement('video');
                        video.addEventListener('loadedmetadata', function() {
                            if (video.videoWidth !== 1440 || video.videoHeight !== 810) {
                                setDialogMessage('Элементы карусели могут быть разрешением только 1440х810');
                                setIsOpenDialog(true);
                                items[i].file = cashFile;
                                items[i].fileData = cashFileData;
                            } else {
                                items[i].fileType = 'video';
                            }
                            setItems(items);
                        });
                        video.src = URL.createObjectURL(file);
                    } else {
                        items[i].file = null;
                        items[i].fileData = null;
                    }
                }
            }
            setItems(items);
        }
    };

    const removeItem = (id) => {
        setItems(items.filter(el => el.id !== id));
    };

    const saveAll = async () => {
        for(let item of items) {
            const isNew = !originItems.find(el => el.id === item.id);

            if(!isNew || (item.file && (item.url || item.videoRef))) {
                const formData = new FormData();
                if (item.file) {
                    formData.append(item.fileType === 'image' ? 'bannerImage' : 'bannerVideo', item.file);
                }
                if (item.url) {
                    formData.append('url', item.url);
                } else {
                    formData.append('videoID', item.videoRef.id);
                }
                const data = await axios[isNew ? 'post' : 'put'](`${baseApi}admin/promo${isNew ? '' : '/' + item.id}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    timeout: 9999999
                });
                setItems(prev => prev.map(el => {
                    if (el.id === item.id) {
                        el.id = data.data.id;
                    }
                    return el;
                }));
            }
        }
        for(let item of originItems) {
            if(!items.find(el => el.id === item.id)) {
                await fetch(`${process.env.API_URL}admin/promo/${item.id}`, {
                    method: 'DELETE',
                    headers: new Headers({
                        authorization: `Bearer ${localStorage.getItem('token')}`
                    })
                });
            }
        }
        fetch(`${process.env.API_URL}admin/promo/change-order`, {
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json',
                authorization: `Bearer ${localStorage.getItem('token')}`
            }),
            body: JSON.stringify({idByOrder: items.map(el => el.id)})
        }).then(r => r.json()).then(() => {
            setDialogMessage('Все данные успешно сохранены!');
            setIsOpenDialog(true);
        });
    };

    const handleChangeUrl = (event) => {
        event.persist();
        setItems(prev => prev.map(el => {
            if(el.id === +event.target.id.substring(4)) {
                el.url = event.target.value;
                el.videoRef = null;
            }
            return el;
        }));
    };
    
    useEffect(() => {
        fetch(`${process.env.API_URL}admin/promo`, {
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => response.json()).then(body => {
            setOriginItems(body.banners);
            setItems(body.banners.map(el => {
                if(el.bannerImg) {
                    fetch(`${process.env.API_URL}promo${el.bannerImg}`, {
                        headers: new Headers({
                            authorization: `Bearer ${localStorage.getItem('token')}`
                        })
                    }).then(r => r.blob()).then(file => {
                        const fr = new FileReader();
                        fr.onload = () => {
                            setItems(prev => prev.map(item => {
                                if(el.id === item.id) {
                                    item.fileData = fr.result;
                                    item.fileType = 'image';
                                }
                                return item;
                            }));
                        };
                        fr.readAsDataURL(file);
                    });
                } else if(el.bannerVideo) {
                    fetch(`${process.env.API_URL}promo${el.bannerVideo}`, {
                        headers: new Headers({
                            authorization: `Bearer ${localStorage.getItem('token')}`
                        })
                    }).then(r => r.blob()).then(file => {
                        setItems(prev => prev.map(item => {
                            if(el.id === item.id) {
                                item.fileData = URL.createObjectURL(file);
                                item.fileType = 'video';
                            }
                            return item;
                        }));
                    });
                    el.fileType = 'video';
                }
                return el;
            }));
        });
    }, []);

    const save = () => {
        setItems(prev => prev.map(el => {
            if(el.id === itemToChooseVideo.id) {
                el.videoRef = choosesVideo;
                el.url = null;
            }
            return el;
        }));
        setItemToChooseVideo(null);
        setIsOpenChooser(false);
        setChoosesVideo(null);
        setVideoRefId(0);
    };

    const getVideoPreview = (preview) => {
        fetch(`${process.env.API_URL}videos${preview}`, {
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(r => r.blob()).then(file => {
            const fr = new FileReader();
            fr.onload = () => {
                setVideoPreviewData(fr.result);
            };
            fr.readAsDataURL(file);
        });
    };

    const loadVideo = (video, url) => {
        setTimeout(() => {
            newHls(new Hls({
                xhrSetup: xhr => {
                    xhr.setRequestHeader('authorization', `Bearer ${localStorage.getItem('token')}`)
                }
            }));
            newHls.loadSource(url);
            newHls.attachMedia(video);
            setHls(newHls);
        }, 200);
    };

    const handleChangeId = (e) => {
        e.persist();
        clearTimeout(timer);
        const event = Object.assign({}, e);
        setIsChooserError(false);
        setVideoRefId(event.target.value);
        timer = setTimeout(() => {
            fetch(`${process.env.API_URL}admin/videos/${event.target.value}`, {
                headers: new Headers({
                    authorization: `Bearer ${localStorage.getItem('token')}`
                })
            }).then(r => {
                if(r.ok) {
                    r.json().then(data => {
                        setIsChooserError(false);
                        setChoosesVideo(data);
                        setVideoRefId(event.target.value);
                        setVideoPreviewData(null);
                        loadVideo(document.getElementById('videoChooser'), `${process.env.API_URL}videos${data.master}`);
                        getVideoPreview(data.preview);
                    });
                } else {
                    setIsChooserError(true);
                    setVideoPreviewData(null);
                }
            });
        }, 300);
    };
    
    return (
        <Layout>
            <div className="container p-0">
                <Paper className="p-3 mb-4">
                    <Button onClick={() => {Router.push("/")}} className="link">Назад</Button>
                    <Button className="link" onClick={addItem} disabled={items.length >= 5}>Добавить элемент</Button>
                    <Button onClick={saveAll}>Сохранить</Button>
                </Paper>

                <Paper className="container p-0 mb-4 container-fluid">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="droppable">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                >
                                    {items.map((item, index) => {
                                        let imageOrVideo = null;
                                        const type = item.fileType || null;
                                        switch (type) {
                                            case null:
                                                imageOrVideo = (<span className="converting-process"><span>Выберите файл</span></span>);
                                                break;
                                            case 'image':
                                                imageOrVideo = (<img className="w-100" src={item.fileData} alt="" />);
                                                break;
                                            case 'video':
                                                imageOrVideo = (<video src={item.fileData} id={'video_' + item.id} controls width="100%"/>);
                                                break;
                                        }
                                        return (
                                            <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                                {(provided) => (
                                                    <Paper
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="rounded-0 border container-fluid"
                                                    >
                                                        <div className="row">
                                                            <div className="col-12 col-md-6 p-0" style={{fontSize: 0}}>
                                                                {imageOrVideo}
                                                            </div>
                                                            <div className="col-12 col-md-6">
                                                                <div className="row">
                                                                    <div className="col-6">
                                                                        <Button component="label" className="my-2 w-100">
                                                                            Загрузить
                                                                            <input
                                                                                type="file"
                                                                                style={{ display: "none" }}
                                                                                accept={filesAccept}
                                                                                onChange={e => {uploadFile(e, item.id)}}
                                                                            />
                                                                        </Button>
                                                                    </div>
                                                                    <div className="col-6">
                                                                        <Button className="my-2 w-100" onClick={() => {removeItem(item.id)}}>Удалить</Button>
                                                                    </div>
                                                                </div>
                                                                <Divider />
                                                                <h5>Ссылаться на:</h5>
                                                                <FormControl className="w-100 mb-1">
                                                                    <InputLabel htmlFor="description"
                                                                                className={!!item.url ? "MuiInputLabel-shrink" : ""}>Ссылка на внешний источник</InputLabel>
                                                                    <Input
                                                                        id={'url_' + item.id}
                                                                        onChange={handleChangeUrl}
                                                                        value={item.url || ''}
                                                                        multiline
                                                                    />
                                                                </FormControl>
                                                                <Button className="text-left" onClick={() => {
                                                                    setItemToChooseVideo(item);
                                                                    setIsOpenChooser(true);
                                                                    setIsChooserError(false);
                                                                    setVideoPreviewData(null);
                                                                    setChoosesVideo(item.videoRef ? Object.assign({}, item.videoRef) : null);
                                                                    setVideoRefId(item.videoRef ? item.videoRef.id : 0);
                                                                }}>Видео: {item.videoRef ? item.videoRef.title : 'Не выбрано'}</Button>
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
                </Paper>

                <VideoChooser
                    open={isOpenChooser}
                    item={itemToChooseVideo}
                    choosesVideo={choosesVideo}
                    save={save}
                    handleChangeId={handleChangeId}
                    videoPreviewData={videoPreviewData}
                    isChooserError={isChooserError}
                    videoRefId={videoRefId}
                    onCancel={() => {
                        setItemToChooseVideo(null);
                        setIsOpenChooser(false);
                        setChoosesVideo(null);
                        setVideoRefId(0);
                    }}
                    getVideoPreview={getVideoPreview}
                />

                <MessageDialog message={dialogMessage} open={isOpenDialog} onClose={() => {setIsOpenDialog(false)}}/>
            </div>
        </Layout>
    );
};

export default Carousel;

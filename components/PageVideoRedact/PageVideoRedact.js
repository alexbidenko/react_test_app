import {useCallback, useEffect, useRef, useState} from "react";
import Router from "next/router";
import axios from "axios";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Chip from "@material-ui/core/Chip";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import FormHelperText from "@material-ui/core/FormHelperText";
import Divider from "@material-ui/core/Divider";
import Input from "@material-ui/core/Input";
import Switch from "@material-ui/core/Switch";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import MessageDialog from "../MessageDialog/MessageDialog";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Layout from "../Layout/Layout";
import Hls from "../../node_modules/hls.js/dist/hls";
import dataURLtoFile from "../../scripts/dataURLtoFile";
import ProgressUploadDialog from "../ProgressUploadDialog/ProgressUploadDialog";
import toDateFormatted from "../../scripts/toDateFormatted";
import FormGroup from "@material-ui/core/FormGroup";
import FloatingMark from "../FloatingMark/FloatingMark";
import LeftTime from "../LeftTime/LeftTime";

let timer = null;
const CancelToken = axios.CancelToken;

const videosAccept = 'video/mp4,video/h264,video/3gp';
const imagesAccept = 'image/jpeg,image/jpg,image/png';

const useHookWithRefCallback = () => {
    const ref = useRef(null);
    const setRef = useCallback(node => {
        if (node && !ref.current) {
            node.addEventListener('loadedmetadata', () => {
                document.querySelectorAll('canvas, .redact-preview').forEach(el => {
                    if (node.offsetHeight > 0)
                        el.style.height = node.offsetHeight.toString() + 'px';
                });
            });

            document.querySelectorAll('canvas, .redact-preview').forEach(el => {
                if (node.offsetHeight > 0)
                    el.style.height = node.offsetHeight.toString() + 'px';
                else el.style.height = '200px';
            });
            window.addEventListener('resize', () => {
                document.querySelectorAll('canvas, .redact-preview').forEach(el => {
                    if (node.offsetHeight > 0)
                        el.style.height = node.offsetHeight.toString() + 'px';
                });
            });
        }

        ref.current = node
    }, []);

    return [setRef, ref]
};

let uploadRequestCanceler;

const PageVideoRedact = ({ videoId }) => {
    const [data, setData] = useState(null);
    const [currentLevel, setCurrentLevel] = useState(-1);
    const [qualities, setQualities] = useState([]);
    const [imageData, setImageData] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [markData, setMarkData] = useState(null);
    const [markFile, setMarkFile] = useState(null);
    const [frameLevel, setFrameLevel] = useState(0);
    const [playlists, setPlaylists] = useState([]);
    const [videoFile, setVideoFile] = useState(null);
    const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
    const [conversion, setConversion] = useState(null);
    const [lastUpdateConversion, setLastUpdateConversion] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(-1);
    const [uploadTotalSize, setUploadTotalSize] = useState(0);
    const [isOpenMessageDialog, setIsOpenMessageDialog] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [markState, setMarkState] =
        useState(
            typeof localStorage !== 'undefined'
            && localStorage.markState
                ? JSON.parse(localStorage.markState)
                : {
                    top: 0,
                    left: 0,
                    width: null,
                    height: null,
                }
        );
    const [hls, setHls] = useState(null);
    const [markPosition, setMarkPosition] = useState(null);

    const [setVideoRef, videoRef] = useHookWithRefCallback();
    const videoContainerRef = useRef(null);

    const updateQuality = (event) => {
        hls.currentLevel = event.target.value;
        setCurrentLevel(event.target.value);
    };

    const createFrame = () => {
        let canvas = document.getElementById("getFrame");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0,
            videoRef.current.videoWidth,
            videoRef.current.videoHeight,
            0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
        setImageData(canvas.toDataURL());
        setImageFile(dataURLtoFile(canvas.toDataURL(), "video_frame.png"));
    };

    const uploadVideo = (event) => {
        if(event.target.files) {
            if(videosAccept.split(',').indexOf(event.target.files[0].type) < 0) {
                setDialogMessage(`Недопустимый видео файла (Доступны только ${videosAccept})`);
                setIsOpenMessageDialog(true);
                return;
            }

            setVideoFile(event.target.files[0]);
            videoRef.current.src = URL.createObjectURL(event.target.files[0]);
        }
    };

    const uploadImage = (event) => {
        if(event.target.files) {
            if(imagesAccept.split(',').indexOf(event.target.files[0].type) < 0) {
                setDialogMessage(`Недопустимый изображения файла (Доступны только ${imagesAccept})`);
                setIsOpenMessageDialog(true);
                return;
            }

            setImageData(URL.createObjectURL(event.target.files[0]));
            setImageFile(event.target.files[0]);
        }
    };

    const uploadMark = (event) => {
        if(event.target.files) {
            const data = URL.createObjectURL(event.target.files[0]);
            setMarkData(data);
            setMarkFile(event.target.files[0]);
        }
    };

    const checkAllData = () => {
        if(data.title && data.description && data.playlist.length > 0
            /*&& p1 && p2 && p3 && p4*/) {
            if(!videoId) {
                return !!(imageFile && videoFile);
            }
            return true;
        }
        return false;
    };

    const saveVideo = () => {
        if(checkAllData()) {
            fetch(`${process.env.API_URL}admin/videos${videoId ? '/' + videoId : ''}`, {
                method: videoId ? 'PATCH' : 'POST',
                headers: new Headers({
                    authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    playlistIds: data.playlist.map(el => el.id),
                    paid: data.paid,
                    paevskaya: data.paevskaya,
                    createdAtSec: data.createdAtSec,
                    publishAtSec: data.publishAtSec,
                })
            }).then(response => response.json()).then(body => {
                const formData = new FormData();
                if (imageFile) {
                    formData.append('preview', imageFile);
                }
                if (videoFile) {
                    formData.append('video', videoFile);
                }
                if (markFile) {
                    formData.append('watermark', markFile);
                }
                setUploadProgress(imageFile || videoFile || markFile ? 0 : -1);
                setUploadTotalSize(
                    (imageFile ? imageFile.size : 0)
                    + (videoFile ? videoFile.size : 0)
                    + (markFile ? markFile.size : 0)
                );
                const url = new URL(`${process.env.API_URL}admin/videos/${body.id}/content`);
                if (markPosition && markFile) {
                    Object.keys(markPosition).forEach(key => {
                        url.searchParams.append(key, markPosition[key]);
                    });
                }
                axios.patch(url.toString(), formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    timeout: 9999999,
                    onUploadProgress: (event) => {
                        setUploadProgress(imageFile || videoFile || markFile ? event.loaded : -1);
                        setUploadTotalSize(event.total);
                    },
                    cancelToken: new CancelToken((c) => {
                        uploadRequestCanceler = c;
                    }),
                })
                    .then(() => {
                        setUploadProgress(-1);
                        Router.push('/videos');
                    }).catch(e => {
                        setUploadProgress(-1);
                    });
            });
        }
    };

    const handleChangeTitle = (event) => {
        event.persist();
        setData(prev => ({...prev, ...{title: event.target.value}}));
    };

    const handleChangeDescription = (event) => {
        event.persist();
        setData(prev => ({...prev, ...{description: event.target.value}}));
    };

    const toggleSwitch = (event) => {
        setData(prev => ({...prev, ...{[event.target.name]: !prev[event.target.name]}}));
    };

    const findPlaylist = (id) => {
        return playlists.find(playlist => playlist.id === id);
    };

    const handleChangePlaylists = (event) => {
        event.persist();
        const value = [];
        for (let id of event.target.value) {
            value.push(findPlaylist(id));
        }
        setData(prev => ({...prev, ...{playlist: value}}));
    };

    const updateConversion = () => {
        fetch(`${process.env.API_URL}admin/videos/conversion/${videoId}`, {
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => {
            if(response.ok) {
                response.json().then(c => {
                    setConversion(c);
                });
            } else {
                fetch(`${process.env.API_URL}admin/videos/${videoId}`, {
                    headers: new Headers({
                        authorization: `Bearer ${localStorage.getItem('token')}`
                    })
                }).then(r => r.json()).then(v => {
                    if(v.master != null && v.preview != null) {
                        const newVideo = {};
                        if(videoFile == null) {
                            newVideo.master = v.master;
                        }
                        if(imageFile == null) {
                            newVideo.preview = v.preview;
                        }
                        setData(prev => ({...prev, ...newVideo}));
                        setConversion(null);
                    }
                });
            }
        });
    };

    const handleDateChange = (date) => {
        date.persist();
        const d = new Date(date.target.value);
        if (d instanceof Date && !isNaN(d.getTime())) {
            setData(prev => ({...prev, ...{[date.target.name]: Math.round(d.getTime() / 1000)}}));
        }
    };

    const getChips = (selected) => {
        return playlists.length > 0 ? selected.map(value => (
            <Chip key={findPlaylist(value).id} label={findPlaylist(value).name} className="mr-2"/>
        )) : null;
    };

    const deleteVideo = () => {
        fetch(`${process.env.API_URL}admin/videos/${videoId}`, {
            method: 'DELETE',
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => {
            if (response.ok) {
                Router.push('/videos');
            }
        });
    };

    useEffect(() => {
        if (conversion != null && timer == null) {
            timer = setTimeout(() => {
                timer = null;
                if (lastUpdateConversion > 10 || conversion.etaSec - 1 <= 0) {
                    updateConversion();
                }
                setConversion(prev => ({
                    ...prev,
                    ...{
                        progress: conversion.progress + (1 - conversion.progress) / conversion.etaSec,
                        etaSec: conversion.etaSec - 1,
                    }
                }));
                setLastUpdateConversion(lastUpdateConversion + 1);
            }, 1000);
        }
    }, [conversion]);

    const getDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return `${date.getDate()}.${((date.getMonth() + 1) / 100).toFixed(2).toString().substring(2)}.${date.getFullYear()} ` +
            `${(date.getHours() / 100).toFixed(2).toString().substring(2)}:${(date.getMinutes() / 100).toFixed(2).toString().substring(2)}`;
    };

    const filter = (label, text) => {
        return label.toLowerCase().indexOf(text.trim().toLowerCase()) > -1;
    };

    const arr1 = new Array(69).fill(null).map((el, index) => ({label: `Вариант ${(index + 1)}: ${(index + 1) * 65}р`}));
    const arr2 = new Array(69).fill(null).map((el, index) => ({label: `Вариант ${(index + 1)}: ${(index + 1) * 15}р`}));

    useEffect(() => {
        const fetchData = async () => {
            if (typeof localStorage !== 'undefined' && localStorage.getItem('token') == null) {
                Router.push("/login");
            }

            fetch(`${process.env.API_URL}admin/playlists`, {
                headers: new Headers({
                    authorization: `Bearer ${localStorage.getItem('token')}`
                })
            }).then(r => r.json()).then(body => {
                setPlaylists(body.data);
            });
            if (videoId) {
                fetch(`${process.env.API_URL}admin/videos/${videoId}`, {
                    headers: new Headers({
                        authorization: `Bearer ${localStorage.getItem('token')}`
                    })
                }).then(r => {
                    if (!r.ok) {
                        Router.push('/videos');
                    }
                    return r.json();
                }).then(body => {
                    if (body.master == null || body.preview == null) {
                        updateConversion();
                        setData(body);
                        setImageData('converting');
                    } else {
                        fetch(`${process.env.API_URL}videos${body.preview}`, {
                            headers: new Headers({
                                authorization: `Bearer ${localStorage.getItem('token')}`
                            })
                        }).then(r => r.blob()).then(file => {
                            const fr = new FileReader();
                            fr.onload = () => {
                                setImageData(fr.result);
                            };
                            fr.readAsDataURL(file);
                            setData(body);
                            setImageData(null);
                        });
                    }
                });
            } else {
                setData({
                    title: null,
                    description: null,
                    paid: false,
                    paevskaya: false,
                    playlist: [],
                    master: null,
                    preview: null,
                    createdAtSec: Math.round(new Date().getTime() / 1000),
                    publishAtSec: Math.round(new Date().getTime() / 1000),
                });
            }
        };
        fetchData();
    }, [videoId]);
    useEffect(() => {
        const setVideoHls = (url) => {
            if(Hls.isSupported()) {
                const newHls = new Hls({
                    xhrSetup: xhr => {
                        xhr.setRequestHeader('authorization', `Bearer ${localStorage.getItem('token')}`)
                    }
                });
                newHls.loadSource(url);
                newHls.attachMedia(videoRef.current);
                newHls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setQualities(hls.levels);
                });

                newHls.on(Hls.Events.LEVEL_SWITCHING, (event, data) => {
                    setFrameLevel(data.level);
                });
                setHls(newHls);
            }
            else if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = url;
            }
        };

        if (data && data.master && !hls && videoRef.current) {
            setVideoHls(`${process.env.API_URL}videos${data.master}`);
        }
    }, [data, videoRef.current]);

    const cancelUpload = () => {
        if(uploadRequestCanceler) {
            uploadRequestCanceler();
            setUploadRequestCanceler(null);
            setUploadProgress(-1);
        }
    };

    return (
        <Layout>
            {data && <Paper className="container p-0">
                <div className="p-3" style={{display: 'flex'}}>
                    <Button onClick={() => {Router.push('/videos')}} className="link">Назад</Button>
                    {videoId
                    && <Button
                        onClick={() => {setIsOpenDeleteDialog(true)}}
                        disabled={!!(data.statistics && (data.statistics.purchaseCount || data.statistics.activeRentCount))}
                    >
                        Удалить
                    </Button>
                    }

                    <TextField
                        style={{marginLeft: 'auto'}}
                        id="datetime-local"
                        required
                        label="Дата создания"
                        type="datetime-local"
                        name="createdAtSec"
                        value={toDateFormatted(new Date(data.createdAtSec * 1000))}
                        onChange={handleDateChange}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </div>

                <Divider />

                {data.statistics && <div className="px-3 pt-3">
                    <p className="mb-1">Покупок: {data.statistics.purchaseCount}</p>
                    <p className="mb-1">Всего аренд: {data.statistics.totalRentCount}</p>
                    <p>Активных аренд: {data.statistics.activeRentCount}</p>
                </div>}

                <Divider />

                <div className="p-3">
                    <FormControl className="w-100 mb-3">
                        <InputLabel htmlFor="title"
                                    className={data.title ? "MuiInputLabel-shrink" : ""}>Название</InputLabel>
                        <Input
                            id="title"
                            value={data.title || ''}
                            onChange={handleChangeTitle}
                            error={data.title === ''}
                        />
                        <FormHelperText>{data.title === '' ? 'Укажите название' : ''}</FormHelperText>
                    </FormControl>
                    <FormControl className="w-100 mb-3">
                        <InputLabel htmlFor="description"
                                    className={data.description ? "MuiInputLabel-shrink" : ""}>Описание</InputLabel>
                        <Input
                            id="description"
                            onChange={handleChangeDescription}
                            error={data.description === ''}
                            value={data.description || ''}
                            multiline
                        />
                        <FormHelperText>{data.description === '' ? 'Укажите описание' : ''}</FormHelperText>
                    </FormControl>

                    <FormGroup row>
                        <FormControlLabel
                            control={
                                <Switch
                                    name="paid"
                                    checked={data.paid}
                                    onChange={toggleSwitch}
                                />
                            }
                            label="Является платным"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    name="paevskaya"
                                    checked={data.paevskaya}
                                    onChange={toggleSwitch}
                                />
                            }
                            label="Паевской"
                        />
                    </FormGroup>

                    <Divider/>

                    {/*{data.paid &&*/}
                    {/*    <div className="row autocompleteForm">*/}
                    {/*        <div className="col-12 col-sm-6 autocomplete">*/}
                    {/*            <p className="mb-0 mt-3">Google Play</p>*/}
                    {/*            <ReactAutocomplete*/}
                    {/*                getItemValue={(item) => item.label}*/}
                    {/*                autoComplete*/}
                    {/*                includeInputInList*/}
                    {/*                items={arr1.filter(el => filter(el.label, p1))}*/}
                    {/*                renderInput={(params) => <TextField {...params} label="Покупка" margin="normal" />}*/}
                    {/*                value={p1}*/}
                    {/*                onChange={(e) => app.setState({p1: e.target.value})}*/}
                    {/*                onSelect={(val) => app.setState({p1: val})}*/}
                    {/*                renderItem={(item, isHighlighted) =>*/}
                    {/*                    (<div key={item.label} style={{ background: isHighlighted ? 'lightgray' : 'white' }}>*/}
                    {/*                        {item.label}*/}
                    {/*                    </div>)*/}
                    {/*                }*/}
                    {/*            />*/}
                    {/*            <ReactAutocomplete*/}
                    {/*                getItemValue={(item) => item.label}*/}
                    {/*                autoComplete*/}
                    {/*                includeInputInList*/}
                    {/*                items={arr2.filter(el => filter(el.label, p2))}*/}
                    {/*                renderInput={(params) => <TextField {...params} label="Аренда" margin="normal" />}*/}
                    {/*                value={p2}*/}
                    {/*                onChange={(e) => app.setState({p2: e.target.value})}*/}
                    {/*                onSelect={(val) => app.setState({p2: val})}*/}
                    {/*                renderItem={(item, isHighlighted) =>*/}
                    {/*                    (<div key={item.label} style={{ background: isHighlighted ? 'lightgray' : 'white' }}>*/}
                    {/*                        {item.label}*/}
                    {/*                    </div>)*/}
                    {/*                }*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*        <div className="col-12 col-sm-6 autocomplete">*/}
                    {/*            <p className="mb-0 mt-3">App Store</p>*/}
                    {/*            <ReactAutocomplete*/}
                    {/*                getItemValue={(item) => item.label}*/}
                    {/*                autoComplete*/}
                    {/*                includeInputInList*/}
                    {/*                items={arr1.filter(el => filter(el.label, p3))}*/}
                    {/*                renderInput={(params) => <TextField {...params} label="Покупка" margin="normal" />}*/}
                    {/*                value={p3}*/}
                    {/*                onChange={(e) => app.setState({p3: e.target.value})}*/}
                    {/*                onSelect={(val) => app.setState({p3: val})}*/}
                    {/*                renderItem={(item, isHighlighted) =>*/}
                    {/*                    (<div key={item.label} style={{ background: isHighlighted ? 'lightgray' : 'white' }}>*/}
                    {/*                        {item.label}*/}
                    {/*                    </div>)*/}
                    {/*                }*/}
                    {/*            />*/}
                    {/*            <ReactAutocomplete*/}
                    {/*                getItemValue={(item) => item.label}*/}
                    {/*                autoComplete*/}
                    {/*                includeInputInList*/}
                    {/*                items={arr2.filter(el => filter(el.label, p4))}*/}
                    {/*                renderInput={(params) => <TextField {...params} label="Аренда" margin="normal" />}*/}
                    {/*                value={p4}*/}
                    {/*                onChange={(e) => app.setState({p4: e.target.value})}*/}
                    {/*                onSelect={(val) => app.setState({p4: val})}*/}
                    {/*                renderItem={(item, isHighlighted) =>*/}
                    {/*                    (<div key={item.label} style={{ background: isHighlighted ? 'lightgray' : 'white' }}>*/}
                    {/*                        {item.label}*/}
                    {/*                    </div>)*/}
                    {/*                }*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*}*/}

                    {/*<Divider/>*/}

                    <div className="px-3">
                        <div className="row mb-3">
                            <div className="col-12 col-lg-6 p-0">
                                {hls && hls.url && hls.url.length > 4 && hls.url.substring(hls.url.length - 4) === 'm3u8'
                                && <FormControl className="player-select mb-1">
                                    <InputLabel id="demo-simple-select-label">Качество видео</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        onChange={updateQuality}
                                        value={currentLevel}
                                    >
                                        <MenuItem value={-1}>Авто</MenuItem>
                                        {qualities.map(quality => (
                                            <MenuItem key={quality.height} value={qualities.indexOf(quality)}>{quality.height}p</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                }
                                <Button component="label" className="my-2">
                                    Загрузить
                                    <input
                                        type="file"
                                        style={{ display: "none" }}
                                        accept={videosAccept}
                                        onChange={uploadVideo}
                                    />
                                </Button>

                                {videoFile && (markData ?
                                    <Button className="my-2" onClick={() => {
                                        setMarkData(null);
                                        setMarkFile(null);
                                    }}>
                                        Удалить марку
                                    </Button> :
                                    <Button component="label" className="my-2">
                                        Марка
                                        <input
                                            type="file"
                                            style={{ display: "none" }}
                                            accept="image/*"
                                            onChange={uploadMark}
                                        />
                                    </Button>
                                )}

                                {imageData === 'converting'
                                    ? <span className="converting-process">
                                        <span>
                                            Видео обрабатывается:
                                            <br/>
                                            <LeftTime conversion={conversion} />
                                        </span>
                                    </span>
                                    : <div
                                        style={{position: 'relative', overflow: 'hidden', margin: 'auto', maxHeight: '400px', width: 'fit-content'}}
                                        ref={videoContainerRef}
                                        id="videoContainer"
                                    >
                                        <video ref={setVideoRef} id="video" controls style={{maxHeight: '400px', maxWidth: '100%'}} className="d-block"/>
                                        <FloatingMark
                                            startPosition={markState}
                                            markData={markData}
                                            container={videoContainerRef}
                                            onChange={setMarkPosition}
                                        />
                                    </div>
                                }
                            </div>
                            <div className="col-12 col-lg-6 p-0">
                                {data.master !== null || videoFile ?
                                    <Button onClick={createFrame} className="my-2">Создать кадр</Button> : null}
                                <Button component="label" className="my-2">
                                    Загрузить
                                    <input
                                        type="file"
                                        style={{ display: "none" }}
                                        accept={imagesAccept}
                                        onChange={uploadImage}
                                    />
                                </Button>

                                <canvas id="getFrame"/>

                                {imageData === 'converting' ?
                                    <span className={"converting-process"}><span>Видео обрабатывается:<br/><LeftTime/></span></span> :
                                    <img style={{
                                        margin: 'auto',
                                        maxHeight: '400px',
                                        maxWidth: '100%',
                                        display: 'block',
                                    }} src={imageData}/>}
                            </div>
                        </div>
                    </div>

                    <FormControl className="w-100">
                        <InputLabel id="playlists-label">Плейлисты</InputLabel>
                        <Select
                            labelId="playlists-label"
                            id="playlists"
                            multiple
                            value={data.playlist.map(el => el.id)}
                            onChange={handleChangePlaylists}
                            input={<Input id="select-multiple-chip" />}
                            renderValue={selected => (
                                <div>
                                    {playlists ? getChips(selected) : null}
                                </div>
                            )}
                        >
                            {playlists.map(playlist => (
                                <MenuItem key={playlist.id} value={playlist.id}>
                                    {playlist.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        id="datetime-local"
                        label="Отложить публикацию до"
                        type="datetime-local"
                        name="publishAtSec"
                        required
                        value={toDateFormatted(new Date((data.publishAtSec || new Date().getTime() / 1000) * 1000))}
                        onChange={handleDateChange}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </div>

                <Divider />

                <div className="p-3">
                    <Button onClick={saveVideo} disabled={!checkAllData()}>Сохранить</Button>
                </div>

                <ConfirmDialog open={isOpenDeleteDialog} onClose={() => {setIsOpenDeleteDialog(false)}} positiveAction={deleteVideo}
                               title={'Подтвержите удаление'} description={`Вы действительно хотите удалить видео "${data.title}"?`}/>

                <ProgressUploadDialog
                    open={uploadProgress !== -1}
                    loaded={uploadProgress}
                    total={uploadTotalSize}
                    onCancel={cancelUpload}
                />

                <MessageDialog message={dialogMessage} open={isOpenMessageDialog} onClose={() => {setIsOpenMessageDialog(false)}}/>
            </Paper>}
        </Layout>
    );
};

export default PageVideoRedact;

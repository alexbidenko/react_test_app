import Router from "next/router";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import React, {useEffect, useState} from "react";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import MenuItem from "@material-ui/core/MenuItem";
import Input from "@material-ui/core/Input";
import Checkbox from "@material-ui/core/Checkbox";
import ListItemText from "@material-ui/core/ListItemText";
import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import TableBody from "@material-ui/core/TableBody";
import IconButton from "@material-ui/core/IconButton";
import Icon from "@material-ui/core/Icon";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import TrackVisibility from "../../components/TrackVisibility/TrackVisibility";
import LeftTime from "../../components/LeftTime/LeftTime";
import {getComparator, stableSort} from "../../scripts/sorting";
import Layout from "../../components/Layout/Layout";

let timer;

const Videos = () => {
    const [videos, setVideos] = useState([]);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('id');
    const [conversion, setConversion] = useState([]);
    const [lastUpdateConversion, setLastUpdateConversion] = useState(0);
    const [filters, setFilters] = useState({
        isPaevskaya: '',
        isPaid: '',
        playlistIds: []
    });
    const [playlists, setPlaylists] = useState([]);
    const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState(null);
    const [loadedImage, setLoadedImage] = useState({});

    const updateConversion = () => {
        fetch(`${process.env.API_URL}admin/videos/conversion`, {
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => response.json()).then(body => {
            if(conversion.length > 0) {
                conversion.forEach(el => {
                    if(body.data.find(video => video.videoId === el.videoId) == null) {
                        fetch(`${process.env.API_URL}admin/videos/${el.videoId}`, {
                            headers: new Headers({
                                authorization: `Bearer ${localStorage.getItem('token')}`
                            })
                        }).then(r => r.json()).then(newVideo => {
                            const videos = videos;
                            for(let j = 0; j < videos.length; j++) {
                                if(videos[j].id === newVideo.id) {
                                    videos[j].preview = newVideo.preview;
                                    videos[j].master = newVideo.master;
                                    setVideos(videos);
                                }
                            }
                        });
                    }
                });
            }
            setConversion(body.data);
            setLastUpdateConversion(0);
        });
    };

    useEffect(() => {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('token') == null) {
            Router.push("/login");
        }

        fetch(`${process.env.API_URL}admin/videos?deleted=false`, {
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => response.json()).then(body => {
            setVideos(body.data);
            updateConversion();
        });
        fetch(`${process.env.API_URL}admin/playlists`, {
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => response.json()).then(body => {
            setPlaylists(body.data);
        });
    }, []);

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrderBy(property);
        setOrder(isAsc ? 'desc' : 'asc');
    };

    const updateList = () => {
        const url = new URL(`${process.env.API_URL}admin/videos`);
        if(filters.isPaevskaya !== '') url.searchParams.append('paevskaya', filters.isPaevskaya);
        if(filters.isPaid !== '') url.searchParams.append('paid', filters.isPaid);
        if(filters.playlistIds.length > 0) url.searchParams.append('playlistIds', filters.playlistIds.join(','));
        fetch(url.toString(), {
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => response.json()).then(body => {
            setVideos(body.data);
        });
    };

    const updateFilters = (event) => {
        filters[event.target.name] = event.target.value;
        setFilters(filters);
        updateList();
    };

    const findPlaylist = (id) => {
        return playlists.find(playlist => playlist.id === id);
    };

    const toDeleteVideo = (video) => {
        setVideoToDelete(video);
        setIsOpenDeleteDialog(true);
    };

    useEffect(() => {
        if (conversion && conversion.length > 0 && timer == null) {
            timer = setTimeout(() => {
                timer = null;
                let isOneComplete = false;
                if (lastUpdateConversion > 10 || isOneComplete) {
                    updateConversion();
                }
                setConversion(conversion.map(el => {
                    el.progress += (1 - el.progress) / el.etaSec;
                    el.etaSec--;
                    if (el.etaSec <= 0) {
                        isOneComplete = true;
                    }
                    return el;
                }));
                setLastUpdateConversion(lastUpdateConversion + 1);
            }, 1000);
        }
    });

    const deleteVideo = () => {
        fetch(`${process.env.API_URL}admin/videos/${videoToDelete.id}`, {
            method: 'DELETE',
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => {
            if (response.ok) {
                setVideos(videos.filter(video => video.id !== videoToDelete.id));
                setVideoToDelete(null);
                setIsOpenDeleteDialog(false);
            }
        });
    };

    const LoadingImage = (isVisible, item) => {
        if(isVisible && !loadedImage[item.preview] && loadedImage[item.preview] !== 'loading') {
            setLoadedImage(Object.assign(loadedImage, {[item.preview]: 'loading'}));
            fetch(`${process.env.API_URL}videos${item.preview}`, {
                headers: new Headers({
                    authorization: `Bearer ${localStorage.getItem('token')}`
                })
            }).then(r => r.blob()).then(file => {
                const fr = new FileReader();
                fr.onload = () => {
                    setLoadedImage((images) => ({...images, ...{[item.preview]: fr.result}}));
                };
                fr.readAsDataURL(file);
            });
        }
        return null;
    };

    return (
        <Layout>
            <div className="container p-0">
                <Paper className="p-3 mb-4">
                    <Button onClick={() => {Router.push("/")}} className="link">Назад</Button>
                    <Button onClick={() => {Router.push("/videos/create")}} className="link">Создать новое видео</Button>
                </Paper>

                <Paper className="p-3 mb-4 container-fluid">
                    <div className="row">
                        <div className="col-6 col-md-3">
                            <FormControl className="w-100 mr-2">
                                <InputLabel>Платные</InputLabel>
                                <Select
                                    value={filters.isPaid}
                                    name="isPaid"
                                    onChange={updateFilters}
                                >
                                    <MenuItem value={''}>Не важно</MenuItem>
                                    <MenuItem value={true}>Да</MenuItem>
                                    <MenuItem value={false}>Нет</MenuItem>
                                </Select>
                            </FormControl>
                        </div>
                        <div className="col-6 col-md-3">
                            <FormControl className="w-100 mr-2">
                                <InputLabel>Паевской</InputLabel>
                                <Select
                                    value={filters.isPaevskaya}
                                    name="isPaevskaya"
                                    onChange={updateFilters}
                                >
                                    <MenuItem value={''}>Не важно</MenuItem>
                                    <MenuItem value={true}>Да</MenuItem>
                                    <MenuItem value={false}>Нет</MenuItem>
                                </Select>
                            </FormControl>
                        </div>
                        <div className="col-12 col-md-6">
                            <FormControl className="w-100 mr-2">
                                <InputLabel>Плейлисты</InputLabel>
                                <Select
                                    multiple
                                    value={filters.playlistIds}
                                    onChange={updateFilters}
                                    input={<Input />}
                                    name="playlistIds"
                                    renderValue={selected => selected.map(id => findPlaylist(id).name).join(', ')}
                                >
                                    {playlists.map(playlist => (
                                        <MenuItem key={playlist.id} value={playlist.id}>
                                            <Checkbox checked={filters.playlistIds.indexOf(playlist.id) > -1} />
                                            <ListItemText primary={findPlaylist(playlist.id).name} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                    </div>
                </Paper>

                <TableContainer component={Paper}>
                    <Table aria-label="Videos table">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sortDirection={orderBy === 'id' ? order : false}>
                                    <TableSortLabel
                                        active={orderBy === 'id'}
                                        direction={orderBy === 'id' ? order : 'asc'}
                                        onClick={() => handleRequestSort('id')}
                                    >
                                        ID
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="left"
                                           sortDirection={orderBy === 'title' ? order : false}>
                                    <TableSortLabel
                                        active={orderBy === 'title'}
                                        direction={orderBy === 'title' ? order : 'asc'}
                                        onClick={() => handleRequestSort('title')}
                                    >
                                        Название
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="left"
                                           sortDirection={orderBy === 'description' ? order : false}>
                                    <TableSortLabel
                                        active={orderBy === 'description'}
                                        direction={orderBy === 'description' ? order : 'asc'}
                                        onClick={() => handleRequestSort('description')}
                                    >
                                        Описание
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="left">Сведения</TableCell>
                                <TableCell align="right">Изображения</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stableSort(videos, getComparator(order, orderBy)).map(row => (
                                <TableRow key={row.id}>
                                    <TableCell component="th" scope="row">
                                        {row.id}
                                    </TableCell>
                                    <TableCell align="left">
                                        <p className="m-0" style={{maxHeight: '200px', overflow: 'hidden'}}>
                                            {row.title}
                                        </p>
                                    </TableCell>
                                    <TableCell align="left">
                                        <p className="m-0" style={{maxHeight: '200px', overflow: 'hidden'}}>
                                            {row.description}
                                        </p>
                                    </TableCell>
                                    <TableCell align="left">
                                        <div style={{minWidth: '104px'}}>
                                            <p className="mb-1">Покупок: {row.statistics.purchaseCount}</p>
                                            <p className="mb-1">Всего аренд: {row.statistics.totalRentCount}</p>
                                            <p className="m-0">Активных аренд: {row.statistics.activeRentCount}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell align="right" className="p-0">
                                        {row.master
                                            ? (row.preview
                                                ? (loadedImage[row.preview] && loadedImage[row.preview] !== 'loading'
                                                    ? <img
                                                        src={loadedImage[row.preview]}
                                                        alt=""
                                                        className="img-fluid d-block mx-auto"
                                                        style={{maxHeight: '200px'}}
                                                    />
                                                    : <TrackVisibility offset={300} style={{minHeight: '1px', minWidth: '1px'}}>
                                                        {({isVisible}) => LoadingImage(isVisible, row)}
                                                    </TrackVisibility>)
                                                : null)
                                            : <span className="py-3 d-block">
                                                Обработка завершится через:
                                                <br/>
                                                <LeftTime conversion={conversion.find(el => el.videoId === row.id)}/>
                                            </span>
                                        }
                                    </TableCell>
                                    <TableCell align="right" className="p-0">
                                        <IconButton
                                            aria-label="edit"
                                            onClick={() => {Router.push('/videos/[videoId]', `/videos/${row.id}`)}}
                                            className="link"
                                        >
                                            <Icon>edit</Icon>
                                        </IconButton>
                                        <IconButton aria-label="edit" onClick={() => toDeleteVideo(row)}
                                                    disabled={!!(row.statistics.purchaseCount || row.statistics.activeRentCount)}>
                                            <Icon>delete</Icon>
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <ConfirmDialog
                    open={isOpenDeleteDialog}
                    onClose={() => {setIsOpenDeleteDialog(false)}}
                    positiveAction={deleteVideo}
                    title={'Подтвержите удаление'}
                    description={`Вы действительно хотите удалить видео "${(videoToDelete || {title: ''}).title}"?`}
                />
            </div>
        </Layout>
    );
};

export default Videos;

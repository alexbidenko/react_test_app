import React, {useEffect, useState} from "react";
import Router from "next/router";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Checkbox from "@material-ui/core/Checkbox";
import ListItemText from "@material-ui/core/ListItemText";
import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import TableBody from "@material-ui/core/TableBody";
import {getComparator, stableSort} from "../../scripts/sorting";
import TrackVisibility from "../../components/TrackVisibility/TrackVisibility";
import IconButton from "@material-ui/core/IconButton";
import Icon from "@material-ui/core/Icon";
import Input from "@material-ui/core/Input";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import toDateFormatted from "../../scripts/toDateFormatted";
import Layout from "../../components/Layout/Layout";
import LeftTime from "../../components/LeftTime/LeftTime";

const Basket = () => {
    const [videos, setVideos] = useState([]);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('id');
    const [filters, setFilters] = useState({
        isPaevskaya: '',
        isPaid: '',
        playlistIds: []
    });
    const [playlists, setPlaylists] = useState([]);
    const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState(null);
    const [loadedImage, setLoadedImage] = useState({});

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrderBy(property);
        setOrder(isAsc ? 'desc' : 'asc');
    };

    const findPlaylist = (id) => {
        return playlists.find(playlist => playlist.id === id);
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

    const toDeleteVideo = (video) => {
        setVideoToDelete(video);
        setIsOpenDeleteDialog(true);
    };
    const deleteVideo = () => {
        fetch(`${process.env.API_URL}admin/videos/${videoToDelete.id}/forever`, {
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
    const restoreVideo = (row) => {
        fetch(`${process.env.API_URL}admin/videos/${row.id}/restore`, {
            method: 'POST',
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => {
            if (response.ok) {
                setVideos(videos.filter(video => video.id !== row.id));
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
    
    useEffect(() => {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('token') == null) {
            Router.push("/login");
        }

        fetch(`${process.env.API_URL}admin/videos?deleted=true`, {
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => response.json()).then(body => {
            setVideos(body.data);
        });
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
            <div className="container p-0">
                <Paper className="p-3 mb-4">
                    <Button onClick={() => {Router.push("/")}} className="link">Назад</Button>
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
                                <TableCell align="right">Удалено</TableCell>
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
                                        {toDateFormatted(new Date(row.deletedAtSec * 1000))}
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
                                        <IconButton aria-label="edit" onClick={() => restoreVideo(row)}>
                                            <Icon>restore_from_trash</Icon>
                                        </IconButton>
                                        <IconButton aria-label="edit" onClick={() => toDeleteVideo(row)}>
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

export default Basket;

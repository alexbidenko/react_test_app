import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import {useEffect, useState} from "react";
import Router from "next/router";
import Layout from "../components/Layout/Layout";

const Home = () => {
    const [freeSpace, setFreeSpace] = useState(0);

    const fetchData = () => {
        fetch(`${process.env.API_URL}admin/videos/conversion/free-space`, {
            headers: new Headers({
                Authorization: `Bearer ${localStorage.getItem('token')}`
            })
        }).then(response => response.text()).then(body => {
            setFreeSpace(+body);
        });
    };

    useEffect(() => {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('token') == null) {
            Router.push("/login");
        }

        fetchData();
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        Router.push("/login");
    };

    const downloadFile = () => {
        fetch(`${process.env.API_URL}admin/reports/users`, {
            method: 'GET',
            headers: new Headers({
                authorization: `Bearer ${localStorage.getItem('token')}`
            })
        })
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'users.xlsx';
                document.body.appendChild(a);
                a.click();
                a.remove();
            });
    };

    return (
        <Layout>
            <div className="container p-0">
                <Paper className="p-3 mb-4">
                    <h1 className="page-title">Media App панель администратора</h1>
                </Paper>

                <div className="row">
                    <div className="col-12 col-md-6">
                        <Paper className="p-3 mb-4">
                            <Typography variant="h5" component="h2" className="mb-2">Основные сведения</Typography>
                            <p className="mb-2">Свободного места: {(freeSpace / 1024 / 1024 / 1024).toFixed(2)}ГБ</p>
                            <hr />
                            <Button onClick={downloadFile} className="link d-block">Скачать статистику</Button>
                        </Paper>
                    </div>
                    <div className="col-12 col-md-6">
                        <Paper className="p-3 mb-4">
                            <Button className="link d-block" onClick={() => {Router.push("/videos")}}>Редактировать видео</Button>
                            <Button className="link d-block" onClick={() => {Router.push("/playlists")}}>Редактировать плейлисты</Button>
                            <Button className="link d-block" onClick={() => {Router.push("/carousel")}}>Редактировать карусель</Button>
                            <Button className="link d-block" onClick={() => {Router.push("/basket")}}>Корзина</Button>
                            <hr />
                            <Button className="link d-block w-100 text-left" onClick={logout}>Выйти</Button>
                        </Paper>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Home

import {useState} from "react";
import Router from "next/router";
import Paper from "@material-ui/core/Paper";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Input from "@material-ui/core/Input";
import FormHelperText from "@material-ui/core/FormHelperText";
import Button from "@material-ui/core/Button";
import Layout from "../../components/Layout/Layout";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isError, setIsError] = useState(false);

    const isValidEmail = () => {
        return /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(email);
    };

    const isValidPassword = () => {
        return /^[\w\u005f\u002e\u002d]{6,225}$/.test(password);
    };

    const singIn = () => {
        setIsError(false);
        if(isValidEmail() && isValidPassword()) {
            fetch(`${process.env.API_URL}admin-auth/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                })
            }).then(r => {
                if(r.status === 200) {
                    r.json().then(body => {
                        localStorage.setItem('token', body.token);
                        Router.push('/');
                    });
                } else {
                    setIsError(true);
                }
            });
        }
    };

    return (
        <Layout>
            <div className="full-fixed">
                <div className="container p-0 position-relative h-100">
                    <Paper className="centering-block mx-auto p-5">
                        <h1 className="h4 text-center">Media App вход</h1>

                        <FormControl className="w-100 mb-3">
                            <InputLabel htmlFor="email"
                                        className={email ? "MuiInputLabel-shrink" : ""}>Email</InputLabel>
                            <Input
                                id="email"
                                onChange={(e) => {setEmail(e.target.value)}}
                                value={email}
                                name="email"
                                placeholder="admin@mail.ru"
                                error={!!email && !isValidEmail()}
                            />
                            <FormHelperText style={{minHeight: '19px'}}>{email && !isValidEmail() ? 'Некорректный адрес почты' : ''}</FormHelperText>
                        </FormControl>
                        <FormControl className="w-100 mb-3">
                            <InputLabel htmlFor="password"
                                        className={password ? "MuiInputLabel-shrink" : ""}>Пароль</InputLabel>
                            <Input
                                id="password"
                                onChange={(e) => {setPassword(e.target.value)}}
                                value={password}
                                type="password"
                                name="password"
                                placeholder="**********"
                                error={!!password && !isValidPassword()}
                            />
                            <FormHelperText style={{minHeight: '19px'}}>{password && !isValidPassword() ? 'Неверный пароль' : ''}</FormHelperText>
                        </FormControl>

                        <div className="alert alert-danger m-0" role="alert" style={{opacity: isError ? 1 : 0}}>
                            Неверный логин или пароль
                        </div>

                        <div className="p-3">
                            <Button className="ml-auto d-block" onClick={singIn}>Войти</Button>
                        </div>
                    </Paper>
                </div>
            </div>
        </Layout>
    );
};

export default Login;

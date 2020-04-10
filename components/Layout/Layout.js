import '../../public/static/styles.scss';
import Head from "next/head";

const Layout = (props) => {
    return (
        <div>
            <Head>
                <title>Media App Admin</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main>
                {props.children}
            </main>
        </div>
    );
};

export default Layout;

import {useRouter} from "next/router";
import PageVideoRedact from "../../components/PageVideoRedact/PageVideoRedact";

const VideoRedact = () => {
    const router = useRouter();
    let { videoId } = router.query;

    return (<PageVideoRedact videoId={videoId} />);
};

export default VideoRedact;

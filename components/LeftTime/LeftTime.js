const LeftTime = ({ conversion }) => {
    if(conversion == null || conversion.etaSec <= 0) return (<span>Подождите немного</span>);
    return (<span>{`${conversion.etaSec}c (${Math.floor(conversion.progress * 100)}%)`}</span>);
};

export default LeftTime;

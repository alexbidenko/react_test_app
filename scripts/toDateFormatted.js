const toDateFormatted = (d) => {
    const ye = (new Intl.DateTimeFormat('ru', { year: 'numeric' }).format(d) / 10000).toFixed(4).toString().substring(2);
    const mo = (new Intl.DateTimeFormat('ru', { month: '2-digit' }).format(d) / 100).toFixed(2).toString().substring(2);
    const da = (new Intl.DateTimeFormat('ru', { day: '2-digit' }).format(d) / 100).toFixed(2).toString().substring(2);
    const ho = (new Intl.DateTimeFormat('ru', { hour: '2-digit' }).format(d) / 100).toFixed(2).toString().substring(2);
    const mi = (new Intl.DateTimeFormat('ru', { minute: '2-digit' }).format(d) / 100).toFixed(2).toString().substring(2);
    return `${ye}-${mo}-${da}T${ho}:${mi}`;
};

export default toDateFormatted;

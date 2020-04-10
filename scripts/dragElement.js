const params = {
    height: 0,
    width: 0,
    left: 0,
    top: 0,
};

const dragElement = (elmnt, key = '', startPosition = null) => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    function elementDrag(e) {
        e = e || window.event;
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        const delta = 3;

        const el = elmnt.closest('#markContainer');
        if (key === '') {
            const container = el.closest('#videoContainer').getBoundingClientRect();

            const Y = params.top - pos2;
            if (Math.abs(Y) < delta) params.top = (0);
            else if (Math.abs(Y + params.height - container.height) < delta) params.top = container.height - params.height;
            else params.top = (Y);
            const X = params.left - pos1;
            if (Math.abs(X) < delta) params.left = (0);
            else if (Math.abs(X + params.width - container.width) < delta) params.left = container.width - params.width;
            else params.left = (X);
        } else if (key === 'bottomLine') {
            params.height = (params.height - pos2);
        } else if (key === 'rightLine') {
            params.width = (params.width - pos1);
        } else if (key === 'topLine') {
            params.height = (params.height + pos2);
            params.top = (params.top - pos2);
        } else if (key === 'leftLine') {
            params.width = (params.width + pos1);
            params.left = (params.left - pos1);


        } else if (key === 'leftTop') {
            params.width = (params.width + pos1);
            params.left = (params.left - pos1);
            params.height = (params.height + pos1 * params.height / params.width);
            params.top = (params.top - pos1 * params.height / params.width);
        } else if (key === 'rightTop') {
            params.width = (params.width - pos1);
            params.height = (params.height - pos1 * params.height / params.width);
            params.top = (params.top + pos1 * params.height / params.width);
        } else if (key === 'leftBottom') {
            params.width = (params.width + pos1);
            params.left = (params.left - pos1);
            params.height = (params.height + pos1 * params.height / params.width);
        } else if (key === 'rightBottom') {
            params.width = (params.width - pos1);
            params.height = (params.height - pos1 * params.height / params.width);
        }

        for (let p in params) {
            el.style[p] = params[p].toString() + 'px';
        }
    }

    function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
    }

    function dragMouseDown(e) {
        e = e || window.event;
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
    }

    if (!key && elmnt) {
        const el = elmnt.closest('#markContainer');
        el.style.top = startPosition.top;
        el.style.left = startPosition.left;
        params.top = startPosition.top;
        params.left = startPosition.left;
        el.style.width = startPosition.width + 'px';
        params.width = startPosition.width;
        el.style.height = startPosition.height + 'px';
        params.height = startPosition.height;
    }
    if (elmnt) elmnt.onmousedown = dragMouseDown;
};

export default dragElement;

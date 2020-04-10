import {useEffect, useRef} from "react";
import dragElement from "../../scripts/dragElement";

const FloatingMark = ({ markData, container, onChange, startPosition }) => {

    const mark = useRef(null);

    const markMouseDown = (event) => {
        event.preventDefault();
    };

    useEffect(() => {
        if (markData) {
            const img = new Image();
            img.onload = () => {
                setTimeout(() => {
                    dragElement(
                        document.getElementById('mark'),
                        '',
                        {
                            top: startPosition.top,
                            left: startPosition.left,
                            width: startPosition.width || Math.round(img.width / 2),
                            height: startPosition.height || Math.round (img.height / 2)
                        }
                    );
                    dragElement(document.getElementById('leftLine'), 'leftLine');
                    dragElement(document.getElementById('rightLine'), 'rightLine');
                    dragElement(document.getElementById('topLine'), 'topLine');
                    dragElement(document.getElementById('bottomLine'), 'bottomLine');

                    dragElement(document.getElementById('leftTop'), 'leftTop');
                    dragElement(document.getElementById('rightTop'), 'rightTop');
                    dragElement(document.getElementById('leftBottom'), 'leftBottom');
                    dragElement(document.getElementById('rightBottom'), 'rightBottom');
                }, 100);
            };
            img.src = markData;
        }

        const onPositionUpdate = () => {
            const markParams = mark.current.getBoundingClientRect();
            const containerParams = container.current.getBoundingClientRect();
            if (onChange && markData) {
                onChange({
                    wm_x: (markParams.left - containerParams.left) / containerParams.width,
                    wm_y: (markParams.top - containerParams.top) / containerParams.height,
                    wm_w: markParams.width / containerParams.width,
                    wm_h: markParams.height / containerParams.height,
                });
            }
        };

        document.addEventListener('mouseup', onPositionUpdate);
        return () => {
            document.removeEventListener('mouseup', onPositionUpdate);
        }
    }, [markData]);

    return (<div style={{
        position: 'absolute',
        display: markData ? 'block' : 'none',
    }} id="markContainer">
        <div style={{position: 'relative', height: '100%'}}>
            <img
                src={markData}
                ref={mark}
                id="mark"
                alt="Mark"
                style={{width: '100%', height: '100%', cursor: 'move'}}
                onMouseDown={markMouseDown}
            />
            <div style={{position: 'absolute', background: 'green', width: '4px',
                height: '100%', left: '-2px', top: 0, cursor: 'ew-resize'}}
                 id="leftLine" onMouseDown={markMouseDown}/>
            <div style={{position: 'absolute', background: 'green', width: '4px',
                height: '100%', right: '-2px', top: 0, cursor: 'ew-resize'}}
                 id="rightLine" onMouseDown={markMouseDown}/>
            <div style={{position: 'absolute', background: 'green', height: '4px',
                width: '100%', top: '-2px', left: 0, cursor: 'ns-resize'}}
                 id="topLine" onMouseDown={markMouseDown}/>
            <div style={{position: 'absolute', background: 'green', height: '4px',
                width: '100%', bottom: '-2px', left: 0, cursor: 'ns-resize'}}
                 id="bottomLine" onMouseDown={markMouseDown}/>

            <div style={{position: 'absolute', background: 'blue', width: '6px',
                height: '6px', left: '-3px', top: '-3px', cursor: 'nwse-resize'}}
                 id="leftTop" onMouseDown={markMouseDown}/>
            <div style={{position: 'absolute', background: 'blue', width: '6px',
                height: '6px', right: '-3px', top: '-3px', cursor: 'nesw-resize'}}
                 id="rightTop" onMouseDown={markMouseDown}/>
            <div style={{position: 'absolute', background: 'blue', height: '6px',
                width: '6px', left: '-3px', bottom: '-3px', cursor: 'nesw-resize'}}
                 id="leftBottom" onMouseDown={markMouseDown}/>
            <div style={{position: 'absolute', background: 'blue', height: '6px',
                width: '6px', bottom: '-3px', right: '-3px', cursor: 'nwse-resize'}}
                 id="rightBottom" onMouseDown={markMouseDown}/>
        </div>
    </div>);
};

export default FloatingMark;

import * as React from "react";
import {PureComponent} from "react";

class TrackVisibility extends PureComponent {
    static defaultProps = {
        once: false,
        throttleInterval: 150,
        offset: 0,
        partialVisibility: false,
        tag: 'div'
    };

    constructor(props) {
        super(props);
        this.state = {
            isVisible: false
        };
        this.throttleCb = this.isComponentVisible;

        props.nodeRef && this.setNodeRef(props.nodeRef);
    }

    componentDidMount() {
        this.attachListener();
        this.throttleCb();
    }

    componentDidUpdate(prevProps) {
        let isObjectsEqual = true;
        Object.keys(this.props).forEach(key => {
            if(this.props[key] !== prevProps[key]) isObjectsEqual = false;
        });
        if (
            !isObjectsEqual
        ) {
            this.throttleCb();
        }
    }

    componentWillUnmount() {
        this.removeListener();
    }

    attachListener() {
        window.addEventListener('scroll', this.throttleCb);
        window.addEventListener('resize', this.throttleCb);
    }

    removeListener() {
        window.removeEventListener('scroll', this.throttleCb);
        window.removeEventListener('resize', this.throttleCb);
    }

    getChildProps(props = this.props) {
        const childProps = {};
        Object.keys(props).forEach(key => {
            childProps[key] = props[key];
        });
        return childProps;
    }

    isVisible = (
        { top, left, bottom, right, width, height },
        windowWidth,
        windowHeight
    ) => {
        const { offset, partialVisibility } = this.props;

        if (top + right + bottom + left === 0) {
            return false;
        }

        const topThreshold = 0 - offset;
        const leftThreshold = 0 - offset;
        const widthCheck = windowWidth + offset;
        const heightCheck = windowHeight + offset;

        return partialVisibility
            ? top + height >= topThreshold &&
            left + width >= leftThreshold &&
            bottom - height <= heightCheck &&
            right - width <= widthCheck
            : top >= topThreshold &&
            left >= leftThreshold &&
            bottom <= heightCheck &&
            right <= widthCheck;
    };

    isComponentVisible = () => {
        setTimeout(() => {
            if (!this.nodeRef || !this.nodeRef.getBoundingClientRect) return;

            const html = document.documentElement;
            const { once } = this.props;
            const boundingClientRect = this.nodeRef.getBoundingClientRect();
            const windowWidth = window.innerWidth || html.clientWidth;
            const windowHeight = window.innerHeight || html.clientHeight;

            const isVisible = this.isVisible(
                boundingClientRect,
                windowWidth,
                windowHeight
            );

            if (isVisible && once) {
                this.removeListener();
            }

            this.setState({ isVisible });
        }, 0);
    };

    setNodeRef = ref => (this.nodeRef = ref);

    getChildren() {
        if (typeof this.props.children === 'function') {
            return this.props.children({
                ...this.getChildProps(),
                isVisible: this.state.isVisible
            });
        }

        return React.Children.map(this.props.children, child =>
            React.cloneElement(child, {
                ...this.getChildProps(),
                isVisible: this.state.isVisible
            })
        );
    }

    render() {
        const { className, style, nodeRef, tag: Tag } = this.props;
        const props = {
            ...(className && { className }),
            ...(style && { style })
        };

        return (
            <Tag ref={!nodeRef && this.setNodeRef} {...props}>
                {this.getChildren()}
            </Tag>
        );
    }
}

export default TrackVisibility;

{
    const blocked = [];
    const allowlist = (document.currentScript.getAttribute('allowlist') || '').split(',');

    const legitDocumentDomProps = ['documentElement', 'body', 'head', 'scrollingElement', 'firstElementChild', 'lastElementChild', 'activeElement', 'firstChild', 'lastChild'];

    observe(document.documentElement);

    function block(object, value, name, node) {
        blocked.push(JSON.stringify({object, value}));
        const tracked = [];
        while (node) {
            if (!(node instanceof HTMLCollection || node instanceof Element)) {
                break;
            }
            tracked.push(node);
            for (const prop of ['id', 'name']) {
                if (node.hasAttribute(prop)) {
                    const attr = node.getAttribute(prop);
                    node.setAttribute('shield_' + prop, attr);
                    node.removeAttribute(prop);
                }
            }
            node = window[object][value];
        }
        Object.defineProperty(window[object], value, {get: function() {
                throw new Error(`${object}["${value}"] access attempt was intercepted:`);
            }
        });
        for (const node of tracked) {
            for (const prop of ['id', 'name']) {
                if (node.hasAttribute('shield_' + prop)) {
                    const attr = node.getAttribute('shield_' + prop);
                    node.setAttribute(prop, attr);
                    node.removeAttribute('shield_' + prop);
                }
            }
        }
    }

    function blockDocument(value, name, node) {
        const object = 'document';
        if (blocked.includes(JSON.stringify({object, value}))) {
            return;
        }
        if (!document[value]) {
            return;
        }
        if (name !== 'id' && name !== 'name') {
            return;
        }
        if (legitDocumentDomProps.includes(value)) {
            return;
        }
        if (document[value] instanceof Element) {
            return block(object, value, name, node);
        }
        if (document[value] instanceof HTMLCollection) {
            return block(object, value, name, node);
        }
        if (document[value] === document[value]?.window) {
            return block(object, value, name, node);
        }
    }

    function blockWindow(value, name, node) {
        const object = 'window';
        if (blocked.includes(JSON.stringify({object, value}))) {
            return;
        }
        if (!window[value]) {
            return;
        }
        if (name !== 'id' && name !== 'name') {
            return;
        }
        if (window[value] instanceof Element) {
            return block(object, value, name, node);
        }
        if (window[value] instanceof HTMLCollection) {
            return block(object, value, name, node);
        }
        if (window[value] === window[value]?.window && name === 'name') {
            return block(object, value, name, node);
        }
    }

    function hook(node, {name, value}) {
        if (allowlist?.includes(value)) {
            return;
        }
        blockWindow(value, name, node);
        blockDocument(value, name, node);
    }

    function address(node) {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                const nodes = Array.from(node.querySelectorAll('*[id],*[name]')).concat(node);
                nodes.forEach(node => Array.from(node.attributes).forEach(address.bind(node)));
                break;
            case Node.ATTRIBUTE_NODE:
                const {name, value} = node;
                hook(this, {name, value});
                break;
            default:
                break;
        }
    }

    function observe(target) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                switch (mutation.type) {
                    case 'childList':
                        mutation.addedNodes.forEach(node => {
                            address(node);
                        });
                        break;
                    case 'attributes':
                        address(mutation.target);
                        break;
                }
            });
        });

        observer.observe(target, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['id', 'name'],
        });
    }
}

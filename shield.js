{
    const blocked = [];
    const allowlist = (document.currentScript.getAttribute('allowlist') || '').split(',');

    const specialDocumentGetters = {
        documentElement: Object.getOwnPropertyDescriptor(Document.prototype, 'documentElement').get,
        body: Object.getOwnPropertyDescriptor(Document.prototype, 'body').get,
        head: Object.getOwnPropertyDescriptor(Document.prototype, 'head').get,
        scrollingElement: Object.getOwnPropertyDescriptor(Document.prototype, 'scrollingElement').get,
        firstElementChild: Object.getOwnPropertyDescriptor(Document.prototype, 'firstElementChild').get,
        lastElementChild: Object.getOwnPropertyDescriptor(Document.prototype, 'lastElementChild').get,
        activeElement: Object.getOwnPropertyDescriptor(Document.prototype, 'activeElement').get,
        firstChild: Object.getOwnPropertyDescriptor(Node.prototype, 'firstChild').get,
        lastChild: Object.getOwnPropertyDescriptor(Node.prototype, 'lastChild').get,
    };

    observe(document.documentElement);

    function block(object, value, name, node) {
        if (blocked.includes(JSON.stringify({object, value}))) {
            return;
        }
        const tracked = [];
        while (node) {
            if (specialDocumentGetters[value]?.call(document) === node) {
                break;
            }
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
        if (!isNaN(parseInt(value))) {
            return;
        }
        Object.defineProperty(window[object], value, {get: function() {
                throw new Error(`${object}["${value}"] access attempt was intercepted:`);
            }
        });
        blocked.push(JSON.stringify({object, value}));
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

    function address(node) {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                const nodes = Array.from(node.querySelectorAll('*[id],*[name]')).concat(node);
                nodes.forEach(node => Array.from(node.attributes).forEach(address.bind(node)));
                break;
            case Node.ATTRIBUTE_NODE:
                const {name, value} = node;
                if (!allowlist?.includes(value)) {
                    block('window', value, name, this);
                    block('document', value, name, this);
                }
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

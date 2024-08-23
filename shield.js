{
    const blocked = [];
    const allowlist = (document.currentScript.getAttribute('allowlist') || '').split(',');
    const reportOnly = (document.currentScript.getAttribute('reportOnly') || 'false') === 'true';
    const reportTo = (document.currentScript.getAttribute('reportTo') || '');

    const legitDocumentDomProps = ['documentElement', 'body', 'head', 'scrollingElement', 'firstElementChild', 'lastElementChild', 'activeElement', 'firstChild', 'lastChild'];

    if (reportOnly && !reportTo.startsWith('https:')) {
        throw new Error('when reportOnly is turned on, reportTo must be provided as a legitimate URL.' +
            'until fixed, dom clobbering protection is off');
    }

    observe(document.documentElement);

    function report(value) {
        fetch(reportTo, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'csp-report': {
                    "blocked-property": value,
                    "disposition": "report",
                    "document-uri": document.documentURI,
                    "effective-directive": "dom-clobbering",
                    "original-policy": "no-access",
                    "referrer": document.referrer,
                    "violated-directive": "dom-clobbering",
                },
            }),
        });
    }

    function block(object, value) {
        blocked.push(value);
        Object.defineProperty(window[object], value, {get: get});
        function get() {
            if (reportOnly) {
                report(value);
            } else {
                throw new Error(`${object}["${value}"] access attempt was intercepted:`);
            }
        }
    }

    function blockDocument(value) {
        if (!document[value]) {
            return;
        }
        if (legitDocumentDomProps.includes(value)) {
            return;
        }
        if (document[value] instanceof Element) {
            return block('document', value);
        }
        if (document[value] instanceof HTMLCollection) {
            return block('document', value);
        }
        if (document[value] === document[value]?.window) {
            return block('document', value);
        }
    }

    function blockWindow(value, name) {
        if (!window[value]) {
            return;
        }
        if (name !== 'id' && name !== 'name') {
            return;
        }
        if (window[value] instanceof Element) {
            return block('window', value);
        }
        if (window[value] instanceof HTMLCollection) {
            return block('window', value);
        }
        if (window[value] === window[value]?.window && name === 'name') {
            return block('window', value);
        }
    }

    function hook(node) {
        const {name, value} = node;
        if (allowlist?.includes(value)) {
            return;
        }
        if (blocked.includes(value)) {
            return;
        }
        blockWindow(value, name);
        blockDocument(value);
    }

    function address(node) {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                const nodes = Array.from(node.querySelectorAll('*[id],*[name]')).concat(node);
                nodes.forEach(node => Array.from(node.attributes).forEach(address));
                break;
            case Node.ATTRIBUTE_NODE:
                hook(node);
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
            attributeFilter: ['id'],
        });
    }
}

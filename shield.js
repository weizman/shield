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

    function block(value) {
        blocked.push(value);
        Object.defineProperty(window, value, {get: get});
        function get() {
            if (reportOnly) {
                report(value);
            } else {
                throw new Error(`window["${value}"] access attempt was intercepted:`);
            }
        }
    }

    function hook(node) {
        const {name, value} = node;
        if (allowlist?.includes(value) || blocked.includes(value)) {
            return;
        }
        if (!window[value] && !document[value]) {
            return;
        }
        if (!legitDocumentDomProps.includes(prop)) {
            if (document[prop] instanceof Element) {
                return block(value);
            }
            if (document[prop] instanceof HTMLCollection) {
                return block(value);
            }
        }
        if (name !== 'id' && name !== 'name') {
            return;
        }
        if (window[value] instanceof Element) {
            return block(value);
        }
        if (window[value] instanceof HTMLCollection) {
            return block(value);
        }
        if (window[value] === window[value]?.window && name === 'name') {
            return block(value);
        }
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

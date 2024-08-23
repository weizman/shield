window.TEST = (function(){
    return async function main(container, object) {
        function error(err, object, prop) {
            return err.message === `${object}["${prop}"] access attempt was intercepted:`;
        }

        function setup() {
            container.innerHTML = `
<details>
    <summary style="cursor: pointer"><b>Tests for <u>${object}</u> <span id="result-${object}">✅</span></b> <i>(see in console)</i></summary>
    <div id="tests-${object}"></div>
</details>`;
            container.style.border = '1px solid';
            container.style.padding = '7px';
            container.style.fontSize = '13px';
        }

        function before() {
            return [
                document.getElementById('tests-' + object).appendChild(document.createElement('div')),
            ];
        }

        function assert(value, test) {
            try {window[object][test]} catch (err) {
                if (error(err, object, test)) {
                    return [true, test, null];
                } else {
                    return [false, test, err.message];
                }
            }
            if (window[object][test] === undefined) {
                return [true, test, `environment did not clobber ${object}["${test}"] (undefined)`];
            }
            if (window[object][test] === value) {
                return [false, test, `shield failed to prevent clobbering of ${object}["${test}"] (Element/Window)`];
            }
            throw new Error('UNEXPECTED TEST RESULT (TESTER MUST CHECK THIS)');
        }

        const tests = [
            // allowlist

            async function(div) {
                const test = object + (' : allow list ignored (span)');
                const child = div.appendChild(document.createElement('span'));
                child.id = 'aaa';
                await new Promise(r => setTimeout(r, 0));
                try {window['aaa']} catch (err) {
                    return [false, test];
                }
                try {document['aaa']} catch (err) {
                    return [false, test];
                }
                return [true, test];
            },

            // id

            async function(div) {
                const test = object + (' : id setter after blocked (span)');
                const child = div.appendChild(document.createElement('span'));
                child.id = test;
                await new Promise(r => setTimeout(r, 0));
                return assert(child, test);
            },

            async function(div) {
                const test = object + (' : id attr after blocked (span)');
                const child = div.appendChild(document.createElement('span'));
                child.setAttribute('id', test);
                await new Promise(r => setTimeout(r, 0));
                return assert(child, test);
            },

            async function(div) {
                const test = object + (' : id setter before blocked (span)');
                const child = document.createElement('span');
                child.id = test;
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                return assert(child, test);
            },

            async function(div) {
                const test = object + (' : id attr before blocked (span)');
                const child = document.createElement('span');
                child.setAttribute('id', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                return assert(child, test);
            },

            // name

            async function(div) {
                const test = object + (' : name attr before ignored (iframe)');
                const child = document.createElement('iframe');
                child.setAttribute('name', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                return assert(child.contentWindow, test);
            },

            async function(div) {
                const test = object + (' : name attr after ignored (iframe)');
                const child = div.appendChild(document.createElement('iframe'));
                child.setAttribute('name', test);
                await new Promise(r => setTimeout(r, 0));
                return assert(child.contentWindow, test);
            },

            async function(div) {
                const test = object + (' : name attr before blocked (iframe)');
                const child = document.createElement('iframe');
                child.setAttribute('name', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                return assert(child.contentWindow, test);
            },

            async function(div) {
                const test = object + (' : name attr before blocked (img)');
                const child = document.createElement('img');
                child.setAttribute('name', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                return assert(child, test);
            },

            async function(div) {
                const test = object + (' : html collection name & id (div , img)');
                const child = document.createElement('div');
                const child2 = document.createElement('img');
                child.setAttribute('id', test);
                child2.setAttribute('name', test);
                div.appendChild(child);
                div.appendChild(child2);
                await new Promise(r => setTimeout(r, 0));
                return assert(child2, test);
            },

            async function(div) {
                const test = object + (' : inner child (div > img)');
                const child = document.createElement('div');
                const child2 = document.createElement('img');
                child.setAttribute('id', 'RANDOM_123');
                child2.setAttribute('name', test);
                child.appendChild(child2);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                return assert(child2, test);
            },

            async function(div) {
                const test = object + (' : non html element (svg)');
                div.innerHTML = `<svg id="${test}">`;
                await new Promise(r => setTimeout(r, 0));
                return assert(div.firstChild, test);
            },

            async function(div) {
                const test = object + (' : non html element (math)');
                div.innerHTML = `<math id="${test}">`;
                await new Promise(r => setTimeout(r, 0));
                return assert(div.firstChild, test);
            },
        ];

        setup();
        for (const test of tests) {
            const [div] = before();
            const [passed, tester, reason] = await test(div);
            if (passed === null) {
                return;
            }
            let msg, color;
            if (!passed) {
                const result = document.getElementById('result-' + object);
                result.innerText = '❌';
                result.parentElement.parentElement.parentElement.setAttribute('open', '');
                color = 'red';
                msg = `test FAILED: "${tester}"`;
                console.error(msg, '\n', `REASON: ${reason}`, '\n', test);
            } else {
                color = 'green';
                msg = `test PASSED: "${tester}"`;
                console.info(msg, '\n', `REASON: ${reason}`, '\n', test);
            }
            div.innerHTML = `<span><b style="color: ${color}">${msg}</b> </span>`;
        }

    }
}());
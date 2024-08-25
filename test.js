window.TEST = (function(){
    return async function main(container, object) {
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

        function assert(test) {
            const results = ['window', 'document'].map(object => {
                try {
                    if (window[object][test] instanceof Element) {
                        return [false, test, `shield failed to prevent clobbering of ${object}["${test}"] (Element)`];
                    }
                    if (window[object][test] instanceof HTMLCollection) {
                        return [false, test, `shield failed to prevent clobbering of ${object}["${test}"] (HTMLCollection)`];
                    }
                    for (let i = 0; i < Infinity; i++) {
                        if (!window[i]) {
                            break;
                        }
                        if (window[object][test] === window[i] && window[i] === window[i].window) {
                            return [false, test, `shield failed to prevent clobbering of ${object}["${test}"] (Window)`];
                        }
                    }
                } catch (err) {
                    if (err.message === `${object}["${test}"] access attempt was intercepted:`) {
                        return [true, test, `shield worked, environment did not clobber ${object}["${test}"] (undefined)`];
                    }
                    return [false, test, `UNEXPECTED TEST RESULT WITH ERROR (TESTER MUST CHECK THIS): "${err.message}"`]
                }
                return [null];
            });
            if (results[0][0] === null && results[1][0] === null) {
                return [false, test, `UNEXPECTED TEST RESULT (TESTER MUST CHECK THIS)`];
            }
            if (results[0][0] === null) {
                return results[1];
            }
            if (results[1][0] === null) {
                return results[0];
            }
            if (results[0][0] === false) {
                return results[0];
            }
            if (results[1][0] === false) {
                return results[1];
            }
            if (results[0][0] === true && results[1][0] === true) {
                return results[1];
            }
            throw new Error(`UNEXPECTED TEST RESULT (TESTER MUST CHECK THIS)`);
        }

        const tests = [
            // allowlist

            async function(div) {
                const test = object + (' : allow list ignored (span)');
                const child = div.appendChild(document.createElement('span'));
                child.id = 'aaa';
                await new Promise(r => setTimeout(r, 0));
                return [!!window['window']['aaa'] || !!window['document']['aaa'], test];
            },

            // id

            async function(div) {
                const test = object + (' : id setter after blocked (span)');
                const child = div.appendChild(document.createElement('span'));
                child.id = test;
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
            },

            async function(div) {
                const test = object + (' : id attr after blocked (span)');
                const child = div.appendChild(document.createElement('span'));
                child.setAttribute('id', test);
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
            },

            async function(div) {
                const test = object + (' : id setter before blocked (span)');
                const child = document.createElement('span');
                child.id = test;
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
            },

            async function(div) {
                const test = object + (' : id attr before blocked (span)');
                const child = document.createElement('span');
                child.setAttribute('id', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
            },

            // name

            async function(div) {
                const test = object + (' : name attr before ignored (iframe)');
                const child = document.createElement('iframe');
                child.setAttribute('name', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
            },

            async function(div) {
                const test = object + (' : name attr after ignored (iframe)');
                const child = div.appendChild(document.createElement('iframe'));
                child.setAttribute('name', test);
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
            },

            async function(div) {
                const test = object + (' : name attr before blocked (iframe)');
                const child = document.createElement('iframe');
                child.setAttribute('name', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
            },

            async function(div) {
                const test = object + (' : name attr before blocked (img)');
                const child = document.createElement('img');
                child.setAttribute('name', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
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
                return assert(test);
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
                return assert(test);
            },

            async function(div) {
                const test = object + (' : non html element (svg)');
                div.innerHTML = `<svg id="${test}">`;
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
            },

            async function(div) {
                const test = object + (' : non html element (math)');
                div.innerHTML = `<math id="${test}">`;
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
            },

            async function(div) {
                const test = 'querySelector';
                div.innerHTML = `<embed name="${test}">`;
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
            },

            async function(div) {
                const test = 'cookie';
                div.innerHTML = `<embed name="${test}">`;
                await new Promise(r => setTimeout(r, 0));
                return assert(test);
            },
        ];

        setup();
        for (const test of tests) {
            const [div] = before();
            const [passed, tester, reason] = await test(div);
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
window.TEST = (function(){
    return async function main(container) {
        function setup() {
            container.innerHTML = '<b>Tests</b> <i>(see in console)</i>';
            container.style.border = '1px solid';
            container.style.padding = '7px';
            container.style.fontSize = '13px';
        }

        function before() {
            return [
                container.appendChild(document.createElement('div')),
            ];
        }

        const tests = [
            // allowlist

            async function(div) {
                const test = 'allow list ignored (span)';
                const child = div.appendChild(document.createElement('span'));
                child.id = 'aaa';
                await new Promise(r => setTimeout(r, 0));
                try {window['aaa']} catch (err) {
                    return [false, test];
                }
                return [true, test];
            },

            // id

            async function(div) {
                const test = 'id setter after blocked (span)';
                const child = div.appendChild(document.createElement('span'));
                child.id = test;
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [true, test];
                }
                return [false, test];
            },

            async function(div) {
                const test = 'id attr after blocked (span)';
                const child = div.appendChild(document.createElement('span'));
                child.setAttribute('id', test);
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [true, test];
                }
                return [false, test];
            },

            async function(div) {
                const test = 'id setter before blocked (span)';
                const child = document.createElement('span');
                child.id = test;
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [true, test];
                }
                return [false, test];
            },

            async function(div) {
                const test = 'id attr before blocked (span)';
                const child = document.createElement('span');
                child.setAttribute('id', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [true, test];
                }
                return [false, test];
            },

            // name

            async function(div) {
                const test = 'name attr after ignored (iframe)';
                const child = div.appendChild(document.createElement('iframe'));
                child.setAttribute('name', test);
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [false, test];
                }
                return [true, test];
            },

            async function(div) {
                const test = 'name attr before ignored (iframe)';
                const child = document.createElement('iframe');
                child.setAttribute('name', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [true, test];
                }
                return [false, test];
            },

            async function(div) {
                const test = 'name attr after ignored (iframe)';
                const child = div.appendChild(document.createElement('iframe'));
                child.setAttribute('name', test);
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [false, test];
                }
                return [true, test];
            },

            async function(div) {
                const test = 'name attr before blocked (iframe)';
                const child = document.createElement('iframe');
                child.setAttribute('name', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [true, test];
                }
                return [false, test];
            },

            async function(div) {
                const test = 'name attr before blocked (img)';
                const child = document.createElement('img');
                child.setAttribute('name', test);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [true, test];
                }
                return [false, test];
            },

            async function(div) {
                const test = 'html collection name & id (div , img)';
                const child = document.createElement('div');
                const child2 = document.createElement('img');
                child.setAttribute('id', test);
                child2.setAttribute('name', test);
                div.appendChild(child);
                div.appendChild(child2);
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [true, test];
                }
                return [false, test];
            },

            async function(div) {
                const test = 'inner child (div > img)';
                const child = document.createElement('div');
                const child2 = document.createElement('img');
                child.setAttribute('id', 'RANDOM_123');
                child2.setAttribute('name', test);
                child.appendChild(child2);
                div.appendChild(child);
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [true, test];
                }
                return [false, test];
            },

            async function(div) {
                const test = 'non html element (svg)';
                div.innerHTML = `<svg id="${test}">`;
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [true, test];
                }
                return [false, test];
            },

            async function(div) {
                const test = 'non html element (math)';
                div.innerHTML = `<math id="${test}">`;
                await new Promise(r => setTimeout(r, 0));
                try {window[test]} catch (err) {
                    return [true, test];
                }
                return [false, test];
            },
        ];

        setup();
        for (const test of tests) {
            const [div] = before();
            const [passed, tester] = await test(div);
            let msg, color;
            if (!passed) {
                color = 'red';
                msg = `test FAILED: "${tester}"`;
                console.error(msg, ':', test);
            } else {
                color = 'green';
                msg = `test PASSED: "${tester}"`;
                console.info(msg, ':', test);
            }
            div.innerHTML = `<span><b style="color: ${color}">${msg}</b> </span>`;
        }
    }
}());
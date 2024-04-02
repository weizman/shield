# Shield JS 🛡

Shield ([npm](https://www.npmjs.com/package/shieldjs)) is a tiny JavaScript shim/library that applies protection against
[DOM Clobbering attacks](https://portswigger.net/web-security/dom-based/dom-clobbering)
at runtime with close to zero integration friction.

> See for yourself - visit live [demo/playground](https://weizmangal.com/shield)

## Installation

Include Shield via a script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/shieldjs/shield.min.js"></script>
```

That's it. It's best to include it as close as possible to the beginning of the `<head>` (the earliest it runs, the better it protects).

## Usage

Shield supports optional configuration:

```html
<script src="https://cdn.jsdelivr.net/npm/shieldjs/shield.min.js"
        allowlist="id1,id2"
        reportOnly="false"
        reportTo="https://report-server/report/"
></script>
```

* `allowlist` - a list of ids you allow to be clobbered into the DOM (shield will overlook them when applying its protection).
* `reportOnly` - whether to report forbidden access attempt or to throw an error. If enabled, `reportTo` must also be provided.
* `reportTo` - a valid `https:` URL to report forbidden access attempt to in case `reportOnly` is enabled (CSP format):

```json
{
    "csp-report": {
        "blocked-property": "id3",
        "disposition": "report",
        "document-uri": "https://my-app.com/some-route/",
        "effective-directive": "dom-clobbering",
        "original-policy": "no-access",
        "referrer": "https://my-app.com/some-route/",
        "violated-directive": "dom-clobbering"
    }
}
```

## About

* EXPERIMENTAL ⚠️ - Use at your own risk
* Compressed online using [https://www.toptal.com/developers/javascript-minifier](https://www.toptal.com/developers/javascript-minifier)
* By [Gal Weizman](https://weizmangal.com)
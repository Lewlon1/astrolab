# Meta ad URLs for the /apply split test (lp_r1)

Paste these as the ad's **Website URL** in Meta Ads Manager. Use `www.`: the bare domain redirects, which adds a hop on every click.

`{{ad.name}}` is a Meta dynamic parameter. Meta replaces it with the ad's name, so name ads clearly (for example `c2_static_v1`).

## UK (£), one ad set

| Concept | URL |
|---|---|
| c1 | `https://www.theastropsychelab.com/apply/uk?c=c1&utm_source=meta&utm_medium=paid_social&utm_campaign=lp_r1&utm_content={{ad.name}}` |
| c2 | `https://www.theastropsychelab.com/apply/uk?c=c2&utm_source=meta&utm_medium=paid_social&utm_campaign=lp_r1&utm_content={{ad.name}}` |
| c3 | `https://www.theastropsychelab.com/apply/uk?c=c3&utm_source=meta&utm_medium=paid_social&utm_campaign=lp_r1&utm_content={{ad.name}}` |
| c4 | `https://www.theastropsychelab.com/apply/uk?c=c4&utm_source=meta&utm_medium=paid_social&utm_campaign=lp_r1&utm_content={{ad.name}}` |
| c5 | `https://www.theastropsychelab.com/apply/uk?c=c5&utm_source=meta&utm_medium=paid_social&utm_campaign=lp_r1&utm_content={{ad.name}}` |

## US ($), one ad set

| Concept | URL |
|---|---|
| c1 | `https://www.theastropsychelab.com/apply/us?c=c1&utm_source=meta&utm_medium=paid_social&utm_campaign=lp_r1&utm_content={{ad.name}}` |
| c2 | `https://www.theastropsychelab.com/apply/us?c=c2&utm_source=meta&utm_medium=paid_social&utm_campaign=lp_r1&utm_content={{ad.name}}` |
| c3 | `https://www.theastropsychelab.com/apply/us?c=c3&utm_source=meta&utm_medium=paid_social&utm_campaign=lp_r1&utm_content={{ad.name}}` |
| c4 | `https://www.theastropsychelab.com/apply/us?c=c4&utm_source=meta&utm_medium=paid_social&utm_campaign=lp_r1&utm_content={{ad.name}}` |
| c5 | `https://www.theastropsychelab.com/apply/us?c=c5&utm_source=meta&utm_medium=paid_social&utm_campaign=lp_r1&utm_content={{ad.name}}` |

## Rules for the test

- **One ad set per market.** Don't split the variants by ad set. The site assigns A or B, so Meta's delivery can't bias the split.
- **Never put `v=` in an ad URL.** `?v=a` / `?v=b` are for QA only: they mark the visit `qa=true`, and the readout drops it.
- **Don't edit live ads mid-test.** Editing resets learning and mixes two versions under one name. Duplicate the ad instead, and give the copy a new name.
- **Optimise for `Lead`** (fired when the email is captured, after cookie consent) in round 1. There won't be enough `Schedule` events (booked calls) to optimise on.
- A concept key the site doesn't know (`c9`, or a typo) falls back to the default hero. Check each ad's preview link opens the right headline before publishing.

## Checking an ad before launch

1. Open the URL in a private window. The headline should match the ad's concept, and the price should show in the right currency.
2. To see a specific variant, add `&v=a` or `&v=b`. That browser is then flagged as QA for 30 days. Clear the `lp_v` and `lp_qa` cookies to reset it.

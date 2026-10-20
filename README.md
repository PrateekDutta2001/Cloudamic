# Cloudamic

Production AWS reference for designing, deploying, and scaling a complete AI application. The worked example is **Harbor Claims**, a property-claims copilot: it can draft a payment and cannot submit one.

Open `index.html` in a browser. No build step and no server are required.

## Tabs

| Tab | What it covers |
| --- | --- |
| Generic architecture | The system diagram, the path of one adjuster question, and which connections are allowed |
| Services | Compute, network, data, security, integration, and delivery services, each with a latest-practice note |
| AI specific services | Bedrock, AgentCore, knowledge bases, guardrails, evaluations, and the agent, retrieval, and payment flows |
| Deployment pipeline | Accounts and keys first, then git to dev, approval, production, canary, and rollback |
| Scalability | How each tier scales in a storm week, the knob for that tier, and the ceiling you set on purpose |

Search jumps to a service. Selecting a box in a diagram opens that service’s job on the path. Opening a brief shows the working flow, a production example, the latest update, and what it connects to.

## Project layout

```
index.html          App shell and footer
css/styles.css      Layout, diagrams, and responsive rules
js/services.js      Service briefs
js/app.js           Tabs, diagrams, and search
```

## Using it

- Phone, tablet, and desktop layouts stack the diagrams on narrow screens and keep service pills in rows on wide ones.
- Current browsers (Chrome, Edge, Firefox, and Safari) are supported. The page uses a system font stack if the web fonts do not load.
- Direct links: `#/architecture`, `#/services`, `#/ai`, `#/pipeline`, `#/scalability`. A service brief is `#/services/lambda` or `#/ai/bedrock`.

## What the example assumes

Harbor Claims runs in one region until AgentCore, the knowledge base, and Aurora are all actually available in a second region. User tokens stop at API Gateway. Lambda calls the agent runtime with IAM. Tools go through the gateway. Payments over the threshold wait in Step Functions.

Service behavior, regional availability, and prices change. Notes through 2026 follow Amazon Bedrock AgentCore release notes and the Managed Knowledge Base and Guardrails announcements. Confirm current AWS documentation before you depend on a feature.

## License

© 2026 [Prateek Dutta](https://prateekdutta2001.github.io/PrateekDutta.in/). This work is MIT licensed.

Permission is granted to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of this work, subject to including the copyright notice and this permission notice in all copies.
